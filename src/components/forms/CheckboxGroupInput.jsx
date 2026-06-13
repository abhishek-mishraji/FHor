const CheckboxGroupInput = ({
  label,
  name,
  values = [],
  onChange,
  options = [],
  error,
  hint,
  showBulkActions = true,
}) => {
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

  return (
    <div className="form-field checkbox-group">
      <div className="checkbox-group__header">
        <span className="form-field__label">{label}</span>
        {showBulkActions ? (
          <div className="checkbox-group__bulk">
            <button type="button" onClick={() => emitChange(options.map((option) => option.value))}>
              All
            </button>
            <button type="button" onClick={() => emitChange([])}>
              None
            </button>
          </div>
        ) : null}
      </div>
      <div className="checkbox-group__options">
        {options.map((option) => (
          <label
            key={option.value}
            className={`checkbox-pill ${
              values.includes(option.value) ? 'checkbox-pill--checked' : ''
            }`.trim()}
          >
            <input
              type="checkbox"
              checked={values.includes(option.value)}
              onChange={() => toggleValue(option.value)}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
      {hint ? <span className="checkbox-group__hint">{hint}</span> : null}
      {error ? <span className="form-field__error">{error}</span> : null}
    </div>
  )
}

export default CheckboxGroupInput
