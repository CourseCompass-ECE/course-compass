import { useNavigate } from "react-router-dom";
import { Path } from "../utils/enums";
import { useRef, useState } from "react";
import { YES, NO, GENERIC_ERROR, ID_QUERY_PARAM } from "../utils/constants";

const CreateTimetable = () => {
  const navigate = useNavigate();
  const infoRef = useRef();
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [description, setDescription] = useState("");
  const [isRecommendationWanted, setIsRecommendationWanted] = useState(true);
  const [submissionError, setSubmissionError] = useState("");
  const TITLE = "Create Timetable";
  const TIMETABLE_TITLE = "Timetable Title";
  const TIMETABLE_TITLE_PLACEHOLDER = "Enter timetable title";
  const TITLE_ERROR_MESSAGE = "Please provide a title";
  const TIMETABLE_DESCRIPTION = "Timetable Description (optional)";
  const TIMETABLE_DESCRIPTION_PLACEHOLDER = "Enter timetable description";
  const RECOMMENDATIONS_DESCRIPTION = "Receive Timetable Recommendation?";
  const RECOMMENDATIONS_INFO_TEXT =
    "After creating your timetable, if possible, an arrangement of courses from your shopping cart will be recommended to form a conflict free timetable";
  const CREATE_TIMETABLE = "Create Timetable";

  const createTimetable = async (event) => {
    event.preventDefault();
    setTitleError("");
    setSubmissionError("");

    if (!title) {
      setTitleError(TITLE_ERROR_MESSAGE);
      return;
    }

    try {
      const timetableData = {
        title,
        description,
        isRecommendationWanted,
      };

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${Path.CREATE_TIMETABLE}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(timetableData),
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        navigate(`${Path.TIMETABLE}${ID_QUERY_PARAM}${data?.id}`);
      } else {
        setSubmissionError(GENERIC_ERROR);
      }
    } catch (error) {
      setSubmissionError(GENERIC_ERROR);
    }
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

      <h1 className="page-title" style={{ marginBottom: "30px" }}>
        {TITLE}
      </h1>
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

        <label htmlFor="description" className="page-big-header">
          {TIMETABLE_DESCRIPTION}
        </label>
        <div className="text-input-container">
          <textarea
            id="description"
            className="text-input create-email-body"
            placeholder={TIMETABLE_DESCRIPTION_PLACEHOLDER}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>

        <label
          htmlFor="description"
          className="page-big-header timetable-recommendation-header"
        >
          {RECOMMENDATIONS_DESCRIPTION}
          <span
            className="material-symbols-outlined info-hover"
            onMouseEnter={() => (infoRef.current.style.display = "block")}
            onMouseLeave={() => (infoRef.current.style.display = "none")}
          >
            info
          </span>
          <div className="info-hover-text" ref={infoRef}>
            {RECOMMENDATIONS_INFO_TEXT}
          </div>
        </label>
        <div className="create-timetable-btn-container">
          <button
            type="button"
            onClick={() => setIsRecommendationWanted(true)}
            className={`form-btn email-list-btn create-timetable-btn ${
              isRecommendationWanted ? "email-list-btn-selected" : ""
            }`}
          >
            {YES}
          </button>
          <button
            type="button"
            onClick={() => setIsRecommendationWanted(false)}
            className={`form-btn email-list-btn create-timetable-btn ${
              !isRecommendationWanted ? "email-list-btn-selected" : ""
            }`}
          >
            {NO}
          </button>
        </div>

        <div className="text-input-container create-email-btn">
          <button type="submit" className="form-btn">
            {CREATE_TIMETABLE}
          </button>
          <span className="create-email-submission-error">
            {submissionError}
          </span>
        </div>
      </form>
    </div>
  );
};

export default CreateTimetable;
