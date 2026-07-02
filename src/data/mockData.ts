import type {
  AttendanceRecord,
  Exam,
  MarkEntry,
} from '../types'

export const attendanceRecords: AttendanceRecord[] = [
  {
    id: 'attendance-1',
    studentId: 'student-1',
    rollNo: '01',
    admissionNo: 'VSE-2026-0142',
    studentName: 'Aarav Sharma',
    className: '10',
    section: 'A',
    attendanceDate: '2026-07-03',
    status: 'Present',
  },
  {
    id: 'attendance-2',
    studentId: 'student-2',
    rollNo: '02',
    admissionNo: 'VSE-2026-0145',
    studentName: 'Ishita Verma',
    className: '10',
    section: 'A',
    attendanceDate: '2026-07-03',
    status: 'Present',
  },
  {
    id: 'attendance-3',
    studentId: 'student-3',
    rollNo: '03',
    admissionNo: 'VSE-2026-0149',
    studentName: 'Reyansh Kapoor',
    className: '10',
    section: 'A',
    attendanceDate: '2026-07-03',
    status: 'Absent',
  },
  {
    id: 'attendance-4',
    studentId: 'student-4',
    rollNo: '04',
    admissionNo: 'VSE-2026-0151',
    studentName: 'Saanvi Joshi',
    className: '10',
    section: 'A',
    attendanceDate: '2026-07-03',
    status: 'Present',
  },
  {
    id: 'attendance-5',
    studentId: 'student-5',
    rollNo: '05',
    admissionNo: 'VSE-2026-0156',
    studentName: 'Advait Rao',
    className: '10',
    section: 'A',
    attendanceDate: '2026-07-03',
    status: 'Leave',
  },
]

export const exams: Exam[] = [
  {
    id: 'exam-1',
    name: 'Unit Test I',
    classes: 'Classes 6–10',
    startDate: '15 Jul 2026',
    endDate: '19 Jul 2026',
    status: 'Upcoming',
  },
  {
    id: 'exam-2',
    name: 'Periodic Assessment',
    classes: 'Classes 1–5',
    startDate: '08 Jul 2026',
    endDate: '11 Jul 2026',
    status: 'Upcoming',
  },
  {
    id: 'exam-3',
    name: 'Pre-Midterm Assessment',
    classes: 'Classes 9–10',
    startDate: '24 Jun 2026',
    endDate: '29 Jun 2026',
    status: 'Completed',
  },
]

export const markEntries: MarkEntry[] = [
  {
    id: 'mark-1',
    rollNo: '01',
    studentName: 'Aarav Sharma',
    maximumMarks: 100,
    marksObtained: 86,
    grade: 'A',
  },
  {
    id: 'mark-2',
    rollNo: '02',
    studentName: 'Ishita Verma',
    maximumMarks: 100,
    marksObtained: 92,
    grade: 'A+',
  },
  {
    id: 'mark-3',
    rollNo: '03',
    studentName: 'Reyansh Kapoor',
    maximumMarks: 100,
    marksObtained: 74,
    grade: 'B+',
  },
  {
    id: 'mark-4',
    rollNo: '04',
    studentName: 'Saanvi Joshi',
    maximumMarks: 100,
    marksObtained: 89,
    grade: 'A',
  },
]

export const classOptions = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
export const sectionOptions = ['A', 'B', 'C']
