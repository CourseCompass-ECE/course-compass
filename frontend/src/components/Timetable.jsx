import { useEffect, useRef, useState } from "react";
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
  DESIGNATIONS,
  SHOPPING_CART,
} from "../utils/constants";
import { fetchCoursesInCart } from "../utils/fetchShoppingCart";
import ExploreCourse from "./exploreCourseList/ExploreCourse";
import TimetableCourseSummary from "./timetableCourseSummary/TimetableCourseSummary";

const Timetable = () => {
  const navigate = useNavigate();
  const infoRef = useRef();
  const [searchParams, setSearchParams] = useSearchParams();
  const [timetable, setTimetable] = useState(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [titleError, setTitleError] = useState();
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [cartSearch, setCartSearch] = useState("");
  const [coursesInCart, setCoursesInCart] = useState([]);
  const [fetchCartCoursesError, setFetchCartCoursesError] = useState("");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [updateTimetableError, setUpdateTimetableError] = useState("");
  const refList = useRef([]);
  const terms = [
    {
      title: "3rd Year, Fall",
      courses: Array(5).fill(null),
    },
    { title: "3rd Year, Winter", courses: Array(5).fill(null) },
    { title: "4th Year, Fall", courses: Array(5).fill(null) },
    { title: "4th Year, Winter", courses: Array(5).fill(null) },
  ];

  const TIMETABLE = "Timetable";
  const TIMETABLE_DESCRIPTION = "Timetable Description ";
  const DESIGNATION = "Designation";
  const NO_DESIGNATION =
    "No designation is possible with the current timetable";
  const TIMETABLE_SELECTION_INFO =
    "Click on a course from your shopping cart or currently in your timetable, then click on any open tile to move it";
  const BUTTON_TEXT = "Generate Timetable";
  const CART_SEARCH_PLACEHOLDER = "Search by title or code";
  const FAVORITE_ICON = "star";
  const CART_ICON = "remove_shopping_cart";

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

  const updateTimetableCourses = async (courseId, termId, positionId) => {
    setUpdateTimetableError("");
    setSelectedCourse(null);

    try {
      const timetableCourseData = {
        courseId,
        term: termId,
        position: positionId,
        timetableId: timetable?.id
      };

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${Path.TIMETABLE}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(timetableCourseData),
          credentials: "include",
        }
      );

      if (response.ok) {
        fetchTimetableData(timetable?.id);
      } else {
        setUpdateTimetableError(GENERIC_ERROR);
      }
    } catch (error) {
      setUpdateTimetableError(GENERIC_ERROR);
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
    fetchCoursesInCart(setFetchCartCoursesError, setCoursesInCart);
  }, []);

  return (
    <div className="page-container">
      <button
        className="create-account-back-container create-email-back-container timetable-back"
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

      <h2
        htmlFor="designation"
        className="page-big-header timetable-description"
      >
        {DESIGNATION}
      </h2>
      <div className="text-input-container timetable-designation">
        {timetable?.designation
          ? DESIGNATIONS[timetable?.designation]
          : NO_DESIGNATION}
      </div>

      <div className="cart-timetable-courses-container">
        <div className="cart-container">
          <h2
            htmlFor="designation"
            className="page-big-header"
            style={{ textAlign: "center" }}
          >
            {SHOPPING_CART}
          </h2>

          <div className="text-input-container search-bar timetable-search">
            <span
              className="material-symbols-outlined"
              style={{ fontSize: "var(--subheader-size)" }}
            >
              search
            </span>
            <input
              type="text"
              className="text-input explore-filters-width explore-search-input"
              placeholder={CART_SEARCH_PLACEHOLDER}
              value={cartSearch}
              maxLength={40}
              onChange={(event) => setCartSearch(event.target.value)}
              style={{ backgroundColor: "transparent" }}
            />
          </div>

          <div className="cart-courses-container">
            {!fetchCartCoursesError ? (
              <>
                {coursesInCart
                  .filter(
                    (course) =>
                      !cartSearch.trim() ||
                      course.title
                        .toLowerCase()
                        .includes(cartSearch.trim().toLowerCase()) ||
                      course.code
                        .toLowerCase()
                        .includes(cartSearch.trim().toLowerCase())
                  )
                  .map((course, index) => (
                    <div
                      key={index}
                      onClick={(event) =>
                        event.target.innerText !== FAVORITE_ICON &&
                        event.target.innerText !== CART_ICON
                          ? setSelectedCourse(course.id)
                          : null
                      }
                      style={{ cursor: "pointer"}}
                    >
                      <ExploreCourse
                        index={index}
                        fetchAllCourseData={() =>
                          fetchCoursesInCart(
                            setFetchCartCoursesError,
                            setCoursesInCart
                          )
                        }
                        course={course}
                        courseOuterContainerRefList={refList}
                      />
                    </div>
                  ))}
              </>
            ) : (
              <h3 className="timetable-cart-error">{fetchCartCoursesError}</h3>
            )}
          </div>
        </div>

        <div className="timetable-courses-container">
          <h2
            htmlFor="designation"
            className="page-big-header timetable-courses-header"
          >
            {TIMETABLE}
            <span
              className="material-symbols-outlined info-hover"
              onMouseEnter={() => (infoRef.current.style.display = "block")}
              onMouseLeave={() => (infoRef.current.style.display = "none")}
            >
              info
            </span>
            <div className="info-hover-text timetable-info-text" ref={infoRef}>
              {TIMETABLE_SELECTION_INFO}
            </div>
            <div className="create-btn-height generate-timetable">
              <button
                className="create-btn generate-background"
                style={{ width: "250px" }}
              >
                <span className="material-symbols-outlined">wand_stars</span>
                {BUTTON_TEXT}
              </button>
            </div>
            <span className="timetable-change-error">{updateTimetableError}</span>
          </h2>

          {terms.map((term, termId) => (
            <section key={termId} className="term-container">
              <h3 className="term-title">{term.title}</h3>
              <div className="timetable-course-container">
                {term.courses.map((course, positionId) =>
                  course ? (
                    <TimetableCourseSummary
                      key={positionId}
                      title={course.title}
                      code={course.code}
                      courseId={course.id}
                      setSelectedCourse={setSelectedCourse}
                    />
                  ) : (
                    <article
                      key={positionId}
                      className="course-placeholder"
                      style={!selectedCourse ? {cursor: "not-allowed"} : {}}
                      onClick={() => selectedCourse ? updateTimetableCourses(selectedCourse, termId + 1, positionId + 1) : null}
                    ></article>
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Timetable;
