const TextAreaInput = ({ label, name, value, onChange, error, rows = 4, ...props }) => (
  <label className="form-field">
    <span className="form-field__label">{label}</span>
    <textarea
      className={`form-field__control ${error ? 'form-field__control--error' : ''}`}
      name={name}
      value={value}
      onChange={onChange}
      rows={rows}
      {...props}
    />
    {error ? <span className="form-field__error">{error}</span> : null}
  </label>
)

export default TextAreaInput
