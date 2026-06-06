import { memo } from 'react'

const Card = memo(function Card({ className = '', title, subtitle, children, actions }) {
  return (
    <section className={`ui-card ${className}`.trim()}>
      {(title || subtitle || actions) && (
        <header className="ui-card__header">
          <div>
            {title ? <h3 className="ui-card__title">{title}</h3> : null}
            {subtitle ? <p className="ui-card__subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="ui-card__actions">{actions}</div> : null}
        </header>
      )}
      <div className="ui-card__body">{children}</div>
    </section>
  )
})

export default Card
