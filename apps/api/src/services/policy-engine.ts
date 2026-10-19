import { User, UserRole, UserScope } from '@msot/shared';
import { db } from '../db.js';

/**
 * Central Deny-by-Default Authorization Policy Engine
 * Evaluates Role-Based (RBAC) and Attribute-Based (ABAC) constraints
 * across physical campuses, academic courses, and sections.
 */

export type AuthAction =
  | 'VIEW_SELF'
  | 'UPDATE_SELF'
  | 'SUBMIT_LEARNING_ACTION'
  | 'VIEW_LEAGUE_LEADERBOARD'
  | 'FACULTY_VIEW_SECTION'
  | 'FACULTY_VOID_XP'
  | 'FACULTY_NUDGE_STUDENT'
  | 'FACULTY_REVIEW_QUESTIONS'
  | 'ADMIN_IMPORT_ROSTER'
  | 'ADMIN_MANAGE_USERS'
  | 'ADMIN_CHANGE_USER_ROLE'
  | 'ADMIN_VIEW_AUDIT_LOGS'
  | 'ADMIN_MANAGE_SETTINGS';

export interface AuthContext {
  user: User;
  scope: UserScope;
}

export interface PolicyCheckResult {
  allowed: boolean;
  reason?: string;
}

export class PolicyEngine {
  /**
   * Retrieves the authoritative scope for a user, including faculty section assignments.
   */
  getUserScope(user: User): UserScope {
    const assignments = Array.from(db.facultyAssignments.values()).filter(
      a => a.facultyId === user.id
    );

    return {
      role: user.role,
      assignedCampuses: Array.from(new Set(assignments.map(a => a.campusId))),
      assignedCourses: Array.from(new Set(assignments.map(a => a.courseId))),
      assignedSections: Array.from(new Set(assignments.map(a => a.sectionId))),
    };
  }

  /**
   * Evaluates access permissions under a strict DENY-BY-DEFAULT policy.
   */
  authorize(
    context: AuthContext | null | undefined,
    action: AuthAction,
    targetResource?: {
      targetUserId?: string;
      campusId?: string;
      sectionId?: string;
    }
  ): PolicyCheckResult {
    // 1. Unauthenticated requests are immediately denied
    if (!context || !context.user) {
      return { allowed: false, reason: 'Authentication required' };
    }

    const { user, scope } = context;

    // 2. Suspended or deactivated accounts have ZERO access to any protected action
    if (user.status === 'SUSPENDED' || user.status === 'DEACTIVATED') {
      return { allowed: false, reason: 'Account is suspended or deactivated' };
    }

    // 3. Admin has global override authority (except writing to official academic grades, which is blocked at data layer)
    if (user.role === 'ADMIN') {
      return { allowed: true };
    }

    // 4. Role-specific evaluation
    switch (action) {
      case 'VIEW_SELF':
      case 'UPDATE_SELF': {
        const isSelf = targetResource?.targetUserId === user.id;
        return isSelf
          ? { allowed: true }
          : { allowed: false, reason: 'Cannot view or edit another user account' };
      }

      case 'SUBMIT_LEARNING_ACTION': {
        if (user.role !== 'STUDENT') {
          return { allowed: false, reason: 'Only students can submit daily runs or battles' };
        }
        if (user.status !== 'ACTIVE') {
          return { allowed: false, reason: 'Student account must be active to earn XP' };
        }
        return { allowed: true };
      }

      case 'VIEW_LEAGUE_LEADERBOARD': {
        return { allowed: true }; // Anonymity is applied at serialization layer
      }

      case 'FACULTY_VIEW_SECTION':
      case 'FACULTY_VOID_XP':
      case 'FACULTY_NUDGE_STUDENT': {
        if (user.role !== 'FACULTY') {
          return { allowed: false, reason: 'Faculty authorization required' };
        }

        // Must match assigned section scope
        if (targetResource?.sectionId) {
          const isAssigned = scope.assignedSections.includes(targetResource.sectionId);
          return isAssigned
            ? { allowed: true }
            : { allowed: false, reason: 'Faculty is not assigned to this campus section' };
        }

        // If targetUserId is given, look up student's section
        if (targetResource?.targetUserId) {
          const targetStudent = db.users.get(targetResource.targetUserId);
          if (!targetStudent) {
            return { allowed: false, reason: 'Student not found' };
          }
          const isAssigned = scope.assignedSections.includes(targetStudent.sectionId);
          return isAssigned
            ? { allowed: true }
            : { allowed: false, reason: 'Student does not belong to faculty assigned section' };
        }

        return { allowed: false, reason: 'Target section or student required for faculty scoping' };
      }

      case 'FACULTY_REVIEW_QUESTIONS': {
        return user.role === 'FACULTY'
          ? { allowed: true }
          : { allowed: false, reason: 'Faculty role required' };
      }

      case 'ADMIN_IMPORT_ROSTER':
      case 'ADMIN_MANAGE_USERS':
      case 'ADMIN_CHANGE_USER_ROLE':
      case 'ADMIN_VIEW_AUDIT_LOGS':
      case 'ADMIN_MANAGE_SETTINGS': {
        return { allowed: false, reason: 'Administrator privileges required' };
      }

      default:
        // Absolute Deny by Default
        return { allowed: false, reason: 'Unrecognized action or policy violation' };
    }
  }

  /**
   * Data-layer scoping: filters an array of students to only those within faculty's assigned sections.
   */
  filterStudentsForFaculty(facultyUser: User, students: User[]): User[] {
    if (facultyUser.role === 'ADMIN') return students;
    const scope = this.getUserScope(facultyUser);
    return students.filter(s => scope.assignedSections.includes(s.sectionId));
  }

  /**
   * Server-side anonymity mask: guarantees peers NEVER see real name or raw studentId of anonymous users.
   */
  anonymizeStudentForViewer(student: User, viewer: User | null): {
    studentId: string;
    displayName: string;
    avatarId: string;
    isAnonymous: boolean;
  } {
    // 1. Viewer is looking at themselves -> show real name with anonymity indicator
    if (viewer && viewer.id === student.id) {
      return {
        studentId: student.id,
        displayName: `${student.name} (You)`,
        avatarId: student.avatarId,
        isAnonymous: student.isAnonymous,
      };
    }

    // 2. Viewer is an assigned faculty member or admin -> show real name for educational guidance
    if (viewer && (viewer.role === 'ADMIN' || viewer.role === 'FACULTY')) {
      const scope = this.getUserScope(viewer);
      if (viewer.role === 'ADMIN' || scope.assignedSections.includes(student.sectionId)) {
        return {
          studentId: student.id,
          displayName: student.isAnonymous ? `${student.name} [Anon: ${student.anonymousAlias}]` : student.name,
          avatarId: student.avatarId,
          isAnonymous: student.isAnonymous,
        };
      }
    }

    // 3. Peer student view -> if anonymous, strictly mask ID and real name
    if (student.isAnonymous) {
      return {
        studentId: 'anon',
        displayName: student.anonymousAlias,
        avatarId: 'avatar_masked',
        isAnonymous: true,
      };
    }

    // 4. Public opt-in view
    return {
      studentId: student.id,
      displayName: student.name,
      avatarId: student.avatarId,
      isAnonymous: false,
    };
  }
}

export const policyEngine = new PolicyEngine();
