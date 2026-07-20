const crypto = require("node:crypto");
const os = require("node:os");

const USER_ROLES = new Set([
  "Owner",
  "Admin",
  "Accountant",
  "Teacher",
  "Viewer",
  "Student",
]);
const EMPLOYEE_LOGIN_ROLES = new Set([
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

function optionalText(value) {
  return typeof value === "string" ? value.trim() : "";
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
  let currentLoginHistoryId = null;

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

  function getPrimaryEntityLinkForUser(userId) {
    return database.getPrimaryUserEntityLink?.(userId) ?? null;
  }

  function withPrimaryEntityLink(user) {
    if (!user) return null;
    return {
      ...user,
      entityLink: getPrimaryEntityLinkForUser(user.id),
    };
  }

  function requireCurrentStudentLink() {
    const user = requireAuthenticated();
    if (user.role !== "Student" || user.accountType !== "Student") {
      throw new Error("A linked Student account is required.");
    }
    const link = getPrimaryEntityLinkForUser(user.id);
    if (!link || link.entityType !== "Student") {
      throw new Error("This student account is not linked to an active student.");
    }
    const student = database.getStudentById(link.entityId);
    if (!student || student.status !== "Active") {
      throw new Error("This student account is not linked to an active student.");
    }
    return { user, link, student };
  }

  function requireCurrentEmployeeLink() {
    const user = requireAuthenticated();
    const link = getPrimaryEntityLinkForUser(user.id);
    if (!link || link.entityType !== "Employee") {
      throw new Error("This account is not linked to an active employee.");
    }
    const employee = database.getEmployeeById(link.entityId);
    if (!employee || employee.status !== "Active") {
      throw new Error("This account is not linked to an active employee.");
    }
    return { user, link, employee };
  }

  function ensureEntityLoginManager() {
    return requireRoles(["Owner", "Admin"]);
  }

  function ensureOwnerForAdminRole(role) {
    const manager = ensureEntityLoginManager();
    if (role === "Admin" && manager.role !== "Owner") {
      throw new Error("Only an Owner can assign Admin employee accounts.");
    }
    return manager;
  }

  function createLinkedUserAccount({
    entityType,
    entity,
    role,
    accountType,
    username,
    password,
    mustChangePassword = true,
    status = "Active",
    email = "",
    allowDuplicateEntity = false,
  }) {
    const credentials = createPasswordCredentials(password);
    const user = database.createUserRecord({
      name: entity.name,
      username,
      email,
      role,
      status,
      accountType,
      mustChangePassword,
      ...credentials,
    });
    const link = database.createUserEntityLink({
      userId: user.id,
      entityType,
      entityId: entity.id,
      entityCode:
        entityType === "Student" ? entity.admissionNo : entity.employeeNo,
      entityName: entity.name,
      isPrimary: true,
      allowDuplicateEntity,
    });
    return { user, link };
  }

  function getDeviceContext() {
    return {
      deviceName: os.hostname(),
      os: `${process.platform} ${process.arch}`,
    };
  }

  function recordLoginHistory(input) {
    if (typeof database.createLoginHistory !== "function") return null;
    return database.createLoginHistory({
      ...getDeviceContext(),
      ...input,
    });
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
      const lockedUntil = record?.locked_until
        ? new Date(record.locked_until)
        : null;
      if (
        lockedUntil &&
        !Number.isNaN(lockedUntil.getTime()) &&
        lockedUntil.getTime() > Date.now()
      ) {
        recordLoginHistory({
          userId: record.id,
          username: normalizedUsername,
          role: record.role,
          success: false,
          failureReason: "Account temporarily locked.",
        });
        throw new Error("Account is temporarily locked. Contact an administrator.");
      }
      if (
        !record ||
        record.status !== "Active" ||
        !verifyPassword(password, record.password_hash, record.password_salt)
      ) {
        if (record) database.recordFailedLogin?.(record.id);
        recordLoginHistory({
          userId: record?.id ?? "",
          username: normalizedUsername,
          role: record?.role ?? "",
          success: false,
          failureReason: "Invalid username or password.",
        });
        throw new Error("Invalid username or password.");
      }
      if (record.role === "Student" || record.account_type === "Student") {
        const link = database.getPrimaryUserEntityLink?.(record.id);
        const student = link?.entityType === "Student"
          ? database.getStudentById(link.entityId)
          : null;
        if (!link || !student || student.status !== "Active") {
          recordLoginHistory({
            userId: record.id,
            username: normalizedUsername,
            role: record.role,
            success: false,
            failureReason: "Student account is not linked.",
          });
          throw new Error("This student account is not linked to an active student.");
        }
      }
      if (record.account_type === "Staff") {
        const link = database.getPrimaryUserEntityLink?.(record.id);
        if (link?.entityType === "Employee") {
          const employee = database.getEmployeeById(link.entityId);
          if (!employee || employee.status !== "Active") {
            recordLoginHistory({
              userId: record.id,
              username: normalizedUsername,
              role: record.role,
              success: false,
              failureReason: "Employee account is not linked.",
            });
            throw new Error("This employee account is not linked to an active employee.");
          }
        }
      }
      if (currentLoginHistoryId) {
        database.finishLoginHistory?.(currentLoginHistoryId);
      }
      currentUser = withPrimaryEntityLink(database.updateUserLastLogin(record.id));
      const history = recordLoginHistory({
        userId: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
        success: true,
      });
      currentLoginHistoryId = history?.id ?? null;
      audit("User login", "Authentication", "Offline login successful.");
      return currentUser;
    },

    logout() {
      if (currentUser) {
        audit("User logout", "Authentication", "User logged out.");
      }
      if (currentLoginHistoryId) {
        database.finishLoginHistory?.(currentLoginHistoryId);
      }
      currentUser = null;
      currentLoginHistoryId = null;
      return { success: true };
    },

    getCurrentUser() {
      if (!currentUser) return null;
      const refreshed = database.getUserById(currentUser.id);
      if (!refreshed || refreshed.status !== "Active") {
        currentUser = null;
        return null;
      }
      currentUser = withPrimaryEntityLink(refreshed);
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

    changeTemporaryPassword(input = {}) {
      const user = requireAuthenticated();
      if (!user.mustChangePassword) {
        throw new Error("This account does not require a temporary password change.");
      }
      const record = database.getUserAuthRecord(user.username);
      if (
        !record ||
        !verifyPassword(
          input.currentPassword,
          record.password_hash,
          record.password_salt,
        )
      ) {
        throw new Error("Current password is incorrect.");
      }
      const credentials = createPasswordCredentials(input.newPassword);
      const updated = database.setUserPassword(
        user.id,
        credentials.passwordHash,
        credentials.passwordSalt,
        { mustChangePassword: false },
      );
      currentUser = withPrimaryEntityLink(updated);
      audit(
        "Forced password change completed",
        "Authentication",
        "Temporary password was changed by the user.",
      );
      return updated;
    },

    getCurrentAccountProfile() {
      return requireAuthenticated();
    },

    updateCurrentAccountProfile(input = {}) {
      const user = requireAuthenticated();
      const updated = database.updateUserRecord(user.id, {
        name: input.name,
        username: input.username,
        email: input.email,
      });
      currentUser = withPrimaryEntityLink(updated);
      audit(
        "Own profile updated",
        "Account Settings",
        `Updated account profile for "${updated.username}".`,
      );
      return updated;
    },

    changeCurrentPassword(input = {}) {
      const user = requireAuthenticated();
      return this.changePassword(
        user.id,
        input.currentPassword,
        input.newPassword,
      );
    },

    getCurrentLoginHistory(filter = {}) {
      const user = requireAuthenticated();
      return database.getLoginHistory(filter, user.id);
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
        currentUser = withPrimaryEntityLink(user);
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

    getStudentLoginAccounts(filter = {}) {
      requireRoles(["Owner", "Admin", "Teacher"]);
      return database.getStudentLoginAccounts(filter);
    },

    createStudentLoginAccount(input = {}) {
      const manager = ensureEntityLoginManager();
      const student = database.getStudentById(input.studentId);
      if (!student || student.status !== "Active") {
        throw new Error("Select an active student.");
      }
      const existingLinks = database.getUserEntityLinks?.({
        entityType: "Student",
        entityId: student.id,
      }) ?? [];
      if (existingLinks.some((link) => link.isPrimary)) {
        throw new Error("Student already has an active login account.");
      }
      const { user, link } = createLinkedUserAccount({
        entityType: "Student",
        entity: student,
        role: "Student",
        accountType: "Student",
        username: input.username,
        password: input.password,
        mustChangePassword: input.mustChangePassword !== false,
        status: input.status,
        email: input.email ?? student.email,
      });
      audit(
        "Student login created",
        "Student Login Management",
        `Created login for ${student.admissionNo}.`,
        manager,
      );
      return database.getStudentLoginAccounts({}).find(
        (account) => account.id === link.id,
      );
    },

    updateStudentLoginAccount(id, input = {}) {
      const manager = ensureEntityLoginManager();
      const account = database
        .getStudentLoginAccounts({})
        .find((item) => item.id === id);
      if (!account) throw new Error("Student login account was not found.");
      const updated = database.updateUserRecord(account.userId, {
        name: input.name ?? account.studentName,
        username: input.username ?? account.username,
        status: input.status ?? account.status,
        role: "Student",
        accountType: "Student",
        mustChangePassword:
          input.mustChangePassword === undefined
            ? account.mustChangePassword
            : input.mustChangePassword,
        lockedUntil: input.lockedUntil,
        failedLoginCount: input.failedLoginCount,
      });
      audit(
        "Student login updated",
        "Student Login Management",
        `Updated login "${updated.username}".`,
        manager,
      );
      return database
        .getStudentLoginAccounts({})
        .find((item) => item.id === account.id);
    },

    disableStudentLoginAccount(id, reason = "") {
      const manager = ensureEntityLoginManager();
      const account = database
        .getStudentLoginAccounts({})
        .find((item) => item.id === id);
      if (!account) throw new Error("Student login account was not found.");
      const updated = database.updateUserRecord(account.userId, {
        status: "Inactive",
      });
      audit(
        "Account disabled",
        "Student Login Management",
        `Disabled student login "${updated.username}". Reason: ${requiredText(reason || "Not provided", "Reason")}.`,
        manager,
      );
      return database
        .getStudentLoginAccounts({})
        .find((item) => item.id === id);
    },

    enableStudentLoginAccount(id) {
      const manager = ensureEntityLoginManager();
      const account = database
        .getStudentLoginAccounts({})
        .find((item) => item.id === id);
      if (!account) throw new Error("Student login account was not found.");
      const updated = database.updateUserRecord(account.userId, {
        status: "Active",
        lockedUntil: "",
        failedLoginCount: 0,
      });
      database.clearUserLock?.(account.userId);
      audit(
        "Account enabled",
        "Student Login Management",
        `Enabled student login "${updated.username}".`,
        manager,
      );
      return database
        .getStudentLoginAccounts({})
        .find((item) => item.id === id);
    },

    resetStudentLoginPassword(id, input = {}) {
      const manager = ensureEntityLoginManager();
      const account = database
        .getStudentLoginAccounts({})
        .find((item) => item.id === id);
      if (!account) throw new Error("Student login account was not found.");
      const credentials = createPasswordCredentials(input.password);
      database.setUserPassword(
        account.userId,
        credentials.passwordHash,
        credentials.passwordSalt,
        { mustChangePassword: input.mustChangePassword !== false },
      );
      audit(
        "Password reset",
        "Student Login Management",
        `Reset password for student login "${account.username}".`,
        manager,
      );
      return { success: true };
    },

    unlinkStudentLoginAccount(id) {
      const manager = ensureEntityLoginManager();
      const result = database.unlinkUserEntity(id);
      if (result.success) {
        audit(
          "Entity unlinked",
          "Student Login Management",
          "Unlinked a student login account.",
          manager,
        );
      }
      return result;
    },

    getEmployeeLoginAccounts(filter = {}) {
      requireRoles(["Owner", "Admin"]);
      return database.getEmployeeLoginAccounts(filter);
    },

    createEmployeeLoginAccount(input = {}) {
      const role = requiredText(input.role, "Role");
      if (!EMPLOYEE_LOGIN_ROLES.has(role) || role === "Owner") {
        throw new Error("Employee account role is invalid.");
      }
      const manager = ensureOwnerForAdminRole(role);
      const employee = database.getEmployeeById(input.employeeId);
      if (!employee || employee.status !== "Active") {
        throw new Error("Select an active employee.");
      }
      const existingLinks = database.getUserEntityLinks?.({
        entityType: "Employee",
        entityId: employee.id,
      }) ?? [];
      if (existingLinks.some((link) => link.isPrimary)) {
        throw new Error("Employee already has an active login account.");
      }
      const { link } = createLinkedUserAccount({
        entityType: "Employee",
        entity: employee,
        role,
        accountType: "Staff",
        username: input.username,
        password: input.password,
        mustChangePassword: input.mustChangePassword !== false,
        status: input.status,
        email: input.email ?? employee.email,
      });
      audit(
        "Employee login created",
        "Employee Login Management",
        `Created login for ${employee.employeeNo}.`,
        manager,
      );
      return database.getEmployeeLoginAccounts({}).find(
        (account) => account.id === link.id,
      );
    },

    updateEmployeeLoginAccount(id, input = {}) {
      const account = database
        .getEmployeeLoginAccounts({})
        .find((item) => item.id === id);
      if (!account) throw new Error("Employee login account was not found.");
      const role = input.role ?? account.role;
      if (!EMPLOYEE_LOGIN_ROLES.has(role) || role === "Owner") {
        throw new Error("Employee account role is invalid.");
      }
      const manager = ensureOwnerForAdminRole(role);
      if (manager.id === account.userId && role !== account.role) {
        throw new Error("You cannot change your own role.");
      }
      const updated = database.updateUserRecord(account.userId, {
        name: input.name ?? account.employeeName,
        username: input.username ?? account.username,
        role,
        status: input.status ?? account.status,
        accountType: "Staff",
        mustChangePassword:
          input.mustChangePassword === undefined
            ? account.mustChangePassword
            : input.mustChangePassword,
        lockedUntil: input.lockedUntil,
        failedLoginCount: input.failedLoginCount,
      });
      audit(
        role !== account.role ? "Role changed" : "Employee login updated",
        "Employee Login Management",
        `Updated employee login "${updated.username}".`,
        manager,
      );
      return database
        .getEmployeeLoginAccounts({})
        .find((item) => item.id === id);
    },

    disableEmployeeLoginAccount(id, reason = "") {
      const manager = ensureEntityLoginManager();
      const account = database
        .getEmployeeLoginAccounts({})
        .find((item) => item.id === id);
      if (!account) throw new Error("Employee login account was not found.");
      if (manager.id === account.userId) {
        throw new Error("You cannot disable your own account.");
      }
      const updated = database.updateUserRecord(account.userId, {
        status: "Inactive",
      });
      audit(
        "Account disabled",
        "Employee Login Management",
        `Disabled employee login "${updated.username}". Reason: ${optionalText(reason) || "Not provided"}.`,
        manager,
      );
      return database
        .getEmployeeLoginAccounts({})
        .find((item) => item.id === id);
    },

    enableEmployeeLoginAccount(id) {
      const manager = ensureEntityLoginManager();
      const account = database
        .getEmployeeLoginAccounts({})
        .find((item) => item.id === id);
      if (!account) throw new Error("Employee login account was not found.");
      const updated = database.updateUserRecord(account.userId, {
        status: "Active",
        lockedUntil: "",
        failedLoginCount: 0,
      });
      database.clearUserLock?.(account.userId);
      audit(
        "Account enabled",
        "Employee Login Management",
        `Enabled employee login "${updated.username}".`,
        manager,
      );
      return database
        .getEmployeeLoginAccounts({})
        .find((item) => item.id === id);
    },

    resetEmployeeLoginPassword(id, input = {}) {
      const manager = ensureEntityLoginManager();
      const account = database
        .getEmployeeLoginAccounts({})
        .find((item) => item.id === id);
      if (!account) throw new Error("Employee login account was not found.");
      const credentials = createPasswordCredentials(input.password);
      database.setUserPassword(
        account.userId,
        credentials.passwordHash,
        credentials.passwordSalt,
        { mustChangePassword: input.mustChangePassword !== false },
      );
      audit(
        "Password reset",
        "Employee Login Management",
        `Reset password for employee login "${account.username}".`,
        manager,
      );
      return { success: true };
    },

    unlinkEmployeeLoginAccount(id) {
      const manager = ensureEntityLoginManager();
      const result = database.unlinkUserEntity(id);
      if (result.success) {
        audit(
          "Entity unlinked",
          "Employee Login Management",
          "Unlinked an employee login account.",
          manager,
        );
      }
      return result;
    },

    getCurrentUserEntityLink() {
      const user = requireAuthenticated();
      return database.getPrimaryUserEntityLink?.(user.id) ?? null;
    },

    getCurrentStudentPortalData() {
      const { user, student } = requireCurrentStudentLink();
      const guardians = database.getStudentGuardians?.(student.id) ?? [];
      const attendance = database
        .getAttendance()
        .filter((record) => record.studentId === student.id);
      const timetable = database.getTimetableByClass(
        student.className,
        student.section,
      );
      const homework = database.getHomeworkByClass(
        student.className,
        student.section,
      );
      const classTests = database.getClassTestsByClass(
        student.className,
        student.section,
      );
      const marks = database
        .getMarks()
        .filter((mark) => mark.studentId === student.id);
      const reportCards = database.getStudentReportCards({ studentId: student.id });
      const feePayments = database
        .getFeePayments()
        .filter((payment) => payment.studentId === student.id);
      const feeLedger =
        typeof database.getStudentFeeLedger === "function"
          ? database.getStudentFeeLedger(student.id)
          : [];
      const invoices =
        typeof database.getStudentOutstandingInvoices === "function"
          ? database.getStudentOutstandingInvoices(student.id)
          : [];
      const certificates =
        typeof database.getIssuedCertificatesByStudent === "function"
          ? database.getIssuedCertificatesByStudent(student.id)
          : [];
      const announcements =
        typeof database.getCurrentUserAnnouncements === "function"
          ? database.getCurrentUserAnnouncements(user, { limit: 5 })
          : [];
      const unreadMessageCount =
        typeof database.getMessageInbox === "function"
          ? database.getMessageInbox(user, { unreadOnly: true }).length
          : 0;
      return {
        student,
        guardians,
        attendance,
        timetable,
        homework,
        classTests,
        marks,
        reportCards,
        feePayments,
        feeLedger,
        invoices,
        certificates,
        announcements,
        unreadMessageCount,
      };
    },

    getCurrentEmployeePortalData() {
      const { user, employee } = requireCurrentEmployeeLink();
      const attendance =
        typeof database.getEmployeeAttendanceByRange === "function"
          ? database.getEmployeeAttendanceByRange({ employeeId: employee.id })
          : [];
      const salaryPayments = database.getSalaryPaymentsByEmployee(employee.id);
      const timetable = database.getTimetableByTeacher(employee.id);
      const announcements =
        typeof database.getCurrentUserAnnouncements === "function"
          ? database.getCurrentUserAnnouncements(user, { limit: 5 })
          : [];
      const unreadMessageCount =
        typeof database.getMessageInbox === "function"
          ? database.getMessageInbox(user, { unreadOnly: true }).length
          : 0;
      return {
        employee,
        attendance,
        salaryPayments,
        timetable,
        announcements,
        unreadMessageCount,
      };
    },

    getMessageInbox(filter = {}) {
      const user = requireAuthenticated();
      return database.getMessageInbox(user, filter);
    },

    getSentMessages(filter = {}) {
      const user = requireAuthenticated();
      return database.getSentMessages(user, filter);
    },

    getMessageThread(threadId) {
      const user = requireAuthenticated();
      return database.getMessageThread(user, threadId);
    },

    markMessageThreadRead(threadId) {
      const user = requireAuthenticated();
      return database.markMessageThreadRead(user, threadId);
    },

    archiveMessageThread(threadId) {
      const user = requireAuthenticated();
      const result = database.archiveMessageThread(user, threadId);
      audit(
        "Thread archived",
        "Message Center",
        `Archived thread ${threadId}.`,
        user,
      );
      return result;
    },

    unarchiveMessageThread(threadId) {
      const user = requireAuthenticated();
      return database.unarchiveMessageThread(user, threadId);
    },

    createDirectMessage(input = {}) {
      const user = requireAuthenticated();
      const thread = database.createDirectMessage(user, input);
      audit(
        "Direct message sent",
        "Message Center",
        `Thread ${thread.id} "${thread.subject}" sent to ${thread.recipients.length} recipient(s).`,
        user,
      );
      return thread;
    },

    replyToMessageThread(input = {}) {
      const user = requireAuthenticated();
      const thread = database.replyToMessageThread(user, input);
      audit(
        "Message reply sent",
        "Message Center",
        `Reply added to thread ${thread.id}.`,
        user,
      );
      return thread;
    },

    editOwnMessage(messageId, text) {
      const user = requireAuthenticated();
      const thread = database.editOwnMessage(user, messageId, text);
      audit(
        "Message edited",
        "Message Center",
        `Edited message ${messageId} in thread ${thread.id}.`,
        user,
      );
      return thread;
    },

    deleteOwnMessage(messageId) {
      const user = requireAuthenticated();
      const result = database.deleteOwnMessage(user, messageId);
      audit(
        "Message deleted",
        "Message Center",
        `Soft-deleted message ${messageId}.`,
        user,
      );
      return result;
    },

    closeMessageThread(threadId) {
      const user = requireAuthenticated();
      const result = database.closeMessageThread(user, threadId);
      audit(
        "Thread closed",
        "Message Center",
        `Closed thread ${threadId}.`,
        user,
      );
      return result;
    },

    getAnnouncements(filter = {}) {
      const user = requireAuthenticated();
      return database.getAnnouncements(user, filter);
    },

    getCurrentUserAnnouncements() {
      const user = requireAuthenticated();
      return database.getCurrentUserAnnouncements(user);
    },

    createAnnouncement(input = {}) {
      const user = requireAuthenticated();
      const announcement = database.createAnnouncement(user, input);
      audit(
        "Announcement created",
        "Message Center",
        `Announcement ${announcement.id} "${announcement.title}" for ${announcement.audienceType}.`,
        user,
      );
      if (announcement.status === "Published") {
        audit(
          "Announcement published",
          "Message Center",
          `Published announcement ${announcement.id} to ${announcement.recipientCount} recipient(s).`,
          user,
        );
      }
      return announcement;
    },

    updateAnnouncement(id, input = {}) {
      const user = requireAuthenticated();
      const announcement = database.updateAnnouncement(user, id, input);
      audit(
        "Announcement updated",
        "Message Center",
        `Updated announcement ${announcement.id} for ${announcement.audienceType}.`,
        user,
      );
      return announcement;
    },

    publishAnnouncement(id) {
      const user = requireAuthenticated();
      const announcement = database.publishAnnouncement(user, id);
      audit(
        "Announcement published",
        "Message Center",
        `Published announcement ${announcement.id} to ${announcement.recipientCount} recipient(s).`,
        user,
      );
      return announcement;
    },

    cancelAnnouncement(id) {
      const user = requireAuthenticated();
      const announcement = database.cancelAnnouncement(user, id);
      audit(
        "Announcement cancelled",
        "Message Center",
        `Cancelled announcement ${announcement.id}.`,
        user,
      );
      return announcement;
    },

    deleteAnnouncement(id) {
      const user = requireAuthenticated();
      const result = database.deleteAnnouncement(user, id);
      audit(
        "Announcement deleted",
        "Message Center",
        `Soft-deleted announcement ${id}.`,
        user,
      );
      return result;
    },

    getEligibleMessageRecipients(filter = {}) {
      const user = requireAuthenticated();
      return database.getEligibleMessageRecipients(user, filter);
    },

    resolveAnnouncementRecipients(input = {}) {
      const user = requireAuthenticated();
      return database.resolveAnnouncementRecipients(user, input);
    },

    getMessageDeliveryReport(threadId) {
      const user = requireAuthenticated();
      const report = database.getMessageDeliveryReport(user, threadId);
      audit(
        "Delivery report exported",
        "Message Center",
        `Message delivery report requested for thread ${threadId}.`,
        user,
      );
      return report;
    },

    getAnnouncementReadReport(announcementId) {
      const user = requireAuthenticated();
      const report = database.getAnnouncementReadReport(user, announcementId);
      audit(
        "Delivery report exported",
        "Message Center",
        `Announcement read report requested for ${announcementId}.`,
        user,
      );
      return report;
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
