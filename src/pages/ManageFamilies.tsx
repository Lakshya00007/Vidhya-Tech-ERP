import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import type {
  CreateFamilyInput,
  CreateGuardianInput,
  Family,
  FamilyProfile,
  Guardian,
  GuardianRelation,
  LinkGuardianToStudentInput,
  Student,
  StudentGuardianLink,
} from '../types'

export type ManageFamiliesTab =
  | 'families'
  | 'guardians'
  | 'linking'
  | 'siblings'

const relationOptions: GuardianRelation[] = [
  'Father',
  'Mother',
  'Guardian',
  'Grandfather',
  'Grandmother',
  'Brother',
  'Sister',
  'Uncle',
  'Aunt',
  'Other',
]

const emptyFamilyForm: CreateFamilyInput = {
  familyName: '',
  primaryContactName: '',
  primaryMobile: '',
  secondaryMobile: '',
  email: '',
  address: '',
  city: '',
  state: '',
  postalCode: '',
  emergencyContactName: '',
  emergencyContactMobile: '',
  notes: '',
  status: 'Active',
}

const emptyGuardianForm: CreateGuardianInput = {
  familyId: '',
  fullName: '',
  relation: 'Guardian',
  mobile: '',
  alternateMobile: '',
  email: '',
  occupation: '',
  qualification: '',
  annualIncome: null,
  address: '',
  isPrimary: false,
  canPickupStudent: true,
  emergencyContact: false,
  status: 'Active',
}

interface ManageFamiliesProps {
  canManage: boolean
  initialTab?: string
}

export function ManageFamilies({
  canManage,
  initialTab = 'families',
}: ManageFamiliesProps) {
  const [activeTab, setActiveTab] = useState<ManageFamiliesTab>(
    ['families', 'guardians', 'linking', 'siblings'].includes(initialTab)
      ? (initialTab as ManageFamiliesTab)
      : 'families',
  )
  const [families, setFamilies] = useState<Family[]>([])
  const [guardians, setGuardians] = useState<Guardian[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [studentLinks, setStudentLinks] = useState<StudentGuardianLink[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [selectedFamily, setSelectedFamily] = useState<FamilyProfile | null>(
    null,
  )
  const [familySearch, setFamilySearch] = useState('')
  const [guardianSearch, setGuardianSearch] = useState('')
  const [familyForm, setFamilyForm] =
    useState<CreateFamilyInput>(emptyFamilyForm)
  const [editingFamilyId, setEditingFamilyId] = useState<string | null>(null)
  const [guardianForm, setGuardianForm] =
    useState<CreateGuardianInput>(emptyGuardianForm)
  const [editingGuardianId, setEditingGuardianId] = useState<string | null>(
    null,
  )
  const [linkForm, setLinkForm] = useState<LinkGuardianToStudentInput>({
    studentId: '',
    guardianId: '',
    familyId: '',
    relationToStudent: 'Guardian',
    isPrimary: true,
    livesWithStudent: true,
    financialResponsibility: false,
    pickupAuthorized: true,
  })
  const [siblingStudentIds, setSiblingStudentIds] = useState<string[]>([])
  const [siblingFamilyId, setSiblingFamilyId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    try {
      const [familyRows, guardianRows, studentRows] = await Promise.all([
        getErpApi().getFamilies({}),
        getErpApi().getGuardians({}),
        getErpApi().getStudents(),
      ])
      setFamilies(familyRows)
      setGuardians(guardianRows)
      setStudents(studentRows)
      setError('')
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(loadData)
  }, [loadData])

  const refreshStudentLinks = useCallback(async (studentId: string) => {
    if (!studentId) {
      setStudentLinks([])
      return
    }
    const links = await getErpApi().getStudentGuardians(studentId)
    setStudentLinks(links)
  }, [])

  useEffect(() => {
    void Promise.resolve().then(() => refreshStudentLinks(selectedStudentId))
  }, [refreshStudentLinks, selectedStudentId])

  const filteredFamilies = useMemo(() => {
    const query = familySearch.trim().toLowerCase()
    if (!query) return families
    return families.filter((family) =>
      [
        family.familyCode,
        family.familyName,
        family.primaryContactName,
        family.primaryMobile,
        family.email,
      ].some((value) => value.toLowerCase().includes(query)),
    )
  }, [families, familySearch])

  const filteredGuardians = useMemo(() => {
    const query = guardianSearch.trim().toLowerCase()
    if (!query) return guardians
    return guardians.filter((guardian) =>
      [
        guardian.fullName,
        guardian.relation,
        guardian.mobile,
        guardian.email,
        guardian.familyCode,
      ].some((value) => value.toLowerCase().includes(query)),
    )
  }, [guardians, guardianSearch])

  const selectedStudent = students.find((student) => student.id === selectedStudentId)

  const showNotice = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      setMessage(text)
      setError('')
    } else {
      setError(text)
      setMessage('')
    }
  }

  const resetFamilyForm = () => {
    setEditingFamilyId(null)
    setFamilyForm(emptyFamilyForm)
  }

  const editFamily = async (family: Family) => {
    setEditingFamilyId(family.id)
    setFamilyForm({
      familyCode: family.familyCode,
      familyName: family.familyName,
      primaryContactName: family.primaryContactName,
      primaryMobile: family.primaryMobile,
      secondaryMobile: family.secondaryMobile,
      email: family.email,
      address: family.address,
      city: family.city,
      state: family.state,
      postalCode: family.postalCode,
      emergencyContactName: family.emergencyContactName,
      emergencyContactMobile: family.emergencyContactMobile,
      notes: family.notes,
      status: family.status,
    })
    setSelectedFamily(await getErpApi().getFamilyById(family.id))
  }

  const saveFamily = async (event: FormEvent) => {
    event.preventDefault()
    if (!canManage) return
    setIsSaving(true)
    try {
      const saved = editingFamilyId
        ? await getErpApi().updateFamily(editingFamilyId, familyForm)
        : await getErpApi().createFamily(familyForm)
      await loadData()
      setSelectedFamily(saved)
      resetFamilyForm()
      showNotice('success', `Family ${saved.familyCode} saved.`)
    } catch (saveError) {
      showNotice('error', getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  const deleteFamily = async (family: Family) => {
    if (!window.confirm(`Soft delete family ${family.familyCode}?`)) return
    try {
      const result = await getErpApi().deleteFamily(family.id)
      if (!result.success) throw new Error('Family could not be deleted.')
      await loadData()
      if (selectedFamily?.id === family.id) setSelectedFamily(null)
      showNotice('success', `Family ${family.familyCode} was soft deleted.`)
    } catch (deleteError) {
      showNotice('error', getErrorMessage(deleteError))
    }
  }

  const resetGuardianForm = () => {
    setEditingGuardianId(null)
    setGuardianForm(emptyGuardianForm)
  }

  const editGuardian = (guardian: Guardian) => {
    setEditingGuardianId(guardian.id)
    setGuardianForm({
      familyId: guardian.familyId,
      fullName: guardian.fullName,
      relation: guardian.relation,
      mobile: guardian.mobile,
      alternateMobile: guardian.alternateMobile,
      email: guardian.email,
      occupation: guardian.occupation,
      qualification: guardian.qualification,
      annualIncome: guardian.annualIncome,
      address: guardian.address,
      isPrimary: guardian.isPrimary,
      canPickupStudent: guardian.canPickupStudent,
      emergencyContact: guardian.emergencyContact,
      status: guardian.status,
    })
  }

  const saveGuardian = async (event: FormEvent) => {
    event.preventDefault()
    if (!canManage) return
    setIsSaving(true)
    try {
      const saved = editingGuardianId
        ? await getErpApi().updateGuardian(editingGuardianId, guardianForm)
        : await getErpApi().createGuardian(guardianForm)
      await loadData()
      resetGuardianForm()
      showNotice('success', `Guardian ${saved.fullName} saved.`)
    } catch (saveError) {
      showNotice('error', getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  const deleteGuardian = async (guardian: Guardian) => {
    if (!window.confirm(`Soft delete guardian ${guardian.fullName}?`)) return
    try {
      const result = await getErpApi().deleteGuardian(guardian.id)
      if (!result.success) throw new Error('Guardian could not be deleted.')
      await loadData()
      await refreshStudentLinks(selectedStudentId)
      showNotice('success', `${guardian.fullName} was soft deleted.`)
    } catch (deleteError) {
      showNotice('error', getErrorMessage(deleteError))
    }
  }

  const linkGuardian = async (event: FormEvent) => {
    event.preventDefault()
    if (!canManage) return
    setIsSaving(true)
    try {
      const saved = await getErpApi().linkGuardianToStudent({
        ...linkForm,
        studentId: selectedStudentId,
      })
      await Promise.all([
        loadData(),
        refreshStudentLinks(selectedStudentId),
      ])
      showNotice(
        'success',
        `${saved.guardianFullName || saved.guardianName} linked to ${saved.studentName}.`,
      )
    } catch (saveError) {
      showNotice('error', getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  const unlinkGuardian = async (link: StudentGuardianLink) => {
    if (!window.confirm(`Unlink ${link.guardianFullName} from ${link.studentName}?`)) {
      return
    }
    try {
      const result = await getErpApi().unlinkGuardianFromStudent(link.id)
      if (!result.success) throw new Error('Guardian link could not be removed.')
      await Promise.all([
        loadData(),
        refreshStudentLinks(selectedStudentId),
      ])
      showNotice('success', 'Guardian was unlinked. The guardian record remains available.')
    } catch (unlinkError) {
      showNotice('error', getErrorMessage(unlinkError))
    }
  }

  const createFamilyFromStudent = async () => {
    if (!canManage || !selectedStudentId) return
    setIsSaving(true)
    try {
      const family = await getErpApi().createFamilyFromStudentDetails(
        selectedStudentId,
      )
      await Promise.all([
        loadData(),
        refreshStudentLinks(selectedStudentId),
      ])
      setSelectedFamily(family)
      showNotice('success', `Family ${family.familyCode} created from existing student details.`)
    } catch (saveError) {
      showNotice('error', getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  const toggleSiblingStudent = (studentId: string) => {
    setSiblingStudentIds((current) =>
      current.includes(studentId)
        ? current.filter((id) => id !== studentId)
        : [...current, studentId],
    )
  }

  const linkSiblings = async () => {
    if (!canManage) return
    setIsSaving(true)
    try {
      const family = await getErpApi().linkSiblingStudents({
        studentIds: siblingStudentIds,
        familyId: siblingFamilyId,
      })
      await loadData()
      setSelectedFamily(family)
      showNotice('success', `Sibling group linked under family ${family.familyCode}.`)
    } catch (saveError) {
      showNotice('error', getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  const familyColumns: TableColumn<Family>[] = [
    { key: 'code', header: 'Family Code', render: (family) => family.familyCode },
    { key: 'name', header: 'Family Name', render: (family) => family.familyName || '—' },
    {
      key: 'contact',
      header: 'Primary Contact',
      render: (family) => family.primaryContactName || '—',
    },
    { key: 'mobile', header: 'Mobile', render: (family) => family.primaryMobile || '—' },
    { key: 'address', header: 'Address', render: (family) => family.address || '—' },
    { key: 'students', header: 'Students', render: (family) => family.studentCount },
    {
      key: 'status',
      header: 'Status',
      render: (family) => (
        <span className={`status-badge status-badge--${family.status.toLowerCase()}`}>
          {family.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'align-right',
      render: (family) => (
        <div className="row-action-group">
          <button
            className="row-action"
            onClick={() => void editFamily(family)}
            title="View family profile"
            type="button"
          >
            <Icon name="view" size={14} />
          </button>
          {canManage && (
            <>
              <button
                className="row-action"
                onClick={() => void editFamily(family)}
                title="Edit family"
                type="button"
              >
                <Icon name="edit" size={14} />
              </button>
              <button
                className="row-action row-action--danger"
                onClick={() => void deleteFamily(family)}
                title="Soft delete family"
                type="button"
              >
                <Icon name="trash" size={14} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  const guardianColumns: TableColumn<Guardian>[] = [
    { key: 'name', header: 'Guardian', render: (guardian) => guardian.fullName },
    { key: 'relation', header: 'Relation', render: (guardian) => guardian.relation },
    { key: 'family', header: 'Family', render: (guardian) => guardian.familyCode || '—' },
    { key: 'mobile', header: 'Mobile', render: (guardian) => guardian.mobile || '—' },
    { key: 'email', header: 'Email', render: (guardian) => guardian.email || '—' },
    { key: 'occupation', header: 'Occupation', render: (guardian) => guardian.occupation || '—' },
    {
      key: 'flags',
      header: 'Flags',
      render: (guardian) => (
        <div className="badge-row">
          {guardian.isPrimary && <span className="neutral-badge">Primary</span>}
          {guardian.canPickupStudent && <span className="neutral-badge">Pickup</span>}
          {guardian.emergencyContact && <span className="neutral-badge">Emergency</span>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'align-right',
      render: (guardian) => (
        <div className="row-action-group">
          {canManage && (
            <>
              <button
                className="row-action"
                onClick={() => editGuardian(guardian)}
                title="Edit guardian"
                type="button"
              >
                <Icon name="edit" size={14} />
              </button>
              <button
                className="row-action row-action--danger"
                onClick={() => void deleteGuardian(guardian)}
                title="Soft delete guardian"
                type="button"
              >
                <Icon name="trash" size={14} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="page-stack manage-families-page">
      <section className="page-header">
        <div>
          <h2>Manage Families</h2>
          <p>Maintain structured family, guardian and sibling relationships.</p>
        </div>
      </section>

      {message && (
        <div className="inline-message">
          <Icon name="check" size={17} />
          <span>{message}</span>
          <button type="button" onClick={() => setMessage('')} aria-label="Dismiss message">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}
      {error && (
        <div className="inline-message inline-message--error">
          <Icon name="close" size={17} />
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      <nav className="settings-tabs" aria-label="Family management sections">
        {[
          ['families', 'Families'],
          ['guardians', 'Guardians'],
          ['linking', 'Student Linking'],
          ['siblings', 'Sibling Groups'],
        ].map(([id, label]) => (
          <button
            className={`settings-tab${activeTab === id ? ' settings-tab--active' : ''}`}
            key={id}
            onClick={() => setActiveTab(id as ManageFamiliesTab)}
            type="button"
          >
            {label}
          </button>
        ))}
      </nav>

      {activeTab === 'families' && (
        <div className="settings-layout manage-families-layout">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Families</h3>
                <p>Search by family code, name, contact or mobile.</p>
              </div>
            </div>
            <label className="search-field search-field--wide">
              <Icon name="search" size={18} />
              <input
                onChange={(event) => setFamilySearch(event.target.value)}
                placeholder="Search families"
                type="search"
                value={familySearch}
              />
            </label>
            <DataTable
              columns={familyColumns}
              emptyMessage={isLoading ? 'Loading families...' : 'No families found.'}
              getRowKey={(family) => family.id}
              rows={filteredFamilies}
            />
          </section>

          {canManage && (
            <form className="panel compact-form" onSubmit={(event) => void saveFamily(event)}>
              <div className="panel-heading">
                <div>
                  <h3>{editingFamilyId ? 'Edit Family' : 'Add Family'}</h3>
                  <p>Family code is generated automatically when left blank.</p>
                </div>
              </div>
              {editingFamilyId && (
                <label className="form-field">
                  <span>Family Code</span>
                  <input
                    value={familyForm.familyCode ?? ''}
                    onChange={(event) => setFamilyForm({ ...familyForm, familyCode: event.target.value })}
                  />
                </label>
              )}
              <label className="form-field">
                <span>Family Name</span>
                <input
                  value={familyForm.familyName ?? ''}
                  onChange={(event) => setFamilyForm({ ...familyForm, familyName: event.target.value })}
                />
              </label>
              <label className="form-field">
                <span>Primary Contact</span>
                <input
                  value={familyForm.primaryContactName ?? ''}
                  onChange={(event) => setFamilyForm({ ...familyForm, primaryContactName: event.target.value })}
                />
              </label>
              <div className="form-row">
                <label className="form-field">
                  <span>Primary Mobile</span>
                  <input
                    value={familyForm.primaryMobile ?? ''}
                    onChange={(event) => setFamilyForm({ ...familyForm, primaryMobile: event.target.value })}
                  />
                </label>
                <label className="form-field">
                  <span>Secondary Mobile</span>
                  <input
                    value={familyForm.secondaryMobile ?? ''}
                    onChange={(event) => setFamilyForm({ ...familyForm, secondaryMobile: event.target.value })}
                  />
                </label>
              </div>
              <label className="form-field">
                <span>Email</span>
                <input
                  type="email"
                  value={familyForm.email ?? ''}
                  onChange={(event) => setFamilyForm({ ...familyForm, email: event.target.value })}
                />
              </label>
              <label className="form-field">
                <span>Address</span>
                <textarea
                  rows={3}
                  value={familyForm.address ?? ''}
                  onChange={(event) => setFamilyForm({ ...familyForm, address: event.target.value })}
                />
              </label>
              <div className="form-row">
                <label className="form-field">
                  <span>City</span>
                  <input
                    value={familyForm.city ?? ''}
                    onChange={(event) => setFamilyForm({ ...familyForm, city: event.target.value })}
                  />
                </label>
                <label className="form-field">
                  <span>State</span>
                  <input
                    value={familyForm.state ?? ''}
                    onChange={(event) => setFamilyForm({ ...familyForm, state: event.target.value })}
                  />
                </label>
              </div>
              <label className="form-field">
                <span>Emergency Contact</span>
                <input
                  value={familyForm.emergencyContactName ?? ''}
                  onChange={(event) => setFamilyForm({ ...familyForm, emergencyContactName: event.target.value })}
                />
              </label>
              <label className="form-field">
                <span>Emergency Mobile</span>
                <input
                  value={familyForm.emergencyContactMobile ?? ''}
                  onChange={(event) => setFamilyForm({ ...familyForm, emergencyContactMobile: event.target.value })}
                />
              </label>
              <label className="form-field">
                <span>Status</span>
                <select
                  value={familyForm.status ?? 'Active'}
                  onChange={(event) => setFamilyForm({ ...familyForm, status: event.target.value as 'Active' | 'Inactive' })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </label>
              <label className="form-field">
                <span>Notes</span>
                <textarea
                  rows={3}
                  value={familyForm.notes ?? ''}
                  onChange={(event) => setFamilyForm({ ...familyForm, notes: event.target.value })}
                />
              </label>
              <div className="form-actions">
                {editingFamilyId && (
                  <button className="secondary-button" onClick={resetFamilyForm} type="button">
                    Cancel
                  </button>
                )}
                <button className="primary-button" disabled={isSaving} type="submit">
                  {isSaving ? 'Saving...' : 'Save Family'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {selectedFamily && activeTab === 'families' && (
        <section className="panel family-profile-panel">
          <div className="panel-heading">
            <div>
              <h3>{selectedFamily.familyCode}</h3>
              <p>{selectedFamily.familyName || 'Family profile'}</p>
            </div>
            <button className="icon-button" onClick={() => setSelectedFamily(null)} type="button">
              <Icon name="close" size={16} />
            </button>
          </div>
          <div className="family-profile-grid">
            <div>
              <span>Primary Contact</span>
              <strong>{selectedFamily.primaryContactName || '—'}</strong>
              <small>{selectedFamily.primaryMobile || '—'}</small>
            </div>
            <div>
              <span>Emergency</span>
              <strong>{selectedFamily.emergencyContactName || '—'}</strong>
              <small>{selectedFamily.emergencyContactMobile || '—'}</small>
            </div>
            <div>
              <span>Address</span>
              <strong>{selectedFamily.address || '—'}</strong>
              <small>{selectedFamily.city || selectedFamily.state || '—'}</small>
            </div>
          </div>
          <div className="family-profile-lists">
            <div>
              <h4>Guardians</h4>
              {selectedFamily.guardians.length === 0 ? (
                <p className="empty-state">No guardians linked.</p>
              ) : (
                selectedFamily.guardians.map((guardian) => (
                  <div className="family-mini-row" key={guardian.id}>
                    <strong>{guardian.fullName}</strong>
                    <span>{guardian.relation} · {guardian.mobile || 'No mobile'}</span>
                  </div>
                ))
              )}
            </div>
            <div>
              <h4>Linked Students</h4>
              {selectedFamily.students.length === 0 ? (
                <p className="empty-state">No students linked.</p>
              ) : (
                selectedFamily.students.map((student) => (
                  <div className="family-mini-row" key={student.id}>
                    <strong>{student.name}</strong>
                    <span>{student.admissionNo} · Class {student.className}{student.section ? `-${student.section}` : ''}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === 'guardians' && (
        <div className="settings-layout manage-families-layout">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Guardians</h3>
                <p>Maintain contact, pickup and emergency authorization.</p>
              </div>
            </div>
            <label className="search-field search-field--wide">
              <Icon name="search" size={18} />
              <input
                onChange={(event) => setGuardianSearch(event.target.value)}
                placeholder="Search guardians"
                type="search"
                value={guardianSearch}
              />
            </label>
            <DataTable
              columns={guardianColumns}
              emptyMessage={isLoading ? 'Loading guardians...' : 'No guardians found.'}
              getRowKey={(guardian) => guardian.id}
              rows={filteredGuardians}
            />
          </section>

          {canManage && (
            <form className="panel compact-form" onSubmit={(event) => void saveGuardian(event)}>
              <div className="panel-heading">
                <div>
                  <h3>{editingGuardianId ? 'Edit Guardian' : 'Add Guardian'}</h3>
                  <p>Link to a family now or later from Student Linking.</p>
                </div>
              </div>
              <label className="form-field">
                <span>Family</span>
                <select
                  value={guardianForm.familyId ?? ''}
                  onChange={(event) => setGuardianForm({ ...guardianForm, familyId: event.target.value })}
                >
                  <option value="">No family selected</option>
                  {families.map((family) => (
                    <option key={family.id} value={family.id}>{family.familyCode} · {family.familyName || family.primaryContactName || 'Family'}</option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Full Name *</span>
                <input
                  required
                  value={guardianForm.fullName}
                  onChange={(event) => setGuardianForm({ ...guardianForm, fullName: event.target.value })}
                />
              </label>
              <label className="form-field">
                <span>Relation *</span>
                <select
                  value={guardianForm.relation}
                  onChange={(event) => setGuardianForm({ ...guardianForm, relation: event.target.value as GuardianRelation })}
                >
                  {relationOptions.map((relation) => (
                    <option key={relation} value={relation}>{relation}</option>
                  ))}
                </select>
              </label>
              <div className="form-row">
                <label className="form-field">
                  <span>Mobile</span>
                  <input
                    value={guardianForm.mobile ?? ''}
                    onChange={(event) => setGuardianForm({ ...guardianForm, mobile: event.target.value })}
                  />
                </label>
                <label className="form-field">
                  <span>Alternate Mobile</span>
                  <input
                    value={guardianForm.alternateMobile ?? ''}
                    onChange={(event) => setGuardianForm({ ...guardianForm, alternateMobile: event.target.value })}
                  />
                </label>
              </div>
              <label className="form-field">
                <span>Email</span>
                <input
                  type="email"
                  value={guardianForm.email ?? ''}
                  onChange={(event) => setGuardianForm({ ...guardianForm, email: event.target.value })}
                />
              </label>
              <div className="form-row">
                <label className="form-field">
                  <span>Occupation</span>
                  <input
                    value={guardianForm.occupation ?? ''}
                    onChange={(event) => setGuardianForm({ ...guardianForm, occupation: event.target.value })}
                  />
                </label>
                <label className="form-field">
                  <span>Annual Income</span>
                  <input
                    min="0"
                    type="number"
                    value={guardianForm.annualIncome ?? ''}
                    onChange={(event) => setGuardianForm({ ...guardianForm, annualIncome: event.target.value ? Number(event.target.value) : null })}
                  />
                </label>
              </div>
              <label className="form-field">
                <span>Address</span>
                <textarea
                  rows={3}
                  value={guardianForm.address ?? ''}
                  onChange={(event) => setGuardianForm({ ...guardianForm, address: event.target.value })}
                />
              </label>
              <div className="checkbox-grid">
                <label><input checked={Boolean(guardianForm.isPrimary)} onChange={(event) => setGuardianForm({ ...guardianForm, isPrimary: event.target.checked })} type="checkbox" /> Primary guardian</label>
                <label><input checked={guardianForm.canPickupStudent !== false} onChange={(event) => setGuardianForm({ ...guardianForm, canPickupStudent: event.target.checked })} type="checkbox" /> Can pick up student</label>
                <label><input checked={Boolean(guardianForm.emergencyContact)} onChange={(event) => setGuardianForm({ ...guardianForm, emergencyContact: event.target.checked })} type="checkbox" /> Emergency contact</label>
              </div>
              <div className="form-actions">
                {editingGuardianId && (
                  <button className="secondary-button" onClick={resetGuardianForm} type="button">
                    Cancel
                  </button>
                )}
                <button className="primary-button" disabled={isSaving} type="submit">
                  {isSaving ? 'Saving...' : 'Save Guardian'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {activeTab === 'linking' && (
        <div className="settings-layout manage-families-layout">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Student Linking</h3>
                <p>Attach existing guardians to student records without changing admission data.</p>
              </div>
            </div>
            <label className="form-field">
              <span>Student</span>
              <select
                value={selectedStudentId}
                onChange={(event) => {
                  const studentId = event.target.value
                  setSelectedStudentId(studentId)
                  setLinkForm({ ...linkForm, studentId })
                }}
              >
                <option value="">Select student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.admissionNo} · {student.name} · Class {student.className}{student.section ? `-${student.section}` : ''}
                  </option>
                ))}
              </select>
            </label>
            {selectedStudent && (
              <div className="family-legacy-box">
                <span>Legacy guardian fallback</span>
                <strong>{selectedStudent.guardianName || selectedStudent.fatherName || selectedStudent.motherName || 'No legacy guardian name'}</strong>
                <small>{selectedStudent.mobile || 'No mobile'} · {selectedStudent.email || 'No email'}</small>
                {canManage && (
                  <button className="secondary-button" disabled={isSaving} onClick={() => void createFamilyFromStudent()} type="button">
                    <Icon name="plus" size={16} />
                    Create family from existing student details
                  </button>
                )}
              </div>
            )}
            <DataTable
              columns={[
                { key: 'guardian', header: 'Guardian', render: (link) => link.guardianFullName || link.guardianName },
                { key: 'relation', header: 'Relation', render: (link) => link.relationToStudent || link.relation },
                { key: 'family', header: 'Family', render: (link) => link.familyCode || '—' },
                { key: 'mobile', header: 'Mobile', render: (link) => link.mobile || '—' },
                { key: 'flags', header: 'Flags', render: (link) => (
                  <div className="badge-row">
                    {link.isPrimary && <span className="neutral-badge">Primary</span>}
                    {link.financialResponsibility && <span className="neutral-badge">Financial</span>}
                    {link.pickupAuthorized && <span className="neutral-badge">Pickup</span>}
                  </div>
                ) },
                {
                  key: 'actions',
                  header: '',
                  className: 'align-right',
                  render: (link) => canManage ? (
                    <button className="row-action row-action--danger" onClick={() => void unlinkGuardian(link)} title="Unlink guardian" type="button">
                      <Icon name="trash" size={14} />
                    </button>
                  ) : null,
                },
              ]}
              emptyMessage={selectedStudentId ? 'No structured guardians linked.' : 'Select a student.'}
              getRowKey={(link) => link.id}
              rows={studentLinks}
            />
          </section>

          {canManage && (
            <form className="panel compact-form" onSubmit={(event) => void linkGuardian(event)}>
              <div className="panel-heading">
                <div>
                  <h3>Link Guardian</h3>
                  <p>Select an existing guardian and relationship details.</p>
                </div>
              </div>
              <label className="form-field">
                <span>Guardian</span>
                <select
                  required
                  value={linkForm.guardianId}
                  onChange={(event) => {
                    const guardian = guardians.find((item) => item.id === event.target.value)
                    setLinkForm({
                      ...linkForm,
                      guardianId: event.target.value,
                      familyId: guardian?.familyId ?? linkForm.familyId,
                      relationToStudent: guardian?.relation ?? linkForm.relationToStudent,
                    })
                  }}
                >
                  <option value="">Select guardian</option>
                  {guardians.map((guardian) => (
                    <option key={guardian.id} value={guardian.id}>
                      {guardian.fullName} · {guardian.relation}{guardian.familyCode ? ` · ${guardian.familyCode}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Family</span>
                <select
                  value={linkForm.familyId ?? ''}
                  onChange={(event) => setLinkForm({ ...linkForm, familyId: event.target.value })}
                >
                  <option value="">Use guardian family / no family</option>
                  {families.map((family) => (
                    <option key={family.id} value={family.id}>{family.familyCode} · {family.familyName || family.primaryContactName || 'Family'}</option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span>Relation to Student</span>
                <select
                  value={linkForm.relationToStudent ?? 'Guardian'}
                  onChange={(event) => setLinkForm({ ...linkForm, relationToStudent: event.target.value })}
                >
                  {relationOptions.map((relation) => (
                    <option key={relation} value={relation}>{relation}</option>
                  ))}
                </select>
              </label>
              <div className="checkbox-grid">
                <label><input checked={Boolean(linkForm.isPrimary)} onChange={(event) => setLinkForm({ ...linkForm, isPrimary: event.target.checked })} type="checkbox" /> Primary for student</label>
                <label><input checked={linkForm.livesWithStudent !== false} onChange={(event) => setLinkForm({ ...linkForm, livesWithStudent: event.target.checked })} type="checkbox" /> Lives with student</label>
                <label><input checked={Boolean(linkForm.financialResponsibility)} onChange={(event) => setLinkForm({ ...linkForm, financialResponsibility: event.target.checked })} type="checkbox" /> Financial responsibility</label>
                <label><input checked={linkForm.pickupAuthorized !== false} onChange={(event) => setLinkForm({ ...linkForm, pickupAuthorized: event.target.checked })} type="checkbox" /> Pickup authorized</label>
              </div>
              <button className="primary-button" disabled={isSaving || !selectedStudentId || !linkForm.guardianId} type="submit">
                {isSaving ? 'Saving...' : 'Link Guardian'}
              </button>
            </form>
          )}
        </div>
      )}

      {activeTab === 'siblings' && (
        <div className="settings-layout manage-families-layout">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Sibling Groups</h3>
                <p>Link two or more students into the same family without changing admission records.</p>
              </div>
            </div>
            <div className="student-checkbox-list">
              {students.map((student) => (
                <label key={student.id}>
                  <input
                    checked={siblingStudentIds.includes(student.id)}
                    onChange={() => toggleSiblingStudent(student.id)}
                    type="checkbox"
                  />
                  <span>{student.admissionNo} · {student.name} · Class {student.className}{student.section ? `-${student.section}` : ''}</span>
                </label>
              ))}
            </div>
          </section>
          {canManage && (
            <section className="panel compact-form">
              <div className="panel-heading">
                <div>
                  <h3>Link Selected Students</h3>
                  <p>Choose an existing family or leave blank to create/reuse from selected details.</p>
                </div>
              </div>
              <label className="form-field">
                <span>Target Family</span>
                <select
                  value={siblingFamilyId}
                  onChange={(event) => setSiblingFamilyId(event.target.value)}
                >
                  <option value="">Auto-create or reuse family</option>
                  {families.map((family) => (
                    <option key={family.id} value={family.id}>{family.familyCode} · {family.familyName || family.primaryContactName || 'Family'}</option>
                  ))}
                </select>
              </label>
              <button
                className="primary-button"
                disabled={isSaving || siblingStudentIds.length < 2}
                onClick={() => void linkSiblings()}
                type="button"
              >
                {isSaving ? 'Saving...' : 'Link Siblings'}
              </button>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
