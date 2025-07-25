const ParsingLoader = (props) => {
  return (
    <div
      className="error-modal-container"
      style={{ display: props.isLoading ? "flex" : "none" }}
    >
      <div className="loader timetable-loader"></div>
      <span className="loading-text">{props.loadingText}</span>
    </div>
  );
};

export default ParsingLoader;
