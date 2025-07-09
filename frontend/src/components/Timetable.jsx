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
} from "../utils/constants";

const Timetable = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [timetable, setTimetable] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState();

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
          body: JSON.stringify({title}),
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
        setTimetable(data?.timetable);
      } else {
        navigate(Path.EXPLORE);
      }
    } catch (error) {
      navigate(Path.EXPLORE);
    }
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
          {isEditingTitle ? (
            <>
              <span
                className="material-symbols-outlined timetable-edit-icon timetable-yes"
                onClick={updateTitle}
              >
                check_circle
              </span>
              <span
                className="material-symbols-outlined timetable-edit-icon timetable-no"
                onClick={cancelEditingTitle}
              >
                cancel
              </span>
            </>
          ) : (
            <span
              className="material-symbols-outlined timetable-edit-icon"
              onClick={() => setIsEditingTitle(true)}
            >
              edit
            </span>
          )}
        </div>
        <div className="create-email-section-spacing text-input-error dropdown-input-error timetable-input-error">
          {titleError}
        </div>
      </div>
    </div>
  );
};

export default Timetable;
