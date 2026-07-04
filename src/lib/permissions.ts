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
    'placeholder',
  ],
  Accountant: [
    'dashboard',
    'students',
    'fees',
    'reports',
    'settings',
    'placeholder',
  ],
  Teacher: ['dashboard', 'students', 'attendance', 'exams', 'placeholder'],
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
