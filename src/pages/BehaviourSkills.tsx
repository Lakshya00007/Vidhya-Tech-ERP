import { useCallback, useEffect, useState } from 'react'
import { Icon, type IconName } from '../components/Icon'
import {
  getBehaviourSkillsErpApi,
  getErrorMessage,
} from '../lib/erpApi'
import type { SchoolSettings } from '../types'
import { DomainReport } from './behaviourSkills/DomainReport'
import { Observations } from './behaviourSkills/Observations'
import { RatingWorkspace } from './behaviourSkills/RatingWorkspace'
import type {
  BehaviourSkillsData,
  BehaviourSkillsNotice,
  BehaviourSkillsView,
} from './behaviourSkills/types'

export type { BehaviourSkillsView } from './behaviourSkills/types'

interface BehaviourSkillsProps {
  initialView?: BehaviourSkillsView
  canManageMasters: boolean
  canDeleteObservations: boolean
}

const fallbackSettings: SchoolSettings = {
  id: 'school-profile',
  schoolName: 'Vidhya School ERP',
  address: '',
  phone: '',
  email: '',
  academicYear: '',
  receiptPrefix: '',
  createdAt: '',
  updatedAt: '',
}

const initialData: BehaviourSkillsData = {
  students: [],
  classes: [],
  sections: [],
  behaviourTraits: [],
  skillTraits: [],
  settings: fallbackSettings,
}

const tabs: {
  id: BehaviourSkillsView
  label: string
  icon: IconName
}[] = [
  { id: 'behaviours', label: 'Rate Behaviours', icon: 'check' },
  { id: 'skills', label: 'Rate Skills', icon: 'edit' },
  { id: 'observations', label: 'Observations', icon: 'students' },
  { id: 'affective', label: 'Affective Domain Report', icon: 'reports' },
  { id: 'psychomotor', label: 'Psychomotor Domain Report', icon: 'reports' },
]

export function BehaviourSkills({
  initialView = 'behaviours',
  canManageMasters,
  canDeleteObservations,
}: BehaviourSkillsProps) {
  const [activeView, setActiveView] =
    useState<BehaviourSkillsView>(initialView)
  const [data, setData] = useState<BehaviourSkillsData>(initialData)
  const [notice, setNotice] = useState<BehaviourSkillsNotice | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshTraits = useCallback(async () => {
    const api = getBehaviourSkillsErpApi()
    const [behaviourTraits, skillTraits] = await Promise.all([
      api.getBehaviourTraits(),
      api.getSkillTraits(),
    ])
    setData((current) => ({
      ...current,
      behaviourTraits,
      skillTraits,
    }))
  }, [])

  useEffect(() => {
    let current = true
    Promise.resolve()
      .then(() => {
        const api = getBehaviourSkillsErpApi()
        return Promise.all([
          api.getStudents(),
          api.getClasses(),
          api.getSections(),
          api.getBehaviourTraits(),
          api.getSkillTraits(),
          api.getSchoolSettings(),
        ])
      })
      .then(
        ([
          students,
          classes,
          sections,
          behaviourTraits,
          skillTraits,
          settings,
        ]) => {
          if (!current) return
          setData({
            students,
            classes,
            sections,
            behaviourTraits,
            skillTraits,
            settings,
          })
        },
      )
      .catch((error: unknown) => {
        if (current) {
          setNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => {
      current = false
    }
  }, [])

  const childProps = { data, onNotice: setNotice }

  return (
    <div className="page-stack behaviour-skills-page">
      <section className="page-header">
        <div>
          <h2>Behaviour & Skills</h2>
          <p>
            Record student development ratings and maintain structured
            observation histories offline.
          </p>
        </div>
      </section>

      <nav
        aria-label="Behaviour and skills sections"
        className="settings-tabs behaviour-skills-tabs"
      >
        {tabs.map((tab) => (
          <button
            className={`settings-tab${
              activeView === tab.id ? ' settings-tab--active' : ''
            }`}
            key={tab.id}
            onClick={() => {
              setActiveView(tab.id)
              setNotice(null)
            }}
            type="button"
          >
            <Icon name={tab.icon} size={17} />
            {tab.label}
          </button>
        ))}
      </nav>

      {notice && (
        <div
          className={`inline-message${
            notice.type === 'error' ? ' inline-message--error' : ''
          }`}
        >
          <Icon name={notice.type === 'error' ? 'close' : 'check'} size={17} />
          <span>{notice.message}</span>
          <button
            aria-label="Dismiss message"
            onClick={() => setNotice(null)}
            type="button"
          >
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      {isLoading ? (
        <section className="panel document-empty-state">
          <span className="loading-spinner" />
          <h3>Loading behaviour and skills records...</h3>
        </section>
      ) : (
        <>
          {activeView === 'behaviours' && (
            <RatingWorkspace
              {...childProps}
              canManageMasters={canManageMasters}
              mode="behaviour"
              onRefreshTraits={refreshTraits}
            />
          )}
          {activeView === 'skills' && (
            <RatingWorkspace
              {...childProps}
              canManageMasters={canManageMasters}
              mode="skill"
              onRefreshTraits={refreshTraits}
            />
          )}
          {activeView === 'observations' && (
            <Observations
              {...childProps}
              canDelete={canDeleteObservations}
            />
          )}
          {activeView === 'affective' && (
            <DomainReport {...childProps} domain="Affective" />
          )}
          {activeView === 'psychomotor' && (
            <DomainReport {...childProps} domain="Psychomotor" />
          )}
        </>
      )}
    </div>
  )
}
