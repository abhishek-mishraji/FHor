import Button from './Button'

const EmptyState = ({ title, description, actionLabel, onAction }) => (
  <div className="ui-empty-state">
    <p className="ui-empty-state__eyebrow">Nothing here yet</p>
    <h3>{title}</h3>
    <p>{description}</p>
    {actionLabel ? (
      <Button type="button" variant="secondary" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
)

export default EmptyState
