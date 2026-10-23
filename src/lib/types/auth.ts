export type UserRole = "Director" | "Sales User" | "System Manager" | "Administrator";
export type PrimaryRole = "Director" | "Sales User";

export interface UserPermissions {
  canViewFees: boolean;
  canManageFees: boolean;
  canAdmitStudents: boolean;
  canEditStudents: boolean;
  canViewSystemStatus: boolean;
  canViewExecutiveFinancials: boolean;
}

export interface AuthUser {
  email: string;
  fullName: string;
  roles: string[];
  primaryRole: PrimaryRole | null;
  permissions: UserPermissions | null;
  loginTime?: string;
  frappeUrl?: string;
}

export interface UserSessionData extends AuthUser {
  sid?: string;
}

export interface RoleResolutionResult {
  primaryRole: PrimaryRole | null;
  hasAuthorizedRole: boolean;
  permissions: UserPermissions | null;
}

/**
 * Resolves high-level primary role and granular permissions from Frappe roles array.
 * If user does not possess either Director or Sales User privileges, returns hasAuthorizedRole: false.
 */
export function resolveUserRoleAndPermissions(roles: string[] = []): RoleResolutionResult {
  const isDirector = roles.some((r) =>
    ["Director", "System Manager", "Administrator"].includes(r)
  );

  if (isDirector) {
    return {
      primaryRole: "Director",
      hasAuthorizedRole: true,
      permissions: {
        canViewFees: true,
        canManageFees: true,
        canAdmitStudents: true,
        canEditStudents: true,
        canViewSystemStatus: true,
        canViewExecutiveFinancials: true,
      },
    };
  }

  const isSalesUser = roles.some((r) =>
    ["Sales User", "Sales Manager"].includes(r)
  );

  if (isSalesUser) {
    return {
      primaryRole: "Sales User",
      hasAuthorizedRole: true,
      permissions: {
        canViewFees: false,
        canManageFees: false,
        canAdmitStudents: true,
        canEditStudents: true,
        canViewSystemStatus: false,
        canViewExecutiveFinancials: false,
      },
    };
  }

  // Any other role or unassigned user -> Access restricted
  return {
    primaryRole: null,
    hasAuthorizedRole: false,
    permissions: null,
  };
}
