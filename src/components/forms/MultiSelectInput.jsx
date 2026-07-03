import { useEffect, useMemo, useRef, useState } from 'react'

const MultiSelectInput = ({
  label,
  name,
  values = [],
  onChange,
  options = [],
  error,
  placeholder = 'Select options',
  searchable = true,
  // Optional, opt-in only — existing callers are unaffected unless they pass these.
  unitLabel,     // e.g. "Month" → summary reads "3 Months selected" instead of "3 selected"
  showChips = false, // renders selected options as removable chips below the trigger
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
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

  const filteredOptions = useMemo(() => {
    if (!searchTerm) {
      return options
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [options, searchTerm])

  const selectedOptions = useMemo(
    () => options.filter((option) => values.includes(option.value)),
    [options, values],
  )
  const selectedLabels = useMemo(() => selectedOptions.map((option) => option.label), [selectedOptions])

  const emitChange = (nextValues) => {
    onChange({ target: { name, value: nextValues } })
  }

  const toggleValue = (value) => {
    emitChange(
      values.includes(value)
        ? values.filter((currentValue) => currentValue !== value)
        : [...values, value],
    )
  }

  const summary = selectedLabels.length
    ? unitLabel
      ? `${selectedLabels.length} ${unitLabel}${selectedLabels.length === 1 ? '' : 's'} selected`
      : selectedLabels.length <= 2
        ? selectedLabels.join(', ')
        : `${selectedLabels.length} selected`
    : placeholder

  return (
    <div className="form-field multi-select" ref={containerRef}>
      <span className="form-field__label">{label}</span>
      <button
        type="button"
        className={`form-field__control multi-select__trigger ${
          error ? 'form-field__control--error' : ''
        }`.trim()}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span className={selectedLabels.length ? '' : 'multi-select__placeholder'}>{summary}</span>
        <span className="multi-select__chevron" aria-hidden="true">
          {isOpen ? '▴' : '▾'}
        </span>
      </button>

      {showChips && selectedOptions.length > 0 ? (
        <div className="multi-select__chips">
          {selectedOptions.map((option) => (
            <span key={option.value} className="multi-select__chip">
              <span className="multi-select__chip-label">{option.label}</span>
              <button
                type="button"
                className="multi-select__chip-remove"
                onClick={() => toggleValue(option.value)}
                aria-label={`Remove ${option.label}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {isOpen ? (
        <div className="multi-select__panel" role="listbox" aria-multiselectable="true">
          {searchable ? (
            <input
              className="multi-select__search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search..."
              autoFocus
            />
          ) : null}

          <div className="multi-select__bulk-actions">
            <button type="button" onClick={() => emitChange(options.map((option) => option.value))}>
              Select All
            </button>
            <button type="button" onClick={() => emitChange([])}>
              Clear All
            </button>
          </div>

          <div className="multi-select__options">
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <label key={option.value} className="multi-select__option">
                  <input
                    type="checkbox"
                    checked={values.includes(option.value)}
                    onChange={() => toggleValue(option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))
            ) : (
              <p className="multi-select__empty">No matches found</p>
            )}
          </div>
        </div>
      ) : null}

      {error ? <span className="form-field__error">{error}</span> : null}
    </div>
  )
}

export default MultiSelectInput
