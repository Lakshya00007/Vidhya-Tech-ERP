import type { PageId, PermissionRole } from '../types'

const pagePermissions: Record<PermissionRole, readonly PageId[]> = {
  Owner: [
    'dashboard',
    'students',
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
    'placeholder',
  ],
  Admin: [
    'dashboard',
    'students',
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
    'placeholder',
  ],
  Accountant: [
    'dashboard',
    'students',
    'fees',
    'reports',
    'settings',
    'salary',
    'accounts',
    'academic-sessions',
    'placeholder',
  ],
  Teacher: [
    'dashboard',
    'students',
    'attendance',
    'exams',
    'timetable',
    'homework',
    'class-tests',
    'question-paper',
    'behaviour-skills',
    'academic-sessions',
    'placeholder',
  ],
  Viewer: ['dashboard', 'students', 'reports', 'placeholder'],
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
