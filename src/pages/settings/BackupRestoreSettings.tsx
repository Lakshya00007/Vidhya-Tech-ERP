import { useEffect, useState } from 'react'
import { Icon } from '../../components/Icon'
import { getBackupErpApi, getErrorMessage } from '../../lib/erpApi'
import type { DatabaseInfo } from '../../types'
import type { SettingsSectionProps } from '../Settings'

const formatModifiedDate = (value: string) => {
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? 'Unavailable'
    : new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
}

export function BackupRestoreSettings({
  canRestore,
  onNotice,
}: SettingsSectionProps & { canRestore: boolean }) {
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeAction, setActiveAction] = useState<
    'backup' | 'restore' | 'folder' | 'restart' | null
  >(null)
  const [restoreReady, setRestoreReady] = useState(false)

  useEffect(() => {
    let isCurrent = true

    Promise.resolve()
      .then(() => getBackupErpApi().getDatabaseInfo())
      .then((info) => {
        if (isCurrent) {
          setDatabaseInfo(info)
          setRestoreReady(info.restorePending)
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          onNotice({ type: 'error', message: getErrorMessage(error) })
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [onNotice])

  const createBackup = async () => {
    setActiveAction('backup')
    try {
      const result = await getBackupErpApi().createDatabaseBackup()
      if (!result.canceled) {
        onNotice({
          type: result.success ? 'success' : 'error',
          message: result.message,
        })
      }
      if (result.success) {
        const info = await getBackupErpApi().getDatabaseInfo()
        setDatabaseInfo(info)
        setRestoreReady(info.restorePending)
      }
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setActiveAction(null)
    }
  }

  const restoreBackup = async () => {
    if (
      !window.confirm(
        'Restore will replace the current local data after restart. Continue to select a backup file?',
      )
    ) {
      return
    }

    setActiveAction('restore')
    try {
      const result = await getBackupErpApi().restoreDatabaseBackup()
      if (!result.canceled) {
        onNotice({
          type: result.success ? 'success' : 'error',
          message: result.message,
        })
      }
      if (result.success) {
        const info = await getBackupErpApi().getDatabaseInfo()
        setDatabaseInfo(info)
        setRestoreReady(
          Boolean(result.requiresRestart || info.restorePending),
        )
      }
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setActiveAction(null)
    }
  }

  const openFolder = async () => {
    setActiveAction('folder')
    try {
      const result = await getBackupErpApi().openDatabaseFolder()
      if (!result.success) {
        onNotice({ type: 'error', message: result.message })
      }
    } catch (error) {
      onNotice({ type: 'error', message: getErrorMessage(error) })
    } finally {
      setActiveAction(null)
    }
  }

  const restartApp = async () => {
    setActiveAction('restart')
    try {
      const result = await getBackupErpApi().restartApp()
      if (!result.success) {
        setActiveAction(null)
        onNotice({ type: 'error', message: result.message })
      }
    } catch (error) {
      setActiveAction(null)
      onNotice({ type: 'error', message: getErrorMessage(error) })
    }
  }

  const isBusy = activeAction !== null

  return (
    <div className="backup-settings-layout">
      <section className="panel backup-info-panel">
        <div className="panel-heading">
          <div>
            <h3>Local Database</h3>
            <p>Information about the active offline SQLite database</p>
          </div>
          <span className="neutral-badge">
            {databaseInfo?.exists === false ? 'Database missing' : 'Offline storage'}
          </span>
        </div>
        <div className="backup-info-list">
          <div className="backup-info-row backup-info-row--path">
            <span>Database Location</span>
            <strong>
              {isLoading
                ? 'Loading database information...'
                : databaseInfo?.databasePath || 'Unavailable'}
            </strong>
          </div>
          <div className="backup-info-row">
            <span>Database Size</span>
            <strong>
              {databaseInfo
                ? databaseInfo.fileSizeLabel
                : 'Unavailable'}
            </strong>
          </div>
          <div className="backup-info-row">
            <span>Last Modified</span>
            <strong>
              {databaseInfo
                ? formatModifiedDate(databaseInfo.lastModified)
                : 'Unavailable'}
            </strong>
          </div>
        </div>
        <div className="backup-recommendation">
          <Icon name="check" size={17} />
          <span>
            {databaseInfo?.recommendation ||
              'Create regular backups to protect local school records.'}
          </span>
        </div>
        <div className="backup-folder-action">
          <button
            className="secondary-button"
            disabled={isBusy}
            type="button"
            onClick={() => void openFolder()}
          >
            <Icon name="building" size={16} />
            {activeAction === 'folder'
              ? 'Opening Folder...'
              : 'Open Database Folder'}
          </button>
        </div>
      </section>

      <section className="panel backup-actions-panel">
        <div className="panel-heading">
          <div>
            <h3>Backup & Restore</h3>
            <p>Create a portable copy or restore previous local data</p>
          </div>
        </div>
        <div className="backup-action-stack">
          <article className="backup-action-card">
            <span className="backup-action-icon backup-action-icon--blue">
              <Icon name="download" size={21} />
            </span>
            <div>
              <strong>Create Database Backup</strong>
              <p>Save a complete copy of the current database to a safe location.</p>
            </div>
            <button
              className="primary-button"
              disabled={isBusy}
              type="button"
              onClick={() => void createBackup()}
            >
              {activeAction === 'backup' ? 'Creating...' : 'Create Backup'}
            </button>
          </article>

          {canRestore ? (
            <article className="backup-action-card">
              <span className="backup-action-icon backup-action-icon--amber">
                <Icon name="clock" size={21} />
              </span>
              <div>
                <strong>Restore Database Backup</strong>
                <p>Select a valid School ERP .db backup and apply it on restart.</p>
              </div>
              <button
                className="secondary-button"
                disabled={isBusy}
                type="button"
                onClick={() => void restoreBackup()}
              >
                {activeAction === 'restore' ? 'Preparing...' : 'Restore Backup'}
              </button>
            </article>
          ) : (
            <div className="form-note">
              <Icon name="user" size={17} />
              Database restore is restricted to the Owner role.
            </div>
          )}

          <div className="backup-warning">
            <Icon name="clock" size={18} />
            <div>
              <strong>Restore replaces local data</strong>
              <p>
                Restore will replace current local data. A safety backup will be
                created before restore.
              </p>
            </div>
          </div>

          {canRestore && restoreReady && (
            <div className="backup-restart-card">
              <div>
                <strong>Restore is ready</strong>
                <p>Restart the app now to load the restored database.</p>
              </div>
              <button
                className="primary-button"
                disabled={activeAction === 'restart'}
                type="button"
                onClick={() => void restartApp()}
              >
                <Icon name="arrow" size={16} />
                {activeAction === 'restart' ? 'Restarting...' : 'Restart App'}
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
