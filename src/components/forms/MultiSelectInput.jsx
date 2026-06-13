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

  const selectedLabels = useMemo(
    () =>
      options
        .filter((option) => values.includes(option.value))
        .map((option) => option.label),
    [options, values],
  )

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
    ? selectedLabels.length <= 2
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
