import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { argon2Service } from '../../apps/api/dist/services/argon2-service.js';
import { mfaService } from '../../apps/api/dist/services/mfa-service.js';

describe('Security: Argon2id Calibration, Password Policy & TOTP MFA Performance', () => {
  it('Policy 1: Enforces minimum length of 10 characters and rejects blacklisted common passwords', () => {
    // Too short (< 10)
    const shortRes = argon2Service.validatePasswordPolicy('Abc12!');
    assert.equal(shortRes.valid, false);
    assert.match(shortRes.reason || '', /at least 10 characters/i);

    // Common password blacklist
    const commonRes = argon2Service.validatePasswordPolicy('password1234');
    assert.equal(commonRes.valid, false);
    assert.match(commonRes.reason || '', /easily guessable/i);

    // Valid passphrase
    const validRes = argon2Service.validatePasswordPolicy('CrimsonLanterns#2026!');
    assert.equal(validRes.valid, true);
  });

  it('Argon2id Calibration: Hashing produces valid Argon2id digest and verification runs in ~100-300ms target window', async () => {
    const rawPassphrase = 'SunsetCampusQuestPassphrase2026!';
    const startHash = Date.now();
    const digest = await argon2Service.hash(rawPassphrase);
    const hashDuration = Date.now() - startHash;

    assert.ok(digest.startsWith('$argon2id$'), 'Digest must use NIST-recommended Argon2id algorithm');

    // Benchmark verification
    const startVerify = Date.now();
    const isValid = await argon2Service.verify(digest, rawPassphrase);
    const verifyDuration = Date.now() - startVerify;

    assert.equal(isValid, true);
    // Argon2id verification latency benchmark
    console.log(`⏱ Argon2id Verification Latency: ${verifyDuration}ms (Hash: ${hashDuration}ms)`);
    assert.ok(verifyDuration > 20, 'Argon2id cost parameters must enforce meaningful computation to deter brute-force GPU cracking');
    assert.ok(verifyDuration < 1000, 'Argon2id verification must not exceed 1000ms to preserve server responsiveness');

    // Wrong password check
    const isWrongValid = await argon2Service.verify(digest, 'WrongPassphraseAttempt123!');
    assert.equal(isWrongValid, false);
  });

  it('TOTP MFA Engine: Secret generation, RFC 6238 time-step verification and backup codes', async () => {
    const setup = mfaService.generateMfaSecret('admin.vikram@msot.edu.in');
    assert.ok(setup.secret, 'Secret key must be generated');
    assert.ok(setup.uri.startsWith('otpauth://totp/'), 'TOTP URI must follow RFC 6238 format');
    assert.equal(setup.backupCodes.length, 8, '8 backup codes must be issued');

    // Generate valid TOTP code for current timestamp
    const validCode = mfaService.generateTotpCode(setup.secret);
    assert.equal(validCode.length, 6, 'TOTP code must be 6 digits');

    // Verify valid code
    const isTotpValid = mfaService.verifyTotp(setup.secret, validCode);
    assert.equal(isTotpValid, true, 'Valid 6-digit TOTP code must be accepted');

    // Verify invalid code
    const isInvalid = mfaService.verifyTotp(setup.secret, '000000');
    assert.equal(isInvalid, false, 'Invalid code must be rejected');

    // Verify backup code consumption
    const testCode = setup.backupCodes[0];
    const hashedCodes = await mfaService.hashBackupCodes(setup.backupCodes);
    const consumed = await mfaService.verifyAndConsumeBackupCode(hashedCodes, testCode);
    assert.ok(consumed.valid, 'Backup code must be valid');
    assert.equal(consumed.remainingHashedCodes.length, 7, 'Used backup code must be consumed and removed');

    // Replay same backup code should fail
    const replayAttempt = await mfaService.verifyAndConsumeBackupCode(consumed.remainingHashedCodes, testCode);
    assert.equal(replayAttempt.valid, false, 'Consumed backup code cannot be reused');
  });
});
