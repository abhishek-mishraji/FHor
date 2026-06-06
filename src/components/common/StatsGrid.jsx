import Card from '../ui/Card'

const StatsGrid = ({ items = [] }) => (
  <div className="stats-grid">
    {items.map((item) => (
      <Card key={item.label} className="stat-card">
        <p className="stat-card__label">{item.label}</p>
        <h3 className="stat-card__value">{item.value}</h3>
        {item.caption ? <p className="stat-card__caption">{item.caption}</p> : null}
      </Card>
    ))}
  </div>
)

export default StatsGrid
