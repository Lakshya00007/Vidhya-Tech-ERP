import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { DataTable, type TableColumn } from '../components/DataTable'
import { Icon } from '../components/Icon'
import { getErpApi, getErrorMessage } from '../lib/erpApi'
import type {
  Announcement,
  AnnouncementAudienceType,
  AuthUser,
  MessagePriority,
  MessageRecipientCandidate,
  MessageThreadDetail,
  MessageThreadSummary,
  MessageThreadType,
  SchoolSettings,
} from '../types'

export type MessageCenterTab =
  | 'inbox'
  | 'sent'
  | 'compose'
  | 'announcements'
  | 'archived'

interface MessageCenterProps {
  currentUser: AuthUser
  initialTab?: MessageCenterTab
}

type RecipientType = 'User' | 'Employee' | 'Student'

const tabs: { id: MessageCenterTab; label: string }[] = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'sent', label: 'Sent' },
  { id: 'compose', label: 'Compose' },
  { id: 'announcements', label: 'Announcements' },
  { id: 'archived', label: 'Archived' },
]

const priorities: MessagePriority[] = ['Low', 'Normal', 'High', 'Urgent']
const threadTypes: MessageThreadType[] = [
  'Direct',
  'Announcement',
  'Class Notice',
  'Staff Notice',
  'System',
]
const adminAudiences: AnnouncementAudienceType[] = [
  'All Users',
  'All Students',
  'All Employees',
  'Teachers',
  'Accountants',
  'Specific Class',
  'Specific Section',
  'Selected Users',
]
const teacherAudiences: AnnouncementAudienceType[] = [
  'Specific Class',
  'Specific Section',
]

const emptyAnnouncementForm = {
  title: '',
  announcementText: '',
  audienceType: 'All Users' as AnnouncementAudienceType,
  academicSessionId: '',
  className: '',
  section: '',
  priority: 'Normal' as MessagePriority,
  publishFrom: '',
  publishUntil: '',
  selectedUserIds: [] as string[],
}

const formatDateTime = (value: string) =>
  value ? new Date(value).toLocaleString() : '-'

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const exportCsv = (
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>,
) => {
  const csv = [headers, ...rows]
    .map((row) =>
      row
        .map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`)
        .join(','),
    )
    .join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

const canComposeDirect = (role: AuthUser['role']) =>
  ['Owner', 'Admin', 'Accountant', 'Teacher'].includes(role)

const canManageAnnouncements = (role: AuthUser['role']) =>
  ['Owner', 'Admin', 'Teacher'].includes(role)

const canDeleteAnnouncement = (role: AuthUser['role']) =>
  role === 'Owner' || role === 'Admin'

export function MessageCenter({
  currentUser,
  initialTab = 'inbox',
}: MessageCenterProps) {
  const [activeTab, setActiveTab] = useState<MessageCenterTab>(initialTab)
  const [threads, setThreads] = useState<MessageThreadSummary[]>([])
  const [sentThreads, setSentThreads] = useState<MessageThreadSummary[]>([])
  const [archivedThreads, setArchivedThreads] = useState<MessageThreadSummary[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [selectedThread, setSelectedThread] = useState<MessageThreadDetail | null>(
    null,
  )
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null)
  const [search, setSearch] = useState('')
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [typeFilter, setTypeFilter] = useState<MessageThreadType | 'All'>('All')
  const [priorityFilter, setPriorityFilter] =
    useState<MessagePriority | 'All'>('All')
  const [recipientType, setRecipientType] = useState<RecipientType>('User')
  const [recipientSearch, setRecipientSearch] = useState('')
  const [recipients, setRecipients] = useState<MessageRecipientCandidate[]>([])
  const [selectedRecipientIds, setSelectedRecipientIds] = useState<string[]>([])
  const [composeSubject, setComposeSubject] = useState('')
  const [composePriority, setComposePriority] =
    useState<MessagePriority>('Normal')
  const [composeBody, setComposeBody] = useState('')
  const [replyText, setReplyText] = useState('')
  const [announcementForm, setAnnouncementForm] = useState(
    emptyAnnouncementForm,
  )
  const [editingAnnouncementId, setEditingAnnouncementId] = useState('')
  const [announcementRecipientSearch, setAnnouncementRecipientSearch] =
    useState('')
  const [announcementRecipients, setAnnouncementRecipients] = useState<
    MessageRecipientCandidate[]
  >([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const showNotice = (type: 'success' | 'error', text: string) => {
    if (type === 'success') {
      setMessage(text)
      setError('')
    } else {
      setError(text)
      setMessage('')
    }
  }

  const loadThreads = useCallback(async () => {
    setIsLoading(true)
    try {
      const filter = {
        search,
        unreadOnly,
        archived: false,
        threadType: typeFilter === 'All' ? undefined : typeFilter,
        priority: priorityFilter === 'All' ? undefined : priorityFilter,
      }
      const [inboxRows, sentRows, archivedRows, announcementRows, settings] =
        await Promise.all([
          getErpApi().getMessageInbox(filter),
          getErpApi().getSentMessages({
            search,
            threadType: typeFilter === 'All' ? undefined : typeFilter,
            priority: priorityFilter === 'All' ? undefined : priorityFilter,
          }),
          getErpApi().getMessageInbox({ ...filter, archived: true }),
          getErpApi().getAnnouncements({ search }),
          getErpApi().getSchoolSettings(),
        ])
      setThreads(inboxRows)
      setSentThreads(sentRows)
      setArchivedThreads(archivedRows)
      setAnnouncements(announcementRows)
      setSchoolSettings(settings)
      setError('')
    } catch (loadError) {
      setError(getErrorMessage(loadError))
    } finally {
      setIsLoading(false)
    }
  }, [priorityFilter, search, typeFilter, unreadOnly])

  useEffect(() => {
    void Promise.resolve().then(loadThreads)
  }, [loadThreads])

  useEffect(() => {
    if (!canComposeDirect(currentUser.role)) {
      return
    }
    let cancelled = false
    getErpApi()
      .getEligibleMessageRecipients({
        recipientType,
        search: recipientSearch,
      })
      .then((rows) => {
        if (!cancelled) setRecipients(rows)
      })
      .catch(() => {
        if (!cancelled) setRecipients([])
      })
    return () => {
      cancelled = true
    }
  }, [currentUser.role, recipientSearch, recipientType])

  useEffect(() => {
    if (announcementForm.audienceType !== 'Selected Users') {
      return
    }
    let cancelled = false
    getErpApi()
      .getEligibleMessageRecipients({
        search: announcementRecipientSearch,
      })
      .then((rows) => {
        if (!cancelled) setAnnouncementRecipients(rows)
      })
      .catch(() => {
        if (!cancelled) setAnnouncementRecipients([])
      })
    return () => {
      cancelled = true
    }
  }, [announcementForm.audienceType, announcementRecipientSearch])

  const openThread = async (threadId: string, markRead = true) => {
    try {
      const detail = markRead
        ? await getErpApi().markMessageThreadRead(threadId)
        : await getErpApi().getMessageThread(threadId)
      setSelectedThread(detail)
      await loadThreads()
    } catch (openError) {
      try {
        const detail = await getErpApi().getMessageThread(threadId)
        setSelectedThread(detail)
      } catch {
        showNotice('error', getErrorMessage(openError))
      }
    }
  }

  const archiveThread = async (threadId: string) => {
    try {
      await getErpApi().archiveMessageThread(threadId)
      setSelectedThread(null)
      showNotice('success', 'Thread was archived.')
      await loadThreads()
    } catch (archiveError) {
      showNotice('error', getErrorMessage(archiveError))
    }
  }

  const unarchiveThread = async (threadId: string) => {
    try {
      await getErpApi().unarchiveMessageThread(threadId)
      showNotice('success', 'Thread was restored to inbox.')
      await loadThreads()
    } catch (restoreError) {
      showNotice('error', getErrorMessage(restoreError))
    }
  }

  const sendDirectMessage = async (event: FormEvent) => {
    event.preventDefault()
    setIsSaving(true)
    try {
      const thread = await getErpApi().createDirectMessage({
        recipientType,
        recipientUserIds: selectedRecipientIds,
        subject: composeSubject,
        priority: composePriority,
        messageText: composeBody,
      })
      setSelectedThread(thread)
      setComposeSubject('')
      setComposeBody('')
      setSelectedRecipientIds([])
      showNotice('success', 'Local message was sent.')
      await loadThreads()
      setActiveTab('sent')
    } catch (sendError) {
      showNotice('error', getErrorMessage(sendError))
    } finally {
      setIsSaving(false)
    }
  }

  const replyToThread = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedThread) return
    setIsSaving(true)
    try {
      const thread = await getErpApi().replyToMessageThread({
        threadId: selectedThread.id,
        messageText: replyText,
      })
      setSelectedThread(thread)
      setReplyText('')
      showNotice('success', 'Reply was saved locally.')
      await loadThreads()
    } catch (replyError) {
      showNotice('error', getErrorMessage(replyError))
    } finally {
      setIsSaving(false)
    }
  }

  const editMessage = async (messageId: string, currentText: string) => {
    const nextText = window.prompt('Edit message', currentText)
    if (!nextText || nextText === currentText) return
    try {
      const thread = await getErpApi().editOwnMessage(messageId, nextText)
      setSelectedThread(thread)
      showNotice('success', 'Message was updated.')
    } catch (editError) {
      showNotice('error', getErrorMessage(editError))
    }
  }

  const deleteMessage = async (messageId: string) => {
    if (!window.confirm('Remove this message from the conversation?')) return
    try {
      await getErpApi().deleteOwnMessage(messageId)
      if (selectedThread) {
        await openThread(selectedThread.id, false)
      }
      showNotice('success', 'Message was removed.')
    } catch (deleteError) {
      showNotice('error', getErrorMessage(deleteError))
    }
  }

  const saveAnnouncement = async (status: 'Draft' | 'Published') => {
    setIsSaving(true)
    try {
      const payload = {
        ...announcementForm,
        status,
      }
      if (editingAnnouncementId) {
        const updated = await getErpApi().updateAnnouncement(
          editingAnnouncementId,
          payload,
        )
        if (status === 'Published' && updated.status !== 'Published') {
          await getErpApi().publishAnnouncement(updated.id)
        }
      } else {
        await getErpApi().createAnnouncement(payload)
      }
      setAnnouncementForm(emptyAnnouncementForm)
      setEditingAnnouncementId('')
      showNotice(
        'success',
        status === 'Published'
          ? 'Announcement was published locally.'
          : 'Announcement draft was saved.',
      )
      await loadThreads()
    } catch (saveError) {
      showNotice('error', getErrorMessage(saveError))
    } finally {
      setIsSaving(false)
    }
  }

  const editAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncementId(announcement.id)
    setAnnouncementForm({
      title: announcement.title,
      announcementText: announcement.announcementText,
      audienceType: announcement.audienceType,
      academicSessionId: announcement.academicSessionId,
      className: announcement.className,
      section: announcement.section,
      priority: announcement.priority,
      publishFrom: announcement.publishFrom,
      publishUntil: announcement.publishUntil,
      selectedUserIds: announcement.selectedUserIds,
    })
  }

  const cancelAnnouncement = async (announcement: Announcement) => {
    if (!window.confirm('Cancel this announcement?')) return
    try {
      await getErpApi().cancelAnnouncement(announcement.id)
      showNotice('success', 'Announcement was cancelled.')
      await loadThreads()
    } catch (cancelError) {
      showNotice('error', getErrorMessage(cancelError))
    }
  }

  const deleteAnnouncement = async (announcement: Announcement) => {
    if (!window.confirm('Soft delete this announcement?')) return
    try {
      await getErpApi().deleteAnnouncement(announcement.id)
      showNotice('success', 'Announcement was deleted.')
      await loadThreads()
    } catch (deleteError) {
      showNotice('error', getErrorMessage(deleteError))
    }
  }

  const exportDeliveryReport = async (thread: MessageThreadSummary) => {
    try {
      const report = await getErpApi().getMessageDeliveryReport(thread.id)
      exportCsv(
        `message-delivery-${thread.id}.csv`,
        [
          'Recipient',
          'Username',
          'Role',
          'Entity',
          'Status',
          'Delivered At',
          'Read At',
        ],
        report.recipients.map((recipient) => [
          recipient.recipientName,
          recipient.recipientUsername,
          recipient.recipientRole,
          recipient.recipientEntityName || recipient.recipientEntityCode,
          recipient.deliveryStatus,
          recipient.deliveredAt,
          recipient.readAt,
        ]),
      )
    } catch (reportError) {
      showNotice('error', getErrorMessage(reportError))
    }
  }

  const exportAnnouncementReport = async (announcement: Announcement) => {
    try {
      const report = await getErpApi().getAnnouncementReadReport(announcement.id)
      exportCsv(
        `announcement-read-${announcement.id}.csv`,
        ['Recipient', 'Username', 'Role', 'Status', 'Delivered At', 'Read At'],
        report.recipients.map((recipient) => [
          recipient.recipientName,
          recipient.recipientUsername,
          recipient.recipientRole,
          recipient.deliveryStatus,
          recipient.deliveredAt,
          recipient.readAt,
        ]),
      )
    } catch (reportError) {
      showNotice('error', getErrorMessage(reportError))
    }
  }

  const printAnnouncement = (announcement: Announcement) => {
    const settings = schoolSettings
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return
    printWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>${escapeHtml(announcement.title)}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
          .notice { width: 210mm; min-height: 297mm; padding: 20mm; box-sizing: border-box; }
          .header { text-align: center; border-bottom: 1px solid #d1d5db; padding-bottom: 12px; }
          .header h1 { margin: 0; font-size: 24px; }
          .header p { margin: 4px 0 0; color: #4b5563; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 18px 0; font-size: 13px; }
          .title { text-align: center; font-size: 20px; margin: 22px 0; text-transform: uppercase; }
          .body { white-space: pre-wrap; line-height: 1.7; font-size: 14px; }
          .signature { margin-top: 52px; display: flex; justify-content: flex-end; }
          .signature span { border-top: 1px solid #111827; padding-top: 8px; min-width: 180px; text-align: center; }
          @page { size: A4; margin: 0; }
        </style>
      </head>
      <body>
        <main class="notice">
          <section class="header">
            <h1>${escapeHtml(settings?.schoolName || 'School')}</h1>
            <p>${escapeHtml(settings?.address || '')}</p>
          </section>
          <section class="meta">
            <div><strong>Date:</strong> ${escapeHtml(formatDateTime(announcement.updatedAt))}</div>
            <div><strong>Audience:</strong> ${escapeHtml(announcement.audienceType)}</div>
            <div><strong>Priority:</strong> ${escapeHtml(announcement.priority)}</div>
            <div><strong>Status:</strong> ${escapeHtml(announcement.status)}</div>
          </section>
          <h2 class="title">${escapeHtml(announcement.title)}</h2>
          <section class="body">${escapeHtml(announcement.announcementText)}</section>
          <section class="signature"><span>Authorized Signature</span></section>
        </main>
      </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    printWindow.print()
  }

  const visibleThreads = activeTab === 'archived' ? archivedThreads : threads
  const audienceOptions = useMemo(
    () =>
      currentUser.role === 'Teacher'
        ? teacherAudiences
        : adminAudiences,
    [currentUser.role],
  )

  const threadColumns: TableColumn<MessageThreadSummary>[] = [
    {
      key: 'sender',
      header: activeTab === 'sent' ? 'Created By' : 'Sender',
      render: (row) => row.senderName || row.createdByName || '-',
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row) => (
        <button
          className="link-button"
          onClick={() => void openThread(row.id, activeTab !== 'sent')}
          type="button"
        >
          {row.subject}
        </button>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => row.threadType },
    { key: 'priority', header: 'Priority', render: (row) => row.priority },
    {
      key: 'date',
      header: 'Date',
      render: (row) => formatDateTime(row.lastMessageAt || row.updatedAt),
    },
    {
      key: 'read',
      header: activeTab === 'sent' ? 'Read' : 'State',
      render: (row) =>
        activeTab === 'sent'
          ? `${row.readCount}/${row.recipientCount}`
          : row.isRead
            ? 'Read'
            : 'Unread',
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="row-actions">
          <button className="row-action" onClick={() => void openThread(row.id, activeTab !== 'sent')} type="button">
            <Icon name="view" size={14} />
          </button>
          {activeTab === 'sent' && (
            <button className="row-action" onClick={() => void exportDeliveryReport(row)} type="button">
              <Icon name="download" size={14} />
            </button>
          )}
          {activeTab === 'archived' ? (
            <button className="row-action" onClick={() => void unarchiveThread(row.id)} type="button">
              <Icon name="arrow" size={14} />
            </button>
          ) : activeTab !== 'sent' ? (
            <button className="row-action" onClick={() => void archiveThread(row.id)} type="button">
              <Icon name="clock" size={14} />
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  const announcementColumns: TableColumn<Announcement>[] = [
    { key: 'title', header: 'Title', render: (row) => row.title },
    { key: 'audience', header: 'Audience', render: (row) => row.audienceType },
    { key: 'priority', header: 'Priority', render: (row) => row.priority },
    { key: 'status', header: 'Status', render: (row) => row.status },
    {
      key: 'read',
      header: 'Read',
      render: (row) => `${row.readCount}/${row.recipientCount}`,
    },
    {
      key: 'updated',
      header: 'Updated',
      render: (row) => formatDateTime(row.updatedAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        const canManageThisAnnouncement =
          canDeleteAnnouncement(currentUser.role) ||
          row.createdByUserId === currentUser.id
        return (
          <div className="row-actions">
            {canManageThisAnnouncement && (
              <button className="row-action" onClick={() => editAnnouncement(row)} type="button">
                <Icon name="edit" size={14} />
              </button>
            )}
            {canManageThisAnnouncement && row.status === 'Draft' && (
              <button className="row-action" onClick={() => void getErpApi().publishAnnouncement(row.id).then(loadThreads).catch((publishError) => showNotice('error', getErrorMessage(publishError)))} type="button">
                <Icon name="check" size={14} />
              </button>
            )}
            <button className="row-action" onClick={() => printAnnouncement(row)} type="button">
              <Icon name="print" size={14} />
            </button>
            {canManageThisAnnouncement && (
              <button className="row-action" onClick={() => void exportAnnouncementReport(row)} type="button">
                <Icon name="download" size={14} />
              </button>
            )}
            {canManageThisAnnouncement && row.status !== 'Cancelled' && (
              <button className="row-action row-action--danger" onClick={() => void cancelAnnouncement(row)} type="button">
                <Icon name="close" size={14} />
              </button>
            )}
            {canDeleteAnnouncement(currentUser.role) && (
              <button className="row-action row-action--danger" onClick={() => void deleteAnnouncement(row)} type="button">
                <Icon name="trash" size={14} />
              </button>
            )}
          </div>
        )
      },
    },
  ]

  if (isLoading) {
    return (
      <section className="panel document-empty-state">
        <span className="loading-spinner" />
        <h3>Loading local message center...</h3>
      </section>
    )
  }

  return (
    <div className="page-stack message-center-page">
      <section className="page-header">
        <div>
          <h2>Local Message Center</h2>
          <p>Offline direct messages, staff notices and class announcements.</p>
        </div>
      </section>

      {message && (
        <div className="inline-message">
          <Icon name="check" size={17} />
          <span>{message}</span>
          <button aria-label="Dismiss message" onClick={() => setMessage('')} type="button">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}
      {error && (
        <div className="inline-message inline-message--error">
          <Icon name="close" size={17} />
          <span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError('')} type="button">
            <Icon name="close" size={15} />
          </button>
        </div>
      )}

      <nav className="settings-tabs" aria-label="Message center sections">
        {tabs
          .filter((tab) => tab.id !== 'compose' || canComposeDirect(currentUser.role))
          .map((tab) => (
            <button
              className={`settings-tab${activeTab === tab.id ? ' settings-tab--active' : ''}`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
      </nav>

      {['inbox', 'sent', 'archived'].includes(activeTab) && (
        <section className="message-center-grid">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h3>{activeTab === 'sent' ? 'Sent' : activeTab === 'archived' ? 'Archived' : 'Inbox'}</h3>
                <p>{activeTab === 'sent' ? 'Messages and notices created by you.' : 'Messages delivered to your local account.'}</p>
              </div>
            </div>
            <div className="toolbar-grid">
              <label>
                Search
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Subject, sender or text" />
              </label>
              <label>
                Type
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as MessageThreadType | 'All')}>
                  <option value="All">All</option>
                  {threadTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label>
                Priority
                <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as MessagePriority | 'All')}>
                  <option value="All">All</option>
                  {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                </select>
              </label>
              {activeTab === 'inbox' && (
                <label className="checkbox-label">
                  <input checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} type="checkbox" />
                  Unread only
                </label>
              )}
            </div>
            <DataTable
              columns={threadColumns}
              emptyMessage="No local messages found"
              getRowKey={(row) => row.id}
              rows={activeTab === 'sent' ? sentThreads : visibleThreads}
            />
          </div>
          <ThreadPanel
            currentUserId={currentUser.id}
            isSaving={isSaving}
            onArchive={archiveThread}
            onDeleteMessage={deleteMessage}
            onEditMessage={editMessage}
            onReply={replyToThread}
            replyText={replyText}
            selectedThread={selectedThread}
            setReplyText={setReplyText}
          />
        </section>
      )}

      {activeTab === 'compose' && canComposeDirect(currentUser.role) && (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h3>Compose Direct Message</h3>
              <p>Local inbox delivery only. This does not send SMS, email or WhatsApp.</p>
            </div>
          </div>
          <form className="form-grid" onSubmit={sendDirectMessage}>
            <label>
              Recipient Type
              <select value={recipientType} onChange={(event) => {
                setRecipientType(event.target.value as RecipientType)
                setSelectedRecipientIds([])
              }}>
                <option value="User">User</option>
                <option value="Employee">Employee</option>
                {(currentUser.role === 'Owner' || currentUser.role === 'Admin' || currentUser.role === 'Teacher') && (
                  <option value="Student">Student</option>
                )}
              </select>
            </label>
            <label>
              Search Recipient
              <input value={recipientSearch} onChange={(event) => setRecipientSearch(event.target.value)} placeholder="Name, username, code or class" />
            </label>
            <label>
              Priority
              <select value={composePriority} onChange={(event) => setComposePriority(event.target.value as MessagePriority)}>
                {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </label>
            <label className="span-2">
              Recipients
              <select multiple value={selectedRecipientIds} onChange={(event) => setSelectedRecipientIds(Array.from(event.target.selectedOptions).map((option) => option.value))}>
                {recipients.map((recipient) => (
                  <option key={recipient.userId} value={recipient.userId}>
                    {recipient.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="span-2">
              Subject
              <input value={composeSubject} onChange={(event) => setComposeSubject(event.target.value)} required />
            </label>
            <label className="span-2">
              Message
              <textarea value={composeBody} onChange={(event) => setComposeBody(event.target.value)} required rows={6} />
            </label>
            <div className="form-actions span-2">
              <button className="primary-button" disabled={isSaving} type="submit">
                <Icon name="check" size={17} />
                Send Local Message
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === 'announcements' && (
        <section className="message-center-grid message-center-grid--announcements">
          {canManageAnnouncements(currentUser.role) && (
            <div className="panel">
              <div className="panel-heading">
                <div>
                  <h3>{editingAnnouncementId ? 'Edit Announcement' : 'New Announcement'}</h3>
                  <p>Published notices create local recipient rows and read receipts.</p>
                </div>
              </div>
              <form className="form-grid" onSubmit={(event) => {
                event.preventDefault()
                void saveAnnouncement('Draft')
              }}>
                <label className="span-2">
                  Title
                  <input value={announcementForm.title} onChange={(event) => setAnnouncementForm((form) => ({ ...form, title: event.target.value }))} required />
                </label>
                <label>
                  Audience
                  <select value={announcementForm.audienceType} onChange={(event) => setAnnouncementForm((form) => ({ ...form, audienceType: event.target.value as AnnouncementAudienceType, selectedUserIds: [] }))}>
                    {audienceOptions.map((audience) => <option key={audience} value={audience}>{audience}</option>)}
                  </select>
                </label>
                <label>
                  Priority
                  <select value={announcementForm.priority} onChange={(event) => setAnnouncementForm((form) => ({ ...form, priority: event.target.value as MessagePriority }))}>
                    {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                  </select>
                </label>
                {['Specific Class', 'Specific Section'].includes(announcementForm.audienceType) && (
                  <>
                    <label>
                      Class
                      <input value={announcementForm.className} onChange={(event) => setAnnouncementForm((form) => ({ ...form, className: event.target.value }))} required />
                    </label>
                    <label>
                      Section
                      <input value={announcementForm.section} onChange={(event) => setAnnouncementForm((form) => ({ ...form, section: event.target.value }))} required={announcementForm.audienceType === 'Specific Section'} />
                    </label>
                  </>
                )}
                {announcementForm.audienceType === 'Selected Users' && (
                  <>
                    <label>
                      Search Users
                      <input value={announcementRecipientSearch} onChange={(event) => setAnnouncementRecipientSearch(event.target.value)} />
                    </label>
                    <label>
                      Selected Users
                      <select multiple value={announcementForm.selectedUserIds} onChange={(event) => setAnnouncementForm((form) => ({ ...form, selectedUserIds: Array.from(event.target.selectedOptions).map((option) => option.value) }))}>
                        {announcementRecipients.map((recipient) => (
                          <option key={recipient.userId} value={recipient.userId}>
                            {recipient.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </>
                )}
                <label>
                  Publish From
                  <input type="date" value={announcementForm.publishFrom.slice(0, 10)} onChange={(event) => setAnnouncementForm((form) => ({ ...form, publishFrom: event.target.value }))} />
                </label>
                <label>
                  Publish Until
                  <input type="date" value={announcementForm.publishUntil.slice(0, 10)} onChange={(event) => setAnnouncementForm((form) => ({ ...form, publishUntil: event.target.value }))} />
                </label>
                <label className="span-2">
                  Message
                  <textarea rows={7} value={announcementForm.announcementText} onChange={(event) => setAnnouncementForm((form) => ({ ...form, announcementText: event.target.value }))} required />
                </label>
                <div className="form-actions span-2">
                  {editingAnnouncementId && (
                    <button className="secondary-button" onClick={() => {
                      setEditingAnnouncementId('')
                      setAnnouncementForm(emptyAnnouncementForm)
                    }} type="button">
                      Cancel Edit
                    </button>
                  )}
                  <button className="secondary-button" disabled={isSaving} type="submit">
                    Save Draft
                  </button>
                  <button className="primary-button" disabled={isSaving} onClick={() => void saveAnnouncement('Published')} type="button">
                    <Icon name="check" size={17} />
                    Publish
                  </button>
                </div>
              </form>
            </div>
          )}
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h3>Announcement Register</h3>
                <p>Read receipts and printed notices remain local to this ERP.</p>
              </div>
            </div>
            <DataTable
              columns={announcementColumns}
              emptyMessage="No announcements found"
              getRowKey={(row) => row.id}
              rows={announcements}
            />
          </div>
        </section>
      )}
    </div>
  )
}

interface ThreadPanelProps {
  currentUserId: string
  isSaving: boolean
  selectedThread: MessageThreadDetail | null
  replyText: string
  setReplyText: (value: string) => void
  onReply: (event: FormEvent) => void
  onArchive: (threadId: string) => Promise<void>
  onEditMessage: (messageId: string, currentText: string) => Promise<void>
  onDeleteMessage: (messageId: string) => Promise<void>
}

function ThreadPanel({
  currentUserId,
  isSaving,
  selectedThread,
  replyText,
  setReplyText,
  onReply,
  onArchive,
  onEditMessage,
  onDeleteMessage,
}: ThreadPanelProps) {
  if (!selectedThread) {
    return (
      <section className="panel message-thread-panel message-thread-panel--empty">
        <Icon name="bell" size={28} />
        <h3>Select a thread</h3>
        <p>Open an inbox or sent item to view the local conversation.</p>
      </section>
    )
  }
  const isCurrentUserRecipient = selectedThread.recipients.some(
    (recipient) => recipient.recipientUserId === currentUserId,
  )
  const readCount = selectedThread.recipients.filter(
    (recipient) => recipient.readAt,
  ).length

  return (
    <section className="panel message-thread-panel">
      <div className="panel-heading">
        <div>
          <h3>{selectedThread.subject}</h3>
          <p>{selectedThread.threadType} · {selectedThread.priority}</p>
        </div>
        {isCurrentUserRecipient && (
          <button className="secondary-button" onClick={() => void onArchive(selectedThread.id)} type="button">
            Archive
          </button>
        )}
      </div>
      <div className="thread-recipient-summary">
        {selectedThread.recipients.length} recipient(s) · {readCount} read
      </div>
      <div className="message-list">
        {selectedThread.messages.map((item) => {
          const isOwn = item.senderUserId === currentUserId
          return (
            <article className={`message-bubble${isOwn ? ' message-bubble--own' : ''}${item.isDeleted ? ' message-bubble--deleted' : ''}`} key={item.id}>
              <div>
                <strong>{item.senderName || 'User'}</strong>
                <span>{formatDateTime(item.createdAt)}{item.editedAt ? ' · edited' : ''}</span>
              </div>
              <p>{item.messageText}</p>
              {isOwn && !item.isDeleted && (
                <div className="message-actions">
                  <button onClick={() => void onEditMessage(item.id, item.messageText)} type="button">Edit</button>
                  <button onClick={() => void onDeleteMessage(item.id)} type="button">Remove</button>
                </div>
              )}
            </article>
          )
        })}
      </div>
      {selectedThread.canReply && (
        <form className="reply-form" onSubmit={onReply}>
          <textarea value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Write a local reply" required rows={4} />
          <button className="primary-button" disabled={isSaving} type="submit">
            <Icon name="check" size={17} />
            Reply
          </button>
        </form>
      )}
    </section>
  )
}
