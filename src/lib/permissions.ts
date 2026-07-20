import type { PageId, PermissionRole } from '../types'

const pagePermissions: Record<PermissionRole, readonly PageId[]> = {
  Owner: [
    'dashboard',
    'students',
    'families',
    'fees',
    'attendance',
    'exams',
    'reports',
    'settings',
    'documents',
    'employees',
    'salary',
    'accounts',
    'timetable',
    'homework',
    'class-tests',
    'question-paper',
    'behaviour-skills',
    'academic-sessions',
    'student-login-management',
    'employee-login-management',
    'message-center',
    'employee-portal',
    'placeholder',
  ],
  Admin: [
    'dashboard',
    'students',
    'families',
    'fees',
    'attendance',
    'exams',
    'reports',
    'settings',
    'documents',
    'employees',
    'salary',
    'accounts',
    'timetable',
    'homework',
    'class-tests',
    'question-paper',
    'behaviour-skills',
    'academic-sessions',
    'student-login-management',
    'employee-login-management',
    'message-center',
    'employee-portal',
    'placeholder',
  ],
  Accountant: [
    'dashboard',
    'students',
    'families',
    'fees',
    'attendance',
    'reports',
    'settings',
    'salary',
    'accounts',
    'academic-sessions',
    'message-center',
    'employee-portal',
    'placeholder',
  ],
  Teacher: [
    'dashboard',
    'students',
    'families',
    'attendance',
    'exams',
    'reports',
    'settings',
    'timetable',
    'homework',
    'class-tests',
    'question-paper',
    'behaviour-skills',
    'academic-sessions',
    'message-center',
    'employee-portal',
    'placeholder',
  ],
  Viewer: [
    'dashboard',
    'students',
    'families',
    'reports',
    'settings',
    'message-center',
    'employee-portal',
    'placeholder',
  ],
  Student: ['student-portal', 'message-center'],
}

export function canAccessPage(role: PermissionRole, page: PageId) {
  return pagePermissions[role].includes(page)
}

export function canManageStudents(role: PermissionRole) {
  return role === 'Owner' || role === 'Admin'
}

export function canManageSettings(role: PermissionRole) {
  return role === 'Owner' || role === 'Admin'
}

export function canManageUsers(role: PermissionRole) {
  return role === 'Owner' || role === 'Admin'
}

export function canRestoreDatabase(role: PermissionRole) {
  return role === 'Owner'
}

export function canManageTimetable(role: PermissionRole) {
  return role === 'Owner' || role === 'Admin'
}

export function canManageBehaviourSkillsMasters(role: PermissionRole) {
  return role === 'Owner' || role === 'Admin'
}

export function canDeleteStudentObservations(role: PermissionRole) {
  return role === 'Owner' || role === 'Admin'
}
