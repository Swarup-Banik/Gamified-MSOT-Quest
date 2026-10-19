import crypto from 'node:crypto';
import { db } from '../db.js';

/**
 * RFC 6238 TOTP Multi-Factor Authentication Engine
 * Supports standard Authenticator apps (Google Authenticator, Microsoft Authenticator, 1Password)
 * with base32 secret encoding, QR URI generation, and hashed backup recovery codes.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export class MfaService {
  // Re-authentication tickets for sensitive admin actions (5-minute validity)
  private stepUpTickets = new Map<string, { userId: string; expiresAt: number }>();

  /**
   * Encodes a buffer into RFC 4648 Base32 string.
   */
  base32Encode(buffer: Buffer): string {
    let bits = 0;
    let value = 0;
    let output = '';

    for (let i = 0; i < buffer.length; i++) {
      value = (value << 8) | buffer[i];
      bits += 8;

      while (bits >= 5) {
        output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }

    if (bits > 0) {
      output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
    }

    return output;
  }

  /**
   * Decodes an RFC 4648 Base32 string into a Buffer.
   */
  base32Decode(base32Str: string): Buffer {
    const cleaned = base32Str.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];

    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      const index = BASE32_ALPHABET.indexOf(char);
      if (index === -1) {
        throw new Error(`Invalid Base32 character: ${char}`);
      }

      value = (value << 5) | index;
      bits += 5;

      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 255);
        bits -= 8;
      }
    }

    return Buffer.from(bytes);
  }

  /**
   * Generates a new 20-byte cryptographically secure Base32 secret.
   */
  generateSecret(): string {
    const buffer = crypto.randomBytes(20);
    return this.base32Encode(buffer);
  }

  /**
   * Computes an RFC 6238 TOTP code for a secret at a given counter step.
   */
  computeCode(secretBase32: string, counter: number): string {
    const key = this.base32Decode(secretBase32);
    const counterBuf = Buffer.alloc(8);
    counterBuf.writeBigUInt64BE(BigInt(counter), 0);

    const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  }

  /**
   * Generates standard OTP Auth URL for scanning via Authenticator app.
   */
  getOtpAuthUrl(email: string, secretBase32: string, issuer: string = 'MSOT Quest'): string {
    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  }

  /**
   * Generates a complete MFA setup bundle including Base32 secret, QR URI, and backup codes.
   */
  generateMfaSecret(email: string, issuer: string = 'MSOT Quest'): {
    secret: string;
    uri: string;
    backupCodes: string[];
    hashedBackupCodes: string[];
  } {
    const secret = this.generateSecret();
    const uri = this.getOtpAuthUrl(email, secret, issuer);
    const { plainTextCodes, hashedCodes } = this.generateBackupCodes();
    return {
      secret,
      uri,
      backupCodes: plainTextCodes,
      hashedBackupCodes: hashedCodes,
    };
  }

  /**
   * Generates current 6-digit TOTP code for a secret (for testing and verification).
   */
  generateTotpCode(secretBase32: string): string {
    const timeStep = 30;
    const currentCounter = Math.floor(Date.now() / 1000 / timeStep);
    return this.computeCode(secretBase32, currentCounter);
  }

  /**
   * Verifies a 6-digit TOTP code against a secret with ±1 time step tolerance (clock drift).
   */
  verifyTotp(secretBase32: string, token: string): boolean {
    if (!token || token.length !== 6 || !/^\d+$/.test(token)) return false;

    const timeStep = 30;
    const currentCounter = Math.floor(Date.now() / 1000 / timeStep);

    // Check t-1, t, t+1
    for (let offset = -1; offset <= 1; offset++) {
      const calculated = this.computeCode(secretBase32, currentCounter + offset);
      if (crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(token))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Generates 8 single-use alphanumeric backup codes and their SHA-256 hashes.
   */
  generateBackupCodes(): { plainTextCodes: string[]; hashedCodes: string[] } {
    const plainTextCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < 8; i++) {
      const code = crypto.randomBytes(5).toString('hex').toUpperCase(); // 10 chars
      const hash = crypto.createHash('sha256').update(code).digest('hex');
      plainTextCodes.push(code);
      hashedCodes.push(hash);
    }

    return { plainTextCodes, hashedCodes };
  }

  /**
   * Hashes plain-text backup codes with SHA-256 for secure storage.
   */
  hashBackupCodes(codes: string[]): string[] {
    return codes.map(c => {
      const normalized = c.toUpperCase().replace(/[^A-Z0-9]/g, '');
      return crypto.createHash('sha256').update(normalized).digest('hex');
    });
  }

  /**
   * Verifies and consumes a single-use backup code from a hashed code array.
   */
  verifyAndConsumeBackupCode(
    hashedCodes: string[],
    enteredCode: string
  ): { valid: boolean; remainingHashedCodes: string[] } {
    if (!enteredCode || !hashedCodes || !hashedCodes.length) {
      return { valid: false, remainingHashedCodes: hashedCodes || [] };
    }
    const normalized = enteredCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const enteredHash = crypto.createHash('sha256').update(normalized).digest('hex');
    const index = hashedCodes.indexOf(enteredHash);
    if (index !== -1) {
      const remaining = [...hashedCodes];
      remaining.splice(index, 1);
      return { valid: true, remainingHashedCodes: remaining };
    }
    return { valid: false, remainingHashedCodes: [...hashedCodes] };
  }

  /**
   * Verifies and consumes a backup code for a user.
   */
  consumeBackupCode(userId: string, enteredCode: string): boolean {
    const mfa = db.mfaSecrets.get(userId);
    if (!mfa || !mfa.isEnabled || !mfa.backupCodesHash) return false;

    const normalized = enteredCode.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const enteredHash = crypto.createHash('sha256').update(normalized).digest('hex');

    const index = mfa.backupCodesHash.indexOf(enteredHash);
    if (index !== -1) {
      // Consume the code
      mfa.backupCodesHash.splice(index, 1);
      db.mfaSecrets.set(userId, mfa);
      return true;
    }

    return false;
  }

  /**
   * Issues a short-lived step-up re-authentication ticket for sensitive admin operations.
   */
  issueStepUpTicket(userId: string): string {
    const ticket = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    this.stepUpTickets.set(ticket, { userId, expiresAt });
    return ticket;
  }

  /**
   * Verifies a step-up ticket.
   */
  verifyStepUpTicket(userId: string, ticket: string): boolean {
    if (!ticket) return false;
    const record = this.stepUpTickets.get(ticket);
    if (!record) return false;

    if (record.userId !== userId || Date.now() > record.expiresAt) {
      this.stepUpTickets.delete(ticket);
      return false;
    }

    return true;
  }
}

export const mfaService = new MfaService();
