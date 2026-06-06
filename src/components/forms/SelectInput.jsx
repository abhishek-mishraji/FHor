const SelectInput = ({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  placeholder = 'Select an option',
  ...props
}) => (
  <label className="form-field">
    <span className="form-field__label">{label}</span>
    <select
      className={`form-field__control ${error ? 'form-field__control--error' : ''}`}
      name={name}
      value={value}
      onChange={onChange}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    {error ? <span className="form-field__error">{error}</span> : null}
  </label>
)

export default SelectInput
