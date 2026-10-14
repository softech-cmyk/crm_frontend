import "./Placeholder.css";

function Placeholder({ title }) {
  return (
    <div className="placeholder-page">
      <h1 className="placeholder-title">{title}</h1>
      <p className="placeholder-text">This section is coming soon.</p>
    </div>
  );
}

export default Placeholder;
