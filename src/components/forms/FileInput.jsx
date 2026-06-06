const FileInput = ({ label, name, onChange, error, accept }) => (
  <label className="form-field">
    <span className="form-field__label">{label}</span>
    <input
      className={`form-field__control ${error ? 'form-field__control--error' : ''}`}
      name={name}
      type="file"
      onChange={onChange}
      accept={accept}
    />
    {error ? <span className="form-field__error">{error}</span> : null}
  </label>
)

export default FileInput
