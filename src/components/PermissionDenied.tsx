import { Icon } from './Icon'

export function PermissionDenied() {
  return (
    <section className="permission-panel panel">
      <div className="permission-panel__icon">
        <Icon name="user" size={26} />
      </div>
      <h2>Access restricted</h2>
      <p>You do not have permission to access this module.</p>
    </section>
  )
}
