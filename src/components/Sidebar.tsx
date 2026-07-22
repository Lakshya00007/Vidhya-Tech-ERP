import { useMemo, useState } from 'react'
import { translateText } from '../lib/i18n'
import {
  canSeeNavigationEntry,
  erpNavigation,
  type ErpMenuGroup,
  type ErpMenuItem,
  type NavigationTarget,
} from '../lib/navigation'
import type {
  LicenseStatus,
  ModulePlaceholderInfo,
  PreferenceLanguage,
  PermissionRole,
} from '../types'
import { Icon } from './Icon'

interface SidebarProps {
  activeNavigationId: string
  licenseStatus: LicenseStatus
  onLogout: () => void
  onNavigate: (target: NavigationTarget, navigationId: string) => void
  onPlaceholder: (info: ModulePlaceholderInfo) => void
  language: PreferenceLanguage
  role: PermissionRole
}

interface VisibleGroup extends ErpMenuGroup {
  items?: ErpMenuItem[]
}

const matches = (value: string, query: string) =>
  value.toLocaleLowerCase().includes(query)

const getPlaceholderStatus = (item: ErpMenuItem) =>
  item.availability ?? 'missing'

export function Sidebar({
  activeNavigationId,
  licenseStatus: _licenseStatus,
  language,
  onLogout,
  onNavigate,
  onPlaceholder,
  role,
}: SidebarProps) {
  void _licenseStatus
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(['general-settings']),
  )

  const roleNavigation = useMemo(
    () =>
      erpNavigation
        .filter((group) => canSeeNavigationEntry(role, group.roles))
        .map((group) => ({
          ...group,
          items: group.items?.filter((item) =>
            canSeeNavigationEntry(role, item.roles),
          ),
        }))
        .filter((group) => group.target || (group.items?.length ?? 0) > 0),
    [role],
  )

  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visibleNavigation = useMemo<VisibleGroup[]>(() => {
    if (!normalizedQuery) return roleNavigation
    return roleNavigation
      .map((group) => {
        if (
          matches(group.label, normalizedQuery) ||
          matches(translateText(group.label, language), normalizedQuery)
        ) {
          return group
        }
        const items = group.items?.filter((item) =>
          matches(item.label, normalizedQuery) ||
          matches(translateText(item.label, language), normalizedQuery),
        )
        return { ...group, items }
      })
      .filter((group) => group.target
        ? matches(group.label, normalizedQuery) ||
          matches(translateText(group.label, language), normalizedQuery)
        : (group.items?.length ?? 0) > 0)
  }, [language, normalizedQuery, roleNavigation])

  const toggleGroup = (id: string) => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const openItem = (group: ErpMenuGroup, item: ErpMenuItem) => {
    if (item.id === 'logout') {
      onLogout()
      return
    }

    if (item.target) {
      onNavigate(item.target, item.id)
      return
    }

    onPlaceholder({
      description: item.description,
      id: item.id,
      module: group.label,
      status: getPlaceholderStatus(item),
      title: item.label,
    })
  }

  return (
    <>
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">
            <Icon name="school" size={24} />
          </div>
          <div>
            <strong>Vidhya</strong>
            <span>School ERP</span>
          </div>
        </div>

        <div className="sidebar-search">
          <Icon name="search" size={15} />
          <input
            aria-label="Search ERP menu"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={translateText('Search menu...', language)}
            type="search"
            value={query}
          />
          {query && (
            <button
              aria-label="Clear menu search"
              onClick={() => setQuery('')}
              type="button"
            >
              <Icon name="close" size={13} />
            </button>
          )}
        </div>

        <nav className="sidebar-nav" aria-label="ERP modules">
          <span className="nav-label">
            {translateText(
              normalizedQuery ? 'Search results' : 'ERP Modules',
              language,
            )}
          </span>

          {visibleNavigation.map((group) => {
            if (group.target) {
              return (
                <button
                  className={`nav-item${
                    activeNavigationId === group.id ? ' nav-item--active' : ''
                  }`}
                  key={group.id}
                  onClick={() => onNavigate(group.target!, group.id)}
                  type="button"
                >
                  <Icon name={group.icon} size={18} />
                  <span>{translateText(group.label, language)}</span>
                </button>
              )
            }

            const isGroupActive = group.items?.some(
              (item) => item.id === activeNavigationId,
            )
            const isExpanded =
              Boolean(normalizedQuery) || expanded.has(group.id)

            return (
              <div
                className={`nav-group${isGroupActive ? ' nav-group--active' : ''}`}
                key={group.id}
              >
                <button
                  aria-expanded={isExpanded}
                  className="nav-group-button"
                  onClick={() => toggleGroup(group.id)}
                  type="button"
                >
                  <Icon name={group.icon} size={18} />
                  <span>{translateText(group.label, language)}</span>
                  <Icon
                    className="nav-group-button__toggle"
                    name={isExpanded ? 'minus' : 'plus'}
                    size={14}
                  />
                </button>

                {isExpanded && (
                  <div className="nav-submenu">
                    {group.items?.map((item) => {
                      const isPlaceholder = !item.target && item.id !== 'logout'
                      const status = getPlaceholderStatus(item)
                      return (
                        <button
                          className={`nav-subitem${
                            activeNavigationId === item.id
                              ? ' nav-subitem--active'
                              : ''
                          }`}
                          key={item.id}
                          onClick={() => openItem(group, item)}
                          type="button"
                        >
                          <span className="nav-subitem__bullet" />
                          <span className="nav-subitem__label">
                            {translateText(item.label, language)}
                          </span>
                          {isPlaceholder && (
                            <span
                              className={`nav-status-badge nav-status-badge--${status}`}
                            >
                              {status === 'online'
                                ? 'Online'
                                : 'Not implemented'}
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {visibleNavigation.length === 0 && (
            <div className="sidebar-empty">
              No menu items match “{query.trim()}”.
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="local-indicator">
            <span className="local-indicator__dot" />
            <div>
              <strong>Local system</strong>
              <span>Data stays on this device</span>
            </div>
          </div>
          <p>Local desktop ERP system</p>
        </div>
      </aside>
    </>
  )
}
