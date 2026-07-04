import { memo, useEffect, useRef, useState } from 'react'
import Button from '../../../components/ui/Button'

const DELTA_TOGGLES = [
  { key: 'showPrevious', label: 'Previous' },
  { key: 'showDifference', label: 'Difference' },
  { key: 'showPct', label: '% Difference' },
]

// Popover controlling which columns the comparison table renders: one
// checkbox per selected metric plus the Previous / Difference / % toggles.
const ColumnSelector = memo(function ColumnSelector({
  columnPrefs,
  onChange,
  metricOptions = [],
  showMetricSection = true,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)

    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  // null means "all selected metrics visible"
  const visibleMetrics = columnPrefs.visibleMetrics ?? metricOptions.map((option) => option.value)

  const toggleMetric = (metricKey) => {
    const nextVisible = visibleMetrics.includes(metricKey)
      ? visibleMetrics.filter((key) => key !== metricKey)
      : [...visibleMetrics, metricKey]

    onChange({ ...columnPrefs, visibleMetrics: nextVisible })
  }

  const toggleFlag = (flag) => {
    onChange({ ...columnPrefs, [flag]: !columnPrefs[flag] })
  }

  return (
    <div className="column-selector" ref={containerRef}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        Columns
      </Button>

      {isOpen ? (
        <div className="column-selector__panel">
          {showMetricSection && metricOptions.length > 1 ? (
            <div className="column-selector__section">
              <p className="column-selector__section-title">Metrics</p>
              {metricOptions.map((option) => (
                <label key={option.value} className="column-selector__option">
                  <input
                    type="checkbox"
                    checked={visibleMetrics.includes(option.value)}
                    onChange={() => toggleMetric(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          ) : null}

          <div className="column-selector__section">
            <p className="column-selector__section-title">Comparison columns</p>
            {DELTA_TOGGLES.map((toggle) => (
              <label key={toggle.key} className="column-selector__option">
                <input
                  type="checkbox"
                  checked={Boolean(columnPrefs[toggle.key])}
                  onChange={() => toggleFlag(toggle.key)}
                />
                <span>{toggle.label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
})

export default ColumnSelector
