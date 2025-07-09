import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Path } from "../utils/enums";
import { ONLY_NUMBERS } from "../utils/regex";
import {
  ID_QUERY_PARAM,
  TIMETABLE_TITLE_PLACEHOLDER,
  TIMETABLE_DESCRIPTION_PLACEHOLDER,
  TITLE_ERROR_MESSAGE,
  GENERIC_ERROR,
  TITLE_PATH,
  DESCRIPTION_PATH,
} from "../utils/constants";

const Timetable = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [timetable, setTimetable] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState();
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const TIMETABLE_DESCRIPTION = "Timetable Description ";
  const DESIGNATION = "Designation";

  const cancelEditingDescription = () => {
    setDescription(timetable?.description);
    setIsEditingDescription(false);
    setDescriptionError("");
  };

  const updateDescription = async () => {
    setIsEditingDescription(false);
    setDescriptionError("");

    if (description === timetable?.description) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${
          Path.TIMETABLE
        }${DESCRIPTION_PATH}${ID_QUERY_PARAM}${timetable?.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ description }),
          credentials: "include",
        }
      );

      if (response.ok) {
        fetchTimetableData(timetable?.id);
      } else {
        setDescription(timetable?.description);
        setDescriptionError(GENERIC_ERROR);
      }
    } catch (error) {
      setDescription(timetable?.description);
      setDescriptionError(GENERIC_ERROR);
    }
  };

  const cancelEditingTitle = () => {
    setTitle(timetable?.title);
    setIsEditingTitle(false);
    setTitleError("");
  };

  const updateTitle = async () => {
    setIsEditingTitle(false);
    setTitleError("");

    if (!title) {
      setTitleError(TITLE_ERROR_MESSAGE);
      setTitle(timetable?.title);
      return;
    } else if (title === timetable?.title) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${
          Path.TIMETABLE
        }${TITLE_PATH}${ID_QUERY_PARAM}${timetable?.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title }),
          credentials: "include",
        }
      );

      if (response.ok) {
        fetchTimetableData(timetable?.id);
      } else {
        setTitle(timetable?.title);
        setTitleError(GENERIC_ERROR);
      }
    } catch (error) {
      setTitle(timetable?.title);
      setTitleError(GENERIC_ERROR);
    }
  };

  const fetchTimetableData = async (id) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${
          Path.TIMETABLE
        }${ID_QUERY_PARAM}${id}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTitle(data?.timetable?.title);
        setDescription(data?.timetable?.description);
        setTimetable(data?.timetable);
      } else {
        navigate(Path.EXPLORE);
      }
    } catch (error) {
      navigate(Path.EXPLORE);
    }
  };

  const renderIcons = (isEditing, setIsEditing, updateItem, cancelEditing) => {
    return (
      <>
        {isEditing ? (
          <>
            <span
              className="material-symbols-outlined timetable-edit-icon timetable-yes"
              onClick={updateItem}
            >
              check_circle
            </span>
            <span
              className="material-symbols-outlined timetable-edit-icon timetable-no"
              onClick={cancelEditing}
            >
              cancel
            </span>
          </>
        ) : (
          <span
            className="material-symbols-outlined timetable-edit-icon"
            onClick={() => setIsEditing(true)}
          >
            edit
          </span>
        )}
      </>
    );
  };

  useEffect(() => {
    const callFetchTimetableData = async (id) => {
      await fetchTimetableData(id);
    };

    const timetableId = searchParams.get("id");
    if (!ONLY_NUMBERS.test(timetableId)) navigate(Path.TIMETABLES);
    callFetchTimetableData(timetableId);
  }, []);

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

      <div className="text-input-container timetable-title">
        <div className="timetable-edit-container">
          <input
            type="text"
            className="text-input page-title timetable-title timetable-edit-disabled"
            placeholder={TIMETABLE_TITLE_PLACEHOLDER}
            value={title}
            maxLength={125}
            onChange={(event) => setTitle(event.target.value)}
            disabled={!isEditingTitle}
          />
          {renderIcons(
            isEditingTitle,
            setIsEditingTitle,
            updateTitle,
            cancelEditingTitle
          )}
        </div>
        <div className="create-email-section-spacing text-input-error dropdown-input-error timetable-input-error">
          {titleError}
        </div>
      </div>

      <label
        htmlFor="description"
        className="page-big-header timetable-description"
      >
        {TIMETABLE_DESCRIPTION}
        <span className="timetable-icon-container">
          {renderIcons(
            isEditingDescription,
            setIsEditingDescription,
            updateDescription,
            cancelEditingDescription
          )}
        </span>
      </label>
      <div className="text-input-container timetable-description">
        <textarea
          id="description"
          className="text-input create-email-body timetable-edit-disabled"
          placeholder={TIMETABLE_DESCRIPTION_PLACEHOLDER}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          disabled={!isEditingDescription}
        />
        <div className="create-email-section-spacing text-input-error dropdown-input-error">
          {descriptionError}
        </div>
      </div>

      <div htmlFor="designation" className="page-big-header timetable-description">
        {DESIGNATION}
      </div>
      <div className="text-input-container">
        {}
      </div>
    </div>
  );
};

export default Timetable;
