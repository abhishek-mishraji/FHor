const TextInput = ({
  label,
  name,
  value,
  onChange,
  error,
  type = 'text',
  placeholder,
  ...props
}) => (
  <label className="form-field">
    <span className="form-field__label">{label}</span>
    <input
      className={`form-field__control ${error ? 'form-field__control--error' : ''}`}
      name={name}
      value={value}
      onChange={onChange}
      type={type}
      placeholder={placeholder}
      {...props}
    />
    {error ? <span className="form-field__error">{error}</span> : null}
  </label>
)

export default TextInput
