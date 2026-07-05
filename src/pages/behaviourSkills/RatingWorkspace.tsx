import { useEffect, useMemo, useState } from 'react'
import { Icon } from '../../components/Icon'
import {
  getBehaviourSkillsErpApi,
  getErrorMessage,
} from '../../lib/erpApi'
import { getTodayValue } from '../../lib/reportUtils'
import type {
  BehaviourTrait,
  SkillDomain,
  SkillTrait,
  StudentRating,
} from '../../types'
import type { BehaviourSkillsChildProps } from './types'

const ratingOptions: StudentRating[] = [
  'Excellent',
  'Very Good',
  'Good',
  'Average',
  'Needs Improvement',
]

interface RatingDraft {
  rating: StudentRating | ''
  remarks: string
}

interface RatingWorkspaceProps extends BehaviourSkillsChildProps {
  mode: 'behaviour' | 'skill'
  canManageMasters: boolean
  onRefreshTraits: () => Promise<void>
}

export function RatingWorkspace({
  mode,
  canManageMasters,
  data,
  onNotice,
  onRefreshTraits,
}: RatingWorkspaceProps) {
  const activeClasses = data.classes.filter((item) => item.status === 'Active')
  const [className, setClassName] = useState(activeClasses[0]?.name ?? '')
  const [section, setSection] = useState('')
  const [domain, setDomain] = useState<SkillDomain>('Affective')
  const [traitId, setTraitId] = useState('')
  const [ratingDate, setRatingDate] = useState(getTodayValue())
  const [drafts, setDrafts] = useState<Record<string, RatingDraft>>({})
  const [isLoadingRatings, setIsLoadingRatings] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingTraitId, setEditingTraitId] = useState('')
  const [traitName, setTraitName] = useState('')
  const [traitDescription, setTraitDescription] = useState('')
  const [isSavingTrait, setIsSavingTrait] = useState(false)

  const sections = data.sections.filter(
    (item) => item.status === 'Active' && item.className === className,
  )
  const students = useMemo(
    () =>
      data.students.filter(
        (student) =>
          student.status === 'Active' &&
          student.className === className &&
          (!section || student.section === section),
      ),
    [className, data.students, section],
  )
  const traits = useMemo(
    () =>
      mode === 'behaviour'
        ? data.behaviourTraits.filter((item) => item.status === 'Active')
        : data.skillTraits.filter(
            (item) => item.status === 'Active' && item.domain === domain,
          ),
    [data.behaviourTraits, data.skillTraits, domain, mode],
  )
  const managedTraits =
    mode === 'behaviour'
      ? data.behaviourTraits
      : data.skillTraits.filter((item) => item.domain === domain)
  const effectiveTraitId = traits.some((item) => item.id === traitId)
    ? traitId
    : traits[0]?.id ?? ''
  const selectedTrait = traits.find((item) => item.id === effectiveTraitId)
  const title = mode === 'behaviour' ? 'Rate Behaviours' : 'Rate Skills'
  const traitLabel = mode === 'behaviour' ? 'Behaviour trait' : 'Skill trait'

  useEffect(() => {
    let current = true
    if (!className || !effectiveTraitId || !ratingDate) {
      void Promise.resolve().then(() => {
        if (current) setDrafts({})
      })
      return () => {
        current = false
      }
    }
    void Promise.resolve().then(() => {
      if (current) setIsLoadingRatings(true)
    })
    const api = getBehaviourSkillsErpApi()
    const request =
      mode === 'behaviour'
        ? api.getBehaviourRatings({
            className,
            section,
            traitId: effectiveTraitId,
            academicYear: data.settings.academicYear,
            startDate: ratingDate,
            endDate: ratingDate,
          })
        : api.getSkillRatings({
            className,
            section,
            skillId: effectiveTraitId,
            domain,
            academicYear: data.settings.academicYear,
            startDate: ratingDate,
            endDate: ratingDate,
          })
    void request
      .then((rows) => {
        if (!current) return
        setDrafts(
          Object.fromEntries(
            rows.map((row) => [
              row.studentId,
              { rating: row.rating, remarks: row.remarks },
            ]),
          ),
        )
      })
      .catch((error: unknown) => {
        if (current) {
          setDrafts({})
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (current) setIsLoadingRatings(false)
      })
    return () => {
      current = false
    }
  }, [
    className,
    data.settings.academicYear,
    domain,
    mode,
    onNotice,
    ratingDate,
    section,
    effectiveTraitId,
  ])

  const setStudentDraft = (
    studentId: string,
    field: keyof RatingDraft,
    value: string,
  ) => {
    setDrafts((current) => ({
      ...current,
      [studentId]: {
        rating: current[studentId]?.rating ?? '',
        remarks: current[studentId]?.remarks ?? '',
        [field]: value,
      },
    }))
  }

  const markAll = (rating: StudentRating) => {
    setDrafts((current) =>
      Object.fromEntries(
        students.map((student) => [
          student.id,
          {
            rating,
            remarks: current[student.id]?.remarks ?? '',
          },
        ]),
      ),
    )
  }

  const saveRatings = async () => {
    const ratedStudents = students.filter(
      (student) => drafts[student.id]?.rating,
    )
    if (!selectedTrait || ratedStudents.length === 0) {
      onNotice({
        type: 'error',
        message: 'Rate at least one student before saving.',
      })
      return
    }
    setIsSaving(true)
    try {
      const api = getBehaviourSkillsErpApi()
      if (mode === 'behaviour') {
        await api.saveBehaviourRatingsBulk(
          ratedStudents.map((student) => ({
            studentId: student.id,
            traitId: selectedTrait.id,
            rating: drafts[student.id].rating as StudentRating,
            ratingDate,
            academicYear: data.settings.academicYear,
            remarks: drafts[student.id].remarks,
          })),
        )
      } else {
        await api.saveSkillRatingsBulk(
          ratedStudents.map((student) => ({
            studentId: student.id,
            skillId: selectedTrait.id,
            rating: drafts[student.id].rating as StudentRating,
            ratingDate,
            academicYear: data.settings.academicYear,
            remarks: drafts[student.id].remarks,
          })),
        )
      }
      onNotice({
        type: 'success',
        message: `${ratedStudents.length} ${mode} rating(s) saved offline.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSaving(false)
    }
  }

  const resetTraitForm = () => {
    setEditingTraitId('')
    setTraitName('')
    setTraitDescription('')
  }

  const editTrait = (trait: BehaviourTrait | SkillTrait) => {
    setEditingTraitId(trait.id)
    setTraitName(trait.name)
    setTraitDescription(trait.description)
  }

  const saveTrait = async () => {
    if (!traitName.trim()) {
      onNotice({ type: 'error', message: `${traitLabel} name is required.` })
      return
    }
    setIsSavingTrait(true)
    try {
      const api = getBehaviourSkillsErpApi()
      if (mode === 'behaviour') {
        const input = {
          name: traitName,
          description: traitDescription,
        }
        if (editingTraitId) {
          await api.updateBehaviourTrait(editingTraitId, input)
        } else {
          await api.createBehaviourTrait(input)
        }
      } else {
        const input = {
          name: traitName,
          domain,
          description: traitDescription,
        }
        if (editingTraitId) {
          await api.updateSkillTrait(editingTraitId, input)
        } else {
          await api.createSkillTrait(input)
        }
      }
      await onRefreshTraits()
      resetTraitForm()
      onNotice({
        type: 'success',
        message: `${traitLabel} ${editingTraitId ? 'updated' : 'created'}.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setIsSavingTrait(false)
    }
  }

  const deleteTrait = async (trait: BehaviourTrait | SkillTrait) => {
    if (!window.confirm(`Delete "${trait.name}"? Existing ratings are retained.`)) {
      return
    }
    try {
      const api = getBehaviourSkillsErpApi()
      const result =
        mode === 'behaviour'
          ? await api.deleteBehaviourTrait(trait.id)
          : await api.deleteSkillTrait(trait.id)
      if (!result.success) throw new Error(`${traitLabel} was not found.`)
      await onRefreshTraits()
      if (editingTraitId === trait.id) resetTraitForm()
      onNotice({
        type: 'success',
        message: `${traitLabel} deleted. Historical ratings were preserved.`,
      })
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  if (activeClasses.length === 0) {
    return (
      <section className="panel document-empty-state">
        <Icon name="building" size={28} />
        <h3>Create classes from Settings first.</h3>
      </section>
    )
  }

  return (
    <div className="behaviour-rating-stack">
      <section className="panel behaviour-rating-panel">
        <div className="panel-heading behaviour-panel-heading">
          <div>
            <h3>{title}</h3>
            <p>
              Rate active students for a selected trait and date. Existing
              entries are updated when saved again.
            </p>
          </div>
          <div className="behaviour-rating-actions">
            <button
              className="secondary-button"
              disabled={students.length === 0}
              onClick={() => markAll('Good')}
              type="button"
            >
              Mark All Good
            </button>
            <button
              className="primary-button"
              disabled={
                isSaving || students.length === 0 || !effectiveTraitId
              }
              onClick={() => void saveRatings()}
              type="button"
            >
              <Icon name="check" size={16} />
              {isSaving ? 'Saving...' : 'Save Ratings'}
            </button>
          </div>
        </div>

        <div className="behaviour-filter-bar">
          <label className="form-field">
            <span>Class</span>
            <select
              onChange={(event) => {
                setClassName(event.target.value)
                setSection('')
              }}
              value={className}
            >
              {activeClasses.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Section</span>
            <select
              onChange={(event) => setSection(event.target.value)}
              value={section}
            >
              <option value="">All Sections</option>
              {sections.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          {mode === 'skill' && (
            <label className="form-field">
              <span>Domain</span>
              <select
                onChange={(event) => {
                  setDomain(event.target.value as SkillDomain)
                  setTraitId('')
                  resetTraitForm()
                }}
                value={domain}
              >
                <option value="Affective">Affective</option>
                <option value="Psychomotor">Psychomotor</option>
              </select>
            </label>
          )}
          <label className="form-field behaviour-trait-filter">
            <span>{traitLabel}</span>
            <select
              onChange={(event) => setTraitId(event.target.value)}
              value={effectiveTraitId}
            >
              {traits.length === 0 && (
                <option value="">No active traits</option>
              )}
              {traits.map((trait) => (
                <option key={trait.id} value={trait.id}>
                  {trait.name}
                </option>
              ))}
            </select>
          </label>
          <label className="form-field">
            <span>Rating date</span>
            <input
              onChange={(event) => setRatingDate(event.target.value)}
              type="date"
              value={ratingDate}
            />
          </label>
        </div>

        <div className="table-scroll">
          <table className="data-table behaviour-rating-table">
            <thead>
              <tr>
                <th>Admission No</th>
                <th>Student</th>
                <th>Class / Section</th>
                <th>Rating</th>
                <th>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingRatings ? (
                <tr>
                  <td className="empty-table" colSpan={5}>
                    Loading existing ratings...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td className="empty-table" colSpan={5}>
                    No active students found for this class and section.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id}>
                    <td><strong>{student.admissionNo}</strong></td>
                    <td>{student.name}</td>
                    <td>
                      {student.className}
                      {student.section ? ` / ${student.section}` : ''}
                    </td>
                    <td>
                      <select
                        aria-label={`Rating for ${student.name}`}
                        className="behaviour-rating-select"
                        onChange={(event) =>
                          setStudentDraft(
                            student.id,
                            'rating',
                            event.target.value,
                          )
                        }
                        value={drafts[student.id]?.rating ?? ''}
                      >
                        <option value="">Select rating</option>
                        {ratingOptions.map((rating) => (
                          <option key={rating} value={rating}>
                            {rating}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        aria-label={`Remarks for ${student.name}`}
                        className="behaviour-remarks-input"
                        onChange={(event) =>
                          setStudentDraft(
                            student.id,
                            'remarks',
                            event.target.value,
                          )
                        }
                        placeholder="Optional remarks"
                        value={drafts[student.id]?.remarks ?? ''}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {canManageMasters && (
        <section className="panel behaviour-trait-manager">
          <div className="panel-heading">
            <div>
              <h3>Manage {mode === 'behaviour' ? 'Behaviour' : domain} Traits</h3>
              <p>Maintain the rating criteria available to school staff.</p>
            </div>
          </div>
          <div className="behaviour-trait-manager-grid">
            <div className="behaviour-trait-form">
              <label className="form-field">
                <span>Trait name</span>
                <input
                  onChange={(event) => setTraitName(event.target.value)}
                  placeholder="Enter trait name"
                  value={traitName}
                />
              </label>
              <label className="form-field">
                <span>Description</span>
                <textarea
                  onChange={(event) => setTraitDescription(event.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  value={traitDescription}
                />
              </label>
              <div className="behaviour-trait-form-actions">
                {editingTraitId && (
                  <button
                    className="secondary-button"
                    onClick={resetTraitForm}
                    type="button"
                  >
                    Cancel
                  </button>
                )}
                <button
                  className="primary-button"
                  disabled={isSavingTrait}
                  onClick={() => void saveTrait()}
                  type="button"
                >
                  <Icon name={editingTraitId ? 'check' : 'plus'} size={16} />
                  {isSavingTrait
                    ? 'Saving...'
                    : editingTraitId
                      ? 'Update Trait'
                      : 'Add Trait'}
                </button>
              </div>
            </div>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Trait</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {managedTraits.map((trait) => (
                    <tr key={trait.id}>
                      <td>
                        <strong>{trait.name}</strong>
                        <small className="table-secondary-text">
                          {trait.description || 'No description'}
                        </small>
                      </td>
                      <td>
                        <span className={`status-pill status-pill--${trait.status.toLowerCase()}`}>
                          {trait.status}
                        </span>
                      </td>
                      <td>
                        <div className="table-actions">
                          <button
                            aria-label={`Edit ${trait.name}`}
                            className="icon-button"
                            onClick={() => editTrait(trait)}
                            type="button"
                          >
                            <Icon name="edit" size={15} />
                          </button>
                          <button
                            aria-label={`Delete ${trait.name}`}
                            className="icon-button icon-button--danger"
                            onClick={() => void deleteTrait(trait)}
                            type="button"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {managedTraits.length === 0 && (
                    <tr>
                      <td className="empty-table" colSpan={3}>
                        No traits are configured.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
