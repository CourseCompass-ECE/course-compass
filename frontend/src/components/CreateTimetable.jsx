import { useNavigate } from "react-router-dom";
import { Path } from "../utils/enums";
import { useState } from "react";

const CreateTimetable = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const TITLE = "Create Timetable";
  const TIMETABLE_TITLE = "Timetable Title";
  const TIMETABLE_TITLE_PLACEHOLDER = "Enter timetable title";
  const TITLE_ERROR_MESSAGE = "Please provide a title";

  const createTimetable = async (event) => {
    event.preventDefault();
  };

  return (
    <div className="page-container">
      <button
        className="create-account-back-container create-email-back-container"
        onClick={() => navigate(Path.TIMETABLES)}
      >
        <span className="material-symbols-outlined create-account-back-icon">
          west
        </span>
      </button>

      <h1 className="page-title" style={{marginBottom: "30px"}}>{TITLE}</h1>
      <form
        className="create-email-form"
        onSubmit={(event) => createTimetable(event)}
      >
        <label htmlFor="title" className="page-big-header">
          {TIMETABLE_TITLE}
        </label>
        <div className="text-input-container">
          <input
            id="title"
            type="text"
            className="text-input"
            placeholder={TIMETABLE_TITLE_PLACEHOLDER}
            value={title}
            maxLength={125}
            onChange={(event) => setTitle(event.target.value)}
          />
          <div className="create-email-section-spacing text-input-error dropdown-input-error">
            {titleError}
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateTimetable;
