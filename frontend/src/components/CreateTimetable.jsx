import { useNavigate } from "react-router-dom";
import { Path } from "../utils/enums";
import { useRef, useState } from "react";
import {
  YES,
  NO,
  GENERIC_ERROR,
  ID_QUERY_PARAM,
  TIMETABLE_TITLE_PLACEHOLDER,
  TIMETABLE_DESCRIPTION_PLACEHOLDER,
  TITLE_ERROR_MESSAGE,
  ECE_AREAS,
  AMOUNT_OF_DEPTH_AREAS,
  AMOUNT_OF_KERNEL_AREAS,
  DEPTH_TEXT,
  KERNEL_TEXT,
} from "../utils/constants";
import RenderDropdownMenu from "../utils/renderDropdown";

const CreateTimetable = () => {
  const navigate = useNavigate();
  const infoRef = useRef();
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState("");
  const [description, setDescription] = useState("");
  const [isRecommendationWanted, setIsRecommendationWanted] = useState(true);
  const [kernelAreas, setKernelAreas] = useState([]);
  const [kernelError, setKernelError] = useState("");
  const [depthAreas, setDepthAreas] = useState([]);
  const [depthError, setDepthError] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const TITLE = "Create Timetable";
  const TIMETABLE_TITLE = "Timetable Title";
  const TIMETABLE_DESCRIPTION = "Timetable Description (optional)";
  const RECOMMENDATIONS_DESCRIPTION = "Receive Timetable Recommendation?";
  const RECOMMENDATIONS_INFO_TEXT =
    "After creating your timetable, if possible, an arrangement of courses from your shopping cart will be recommended to form a conflict free timetable";
  const CREATE_TIMETABLE = "Create Timetable";
  const KERNEL_ERROR = "Please select 4 kernel areas";
  const DEPTH_ERROR = "Please select 2 depth areas";
  const KERNEL_TITLE = "Choose 4 Kernel Areas";
  const DEPTH_TITLE = "Choose 2 Depth Areas";
  const GENERATE_TIMETABLE_PARAM = "&generateTimetable=";

  const handleRemoveKernel = (eceAreaKey) => {
    setKernelAreas(kernelAreas.filter((area) => area !== eceAreaKey));
  };

  const handleRemoveDepth = (eceAreaKey) => {
    setDepthAreas(depthAreas.filter((area) => area !== eceAreaKey));
  };

  const createTimetable = async (event) => {
    event.preventDefault();
    setTitleError("");
    setSubmissionError("");
    setKernelError("");
    setDepthError("");

    let newDepthAreas = depthAreas.filter((area) => kernelAreas.includes(area));

    if (!title) {
      setTitleError(TITLE_ERROR_MESSAGE);
      return;
    } else if (kernelAreas.length !== AMOUNT_OF_KERNEL_AREAS) {
      setKernelError(KERNEL_ERROR);
      return;
    } else if (newDepthAreas.length !== AMOUNT_OF_DEPTH_AREAS) {
      setDepthError(DEPTH_ERROR);
      return;
    }

    try {
      const timetableData = {
        title,
        description,
        isRecommendationWanted,
        kernel: kernelAreas,
        depth: newDepthAreas,
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
        navigate(
          `${Path.TIMETABLE}${ID_QUERY_PARAM}${
            data?.id
          }${GENERATE_TIMETABLE_PARAM}${isRecommendationWanted ? 1 : 0}`
        );
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

        <h2 className="page-big-header">{KERNEL_TITLE}</h2>
        <RenderDropdownMenu
          setItems={setKernelAreas}
          currentItems={kernelAreas}
          placeholderText={KERNEL_TEXT}
          menuItems={ECE_AREAS}
          removeItem={handleRemoveKernel}
          errorMessage={kernelError}
        />

        <h2 className="page-big-header">{DEPTH_TITLE}</h2>
        <RenderDropdownMenu
          setItems={setDepthAreas}
          currentItems={depthAreas.filter((area) => kernelAreas.includes(area))}
          placeholderText={DEPTH_TEXT}
          menuItems={Object.fromEntries(
            Object.entries(ECE_AREAS).filter(([area]) =>
              kernelAreas.includes(area)
            )
          )}
          removeItem={handleRemoveDepth}
          errorMessage={depthError}
        />

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
