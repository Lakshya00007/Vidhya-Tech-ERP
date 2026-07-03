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
  ],
  Admin: [
    'dashboard',
    'students',
    'fees',
    'attendance',
    'exams',
    'reports',
    'settings',
  ],
  Accountant: ['dashboard', 'students', 'fees', 'reports', 'settings'],
  Teacher: ['dashboard', 'students', 'attendance', 'exams'],
  Viewer: ['dashboard', 'students', 'reports'],
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
