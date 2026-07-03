const crypto = require("node:crypto");

const USER_ROLES = new Set([
  "Owner",
  "Admin",
  "Accountant",
  "Teacher",
  "Viewer",
]);
const PASSWORD_KEY_LENGTH = 64;
const MINIMUM_PASSWORD_LENGTH = 8;

function requiredText(value, fieldName) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    throw new Error(`${fieldName} is required.`);
  }
  return text;
}

function validatePassword(password) {
  if (typeof password !== "string" || password.length < MINIMUM_PASSWORD_LENGTH) {
    throw new Error(
      `Password must be at least ${MINIMUM_PASSWORD_LENGTH} characters.`,
    );
  }
  return password;
}

function createPasswordCredentials(password) {
  const validPassword = validatePassword(password);
  const passwordSalt = crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto
    .scryptSync(validPassword, passwordSalt, PASSWORD_KEY_LENGTH)
    .toString("hex");
  return { passwordHash, passwordSalt };
}

function verifyPassword(password, storedHash, storedSalt) {
  if (
    typeof password !== "string" ||
    typeof storedHash !== "string" ||
    typeof storedSalt !== "string"
  ) {
    return false;
  }

  try {
    const expected = Buffer.from(storedHash, "hex");
    const actual = crypto.scryptSync(password, storedSalt, expected.length);
    return (
      expected.length === actual.length &&
      crypto.timingSafeEqual(expected, actual)
    );
  } catch {
    return false;
  }
}

function createAuthService(database) {
  let currentUser = null;

  function requireAuthenticated() {
    if (!currentUser) {
      throw new Error("Authentication is required.");
    }
    return currentUser;
  }

  function requireRoles(allowedRoles) {
    const user = requireAuthenticated();
    if (!allowedRoles.includes(user.role)) {
      throw new Error("You do not have permission to perform this action.");
    }
    return user;
  }

  function audit(action, module, details = "", user = currentUser) {
    return database.createAuditLog(user, action, module, details);
  }

  function ensureManagerMayManage(target, nextRole) {
    const manager = requireRoles(["Owner", "Admin"]);
    if (
      manager.role === "Admin" &&
      (target?.role === "Owner" || nextRole === "Owner")
    ) {
      throw new Error("Only an Owner can manage Owner accounts.");
    }
    return manager;
  }

  return {
    hasUsers() {
      return database.getUserCount() > 0;
    },

    createFirstOwner(input) {
      if (database.getUserCount() > 0) {
        throw new Error("The first Owner account has already been created.");
      }
      const credentials = createPasswordCredentials(input?.password);
      const owner = database.createUserRecord({
        name: input?.name,
        username: input?.username,
        email: input?.email,
        role: "Owner",
        status: "Active",
        ...credentials,
      });
      audit(
        "First Owner created",
        "Users",
        `Owner account "${owner.username}" was created.`,
        owner,
      );
      return owner;
    },

    login(username, password) {
      const normalizedUsername = requiredText(username, "Username");
      const record = database.getUserAuthRecord(normalizedUsername);
      if (
        !record ||
        record.status !== "Active" ||
        !verifyPassword(password, record.password_hash, record.password_salt)
      ) {
        throw new Error("Invalid username or password.");
      }
      currentUser = database.updateUserLastLogin(record.id);
      audit("User login", "Authentication", "Offline login successful.");
      return currentUser;
    },

    logout() {
      if (currentUser) {
        audit("User logout", "Authentication", "User logged out.");
      }
      currentUser = null;
      return { success: true };
    },

    getCurrentUser() {
      if (!currentUser) return null;
      const refreshed = database.getUserById(currentUser.id);
      if (!refreshed || refreshed.status !== "Active") {
        currentUser = null;
        return null;
      }
      currentUser = refreshed;
      return currentUser;
    },

    changePassword(userId, oldPassword, newPassword) {
      const user = requireAuthenticated();
      if (user.id !== requiredText(userId, "User id")) {
        throw new Error("You can only change your own password.");
      }
      const record = database.getUserAuthRecord(user.username);
      if (
        !record ||
        !verifyPassword(
          oldPassword,
          record.password_hash,
          record.password_salt,
        )
      ) {
        throw new Error("Current password is incorrect.");
      }
      const credentials = createPasswordCredentials(newPassword);
      database.setUserPassword(
        user.id,
        credentials.passwordHash,
        credentials.passwordSalt,
      );
      audit("Password changed", "Users", "User changed their own password.");
      return { success: true };
    },

    getUsers() {
      requireRoles(["Owner", "Admin"]);
      return database.getUsers();
    },

    createUser(input) {
      const manager = requireRoles(["Owner", "Admin"]);
      const role = requiredText(input?.role, "Role");
      if (!USER_ROLES.has(role)) {
        throw new Error("User role is invalid.");
      }
      if (manager.role === "Admin" && role === "Owner") {
        throw new Error("Only an Owner can create another Owner.");
      }
      const credentials = createPasswordCredentials(input?.password);
      const user = database.createUserRecord({
        name: input?.name,
        username: input?.username,
        email: input?.email,
        role,
        status: input?.status,
        ...credentials,
      });
      audit(
        "User created",
        "Users",
        `Created ${user.role} account "${user.username}".`,
      );
      return user;
    },

    updateUser(id, input) {
      const target = database.getUserById(id);
      if (!target) {
        throw new Error("User record was not found.");
      }
      const nextRole = input?.role ?? target.role;
      const manager = ensureManagerMayManage(target, nextRole);
      if (
        manager.id === target.id &&
        ((input?.role && input.role !== target.role) ||
          (input?.status && input.status !== "Active"))
      ) {
        throw new Error("You cannot change your own role or deactivate yourself.");
      }
      const user = database.updateUserRecord(id, input);
      if (currentUser?.id === user.id) {
        currentUser = user;
      }
      audit(
        "User updated",
        "Users",
        `Updated account "${user.username}".`,
      );
      return user;
    },

    resetUserPassword(id, newPassword) {
      const target = database.getUserById(id);
      if (!target) {
        throw new Error("User record was not found.");
      }
      ensureManagerMayManage(target, target.role);
      const credentials = createPasswordCredentials(newPassword);
      database.setUserPassword(
        target.id,
        credentials.passwordHash,
        credentials.passwordSalt,
      );
      audit(
        "Password reset",
        "Users",
        `Reset password for "${target.username}".`,
      );
      return { success: true };
    },

    deleteUser(id) {
      const target = database.getUserById(id);
      if (!target) return { success: false };
      const manager = ensureManagerMayManage(target, target.role);
      if (manager.id === target.id) {
        throw new Error("You cannot delete your own account.");
      }
      const result = database.deleteUserRecord(id);
      if (result.success) {
        audit(
          "User deleted",
          "Users",
          `Soft-deleted account "${target.username}".`,
        );
      }
      return result;
    },

    getAuditLogs(limit) {
      requireRoles(["Owner", "Admin"]);
      return database.getAuditLogs(limit);
    },

    requireAuthenticated,
    requireRoles,
    audit,
  };
}

module.exports = {
  createAuthService,
  createPasswordCredentials,
  verifyPassword,
};
