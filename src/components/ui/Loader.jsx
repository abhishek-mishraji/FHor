const Loader = ({ label = 'Loading...' }) => (
  <div className="ui-loader" role="status" aria-live="polite">
    <span className="ui-loader__spinner" />
    <span>{label}</span>
  </div>
)

export default Loader
