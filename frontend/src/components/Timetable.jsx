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
  AMOUNT_OF_KERNEL_AREAS,
  ECE_AREAS,
  COMPUTER,
  ELECTRICAL,
  DESIGNATION_PATH,
  initialErrors,
  CONFLICT_STATUS_PATH,
  GENERATE_PATH,
  SELECT_PATH,
} from "../utils/constants";
import { fetchCoursesInCart } from "../utils/fetchShoppingCart";
import ExploreCourse from "./exploreCourseList/ExploreCourse";
import TimetableCourseSummary from "./timetableCourseSummary/TimetableCourseSummary";
import { areRequirementsMet } from "../utils/requirementsCheck";
import { updateCoursesInCart } from "../utils/updateCourses";

const Timetable = () => {
  const initialTerms = [
    {
      title: "3rd Year, Fall",
      courses: Array(5).fill(null),
    },
    { title: "3rd Year, Winter", courses: Array(5).fill(null) },
    { title: "4th Year, Fall", courses: Array(5).fill(null) },
    { title: "4th Year, Winter", courses: Array(5).fill(null) },
  ];

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
  const [generateTimetableError, setGenerateTimetableError] = useState("");
  const [isTimetableGenerating, setIsTimetableGenerating] = useState(false);
  const [generatedTimetables, setGeneratedTimetables] = useState(null);
  const [currentTimetableOption, setCurrentTimetableOption] = useState(null);
  const [originalTerms, setOriginalTerms] = useState(null);
  const [selectTimetableError, setSelectTimetableError] = useState("");
  const [isRequirementsMenuOpen, setIsRequirementsMenuOpen] = useState(false);
  const [terms, setTerms] = useState(initialTerms);
  const [errors, setErrors] = useState(initialErrors);
  const [kernelCourses, setKernelCourses] = useState([]);
  const [depthCourses, setDepthCourses] = useState([]);
  const [isECE472Met, setIsECE472Met] = useState(false);
  const [isOtherCoursesMet, setIsOtherCoursesMet] = useState(false);
  const [otherCoursesAmount, setOtherCoursesAmount] = useState(0);
  const [designation, setDesignation] = useState(null);
  const refList = useRef([]);

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
  const REQUIREMENTS = "Degree & Course Requirements";
  const KERNEL = "Kernel Courses: ";
  const DEPTH = "Depth Courses: ";
  const ECE472 = "ECE472H: Engineering Economic Analysis & Entrepreneurship";
  const OTHER_COURSES = "11 Other Courses: ";
  const NO_COURSE = "No course added yet";
  const NO_ERRORS = "Great job - no errors found!";
  const TIMETABLE_ERROR_TITLE = "Unable to Generate Timetable";
  const REQUIREMENTS_CONTAINER_NEW_BOTTOM = "7vh";
  const OPTION = "Option: ";
  const TIMETABLE_SCORE_OUTLINE_ALT =
    "Gold leaf circular outline to encase timetable score";
  const TIMETABLE_SCORE_OUTLINE = [
    "/goldOutline.png",
    "/silverOutline.png",
    "/bronzeOutline.png",
  ];

  const filteredCoursesInCart = coursesInCart.filter(
    (course) =>
      !cartSearch.trim() ||
      course.title.toLowerCase().includes(cartSearch.trim().toLowerCase()) ||
      course.code.toLowerCase().includes(cartSearch.trim().toLowerCase())
  );

  const updateDesignation = async (newDesignation) => {
    if (
      newDesignation !== null &&
      newDesignation !== ELECTRICAL &&
      newDesignation !== COMPUTER
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${
          Path.TIMETABLE
        }${DESIGNATION_PATH}${ID_QUERY_PARAM}${timetable?.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newDesignation }),
          credentials: "include",
        }
      );

      if (response.ok) {
        fetchTimetableData(timetable?.id);
      } else {
        setDesignation(timetable?.designation);
        setUpdateTimetableError(GENERIC_ERROR);
      }
    } catch (error) {
      setDesignation(timetable?.designation);
      setUpdateTimetableError(GENERIC_ERROR);
    }
  };

  const toggleConflictStatus = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${
          Path.TIMETABLE
        }${CONFLICT_STATUS_PATH}${ID_QUERY_PARAM}${timetable?.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ newStatus: !timetable?.isConflictFree }),
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
        timetableId: timetable?.id,
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

  const deleteTimetableCourse = async (courseId) => {
    setUpdateTimetableError("");

    try {
      const timetableCourseData = {
        courseId,
        timetableId: timetable?.id,
      };

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${Path.TIMETABLE}`,
        {
          method: "DELETE",
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
        setDesignation(data?.timetable?.designation);
        setTimetable(data?.timetable);
        organizeCourses(data?.timetable?.courses);
        areRequirementsMet(
          data?.timetable,
          setKernelCourses,
          setDepthCourses,
          setIsECE472Met,
          setIsOtherCoursesMet,
          setOtherCoursesAmount,
          initialErrors,
          setErrors,
          setDesignation
        );
        return data?.timetable?.id;
      } else {
        navigate(Path.TIMETABLES);
      }
    } catch (error) {
      navigate(Path.TIMETABLES);
    }
  };

  const organizeCourses = (courses) => {
    let newTerms = initialTerms;
    courses.forEach((courseObject) => {
      newTerms[courseObject.term - 1].courses[courseObject.position - 1] =
        courseObject.course;
    });
    setTerms(newTerms);
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

  const renderMetRequirementIcons = (isRequirementMet) => {
    return (
      <span
        className="material-symbols-outlined"
        style={{
          color: isRequirementMet ? "var(--correct-green)" : "var(--error-red)",
        }}
      >
        {isRequirementMet ? "check_circle" : "cancel"}
      </span>
    );
  };

  const generateTimetable = async (timetableId) => {
    try {
      setIsTimetableGenerating(true);
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${
          Path.TIMETABLE
        }${GENERATE_PATH}${ID_QUERY_PARAM}${timetableId}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      setIsTimetableGenerating(false);

      if (response.ok) {
        const data = await response.json();
        setGeneratedTimetables(data?.timetableOptions);
        if (!data?.timetableOptions) fetchTimetableData(timetableId);
      } else {
        const error = await response.json();
        setGenerateTimetableError(
          error?.message ? error.message : GENERIC_ERROR
        );
      }
    } catch (error) {
      setIsTimetableGenerating(false);
      setGenerateTimetableError(error?.message ? error.message : GENERIC_ERROR);
    }
  };

  const enableTimetableSelection = () => {
    setOriginalTerms(terms);
    organizeCourses(generatedTimetables[0].courses);
    setCurrentTimetableOption(1);
  };

  const updateTimetableOption = (change) => {
    const newTimetableOption = currentTimetableOption + change;
    if (
      newTimetableOption > 0 &&
      newTimetableOption <= generatedTimetables.length
    ) {
      setSelectTimetableError("");
      setCurrentTimetableOption(newTimetableOption);
      organizeCourses(generatedTimetables[newTimetableOption - 1].courses);
    }
  };

  const exitTimetableOptions = () => {
    setOriginalTerms(null);
    setGeneratedTimetables(null);
    setCurrentTimetableOption(null);
  };

  const selectTimetableOption = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${
          Path.TIMETABLE
        }${SELECT_PATH}${ID_QUERY_PARAM}${timetable.id}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courses: generatedTimetables[currentTimetableOption - 1].courses,
          }),
        }
      );

      if (response.ok) {
        exitTimetableOptions();
        fetchTimetableData(timetable.id);
      } else {
        setSelectTimetableError(GENERIC_ERROR);
      }
    } catch (error) {
      setSelectTimetableError(GENERIC_ERROR);
    }
  };

  useEffect(() => {
    const callFetchTimetableData = async (
      id,
      doesUserWantTimetableGenerated
    ) => {
      let timetableId = await fetchTimetableData(id);
      await fetchCoursesInCart(setFetchCartCoursesError, setCoursesInCart);
      if (doesUserWantTimetableGenerated == true && timetableId) {
        await generateTimetable(timetableId);
      }
    };

    const timetableId = searchParams.get("id");
    const doesUserWantTimetableGenerated =
      searchParams.get("generateTimetable");
    if (!ONLY_NUMBERS.test(timetableId)) navigate(Path.TIMETABLES);
    else callFetchTimetableData(timetableId, doesUserWantTimetableGenerated);
  }, []);

  useEffect(() => {
    if (timetable && designation !== timetable?.designation) {
      updateDesignation(designation);
    }
  }, [designation]);

  useEffect(() => {
    if (originalTerms) return;
    if (
      timetable &&
      errors.some((errorObject) => errorObject.errors.length > 0) ===
        timetable?.isConflictFree
    ) {
      toggleConflictStatus();
    }
  }, errors);

  useEffect(() => {
    if (generatedTimetables) enableTimetableSelection();
  }, [generatedTimetables]);

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
                {filteredCoursesInCart.map((course, index) => (
                  <div
                    key={index}
                    onClick={(event) =>
                      event.target.innerText !== FAVORITE_ICON &&
                      event.target.innerText !== CART_ICON &&
                      !originalTerms
                        ? setSelectedCourse(course.id)
                        : null
                    }
                    style={{
                      cursor: originalTerms ? "not-allowed" : "pointer",
                    }}
                  >
                    <ExploreCourse
                      index={index}
                      setCourseData={(updatedCourse) =>
                        updateCoursesInCart(
                          updatedCourse,
                          setCoursesInCart,
                          coursesInCart
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
            <div
              className="timetable-options-container"
              style={{ display: originalTerms ? "block" : "none" }}
            >
              <span
                className="material-symbols-outlined timetable-selection-arrow"
                onClick={() => updateTimetableOption(-1)}
              >
                arrow_left
              </span>
              {`${OPTION}${currentTimetableOption} of ${generatedTimetables?.length}`}
              <img
                className="timetable-score-outline"
                alt={TIMETABLE_SCORE_OUTLINE_ALT}
                src={
                  TIMETABLE_SCORE_OUTLINE[
                    currentTimetableOption ? currentTimetableOption - 1 : 0
                  ]
                }
              />
              <span className="timetable-option-score">
                {currentTimetableOption
                  ? generatedTimetables[currentTimetableOption - 1]?.score
                  : ""}
                %
              </span>
              <span
                className="material-symbols-outlined timetable-selection-arrow timetable-selection-right-arrow"
                onClick={() => updateTimetableOption(1)}
              >
                arrow_right
              </span>
              <div className="timetable-options-select-container">
                <span
                  className="material-symbols-outlined timetable-edit-icon timetable-yes"
                  onClick={selectTimetableOption}
                >
                  check_circle
                </span>
                <span
                  className="material-symbols-outlined timetable-edit-icon timetable-no"
                  onClick={() => {
                    setTerms(originalTerms);
                    exitTimetableOptions();
                  }}
                >
                  cancel
                </span>
              </div>
              <div>
                <span className="text-input-error timetable-select-error">
                  {selectTimetableError}
                </span>
              </div>
            </div>

            {TIMETABLE}
            <span
              className="material-symbols-outlined info-hover timetable-info-icon"
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
                className="create-btn generate-background generate-timetable"
                onClick={() =>
                  originalTerms ? null : generateTimetable(timetable?.id)
                }
                style={originalTerms ? { cursor: "not-allowed" } : {}}
              >
                <span className="material-symbols-outlined">wand_stars</span>
                {BUTTON_TEXT}
              </button>
            </div>
            <span className="timetable-change-error">
              {updateTimetableError}
            </span>
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
                      deleteTimetableCourse={() =>
                        deleteTimetableCourse(course.id)
                      }
                      isTimetableOption={originalTerms ? true : false}
                    />
                  ) : (
                    <article
                      key={positionId}
                      className="course-placeholder"
                      style={!selectedCourse ? { cursor: "not-allowed" } : {}}
                      onClick={() =>
                        selectedCourse
                          ? updateTimetableCourses(
                              selectedCourse,
                              termId + 1,
                              positionId + 1
                            )
                          : null
                      }
                    ></article>
                  )
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div
        className="error-modal-container"
        onClick={(event) =>
          !event.target.className.includes("error-modal-container") &&
          !event.target.className.includes("close-modal")
            ? null
            : setGenerateTimetableError("")
        }
        style={
          generateTimetableError || isTimetableGenerating
            ? {}
            : { display: "none" }
        }
      >
        {isTimetableGenerating ? (
          <div className="loader timetable-loader"></div>
        ) : (
          <div className="error-modal">
            <span className="material-symbols-outlined close-modal">close</span>
            <h2 className="timetable-generate-error-title">
              {TIMETABLE_ERROR_TITLE}
            </h2>
            <h3 className="timetable-generate-error-message">
              {generateTimetableError}
            </h3>
          </div>
        )}
      </div>

      <section
        className="timetable-requirements-container"
        style={
          originalTerms
            ? { cursor: "not-allowed" }
            : {
                bottom: isRequirementsMenuOpen
                  ? REQUIREMENTS_CONTAINER_NEW_BOTTOM
                  : "",
              }
        }
        onMouseEnter={() =>
          originalTerms ? null : setIsRequirementsMenuOpen(true)
        }
        onMouseLeave={() => setIsRequirementsMenuOpen(false)}
      >
        <span className="material-symbols-outlined requirements-menu">
          {isRequirementsMenuOpen && !originalTerms
            ? "keyboard_arrow_down"
            : "keyboard_arrow_up"}
        </span>
        <div className="all-requirements-container">
          <h2 className="requirements-title">{REQUIREMENTS}</h2>
          <div className="degree-requirements-container">
            <article className="degree-requirement">
              <h3 className="requirement-title">
                {renderMetRequirementIcons(
                  kernelCourses.filter((courseObject) => courseObject.course)
                    .length === AMOUNT_OF_KERNEL_AREAS
                )}
                {KERNEL}
                {`${
                  kernelCourses.filter((courseObject) => courseObject.course)
                    .length
                } / 4`}
              </h3>
              <ul className="requirement-ul">
                {kernelCourses.map((courseObject, index) => (
                  <li className="requirement-li" key={index}>{`${
                    ECE_AREAS[courseObject.area]
                  }: ${
                    courseObject.course ? courseObject.course : NO_COURSE
                  }`}</li>
                ))}
              </ul>
            </article>
            <article className="degree-requirement">
              <h3 className="requirement-title">
                {renderMetRequirementIcons(
                  depthCourses.filter((courseObject) => courseObject.course)
                    .length === AMOUNT_OF_KERNEL_AREAS
                )}
                {DEPTH}
                {`${
                  depthCourses.filter((courseObject) => courseObject.course)
                    .length
                } / 4`}
              </h3>
              <ul className="requirement-ul">
                {[...Array(2)].map((listItem1, index) => (
                  <span key={index}>
                    <li className="requirement-li">{`${
                      ECE_AREAS[depthCourses[index + 1]?.area]
                    }:`}</li>
                    <ul>
                      {[...Array(2)].map((listItem2, courseIndex) => (
                        <li key={courseIndex}>{`${
                          depthCourses[2 * index + courseIndex]?.course
                            ? depthCourses[2 * index + courseIndex]?.course
                            : NO_COURSE
                        }`}</li>
                      ))}
                    </ul>
                  </span>
                ))}
              </ul>
            </article>
            <article className="degree-requirement">
              <h3 className="requirement-title">
                {renderMetRequirementIcons(isECE472Met)}
                {ECE472}
              </h3>
              <h3 className="requirement-title">
                {renderMetRequirementIcons(isOtherCoursesMet)}
                {OTHER_COURSES}
                {`${otherCoursesAmount} / 11`}
              </h3>
            </article>
          </div>

          <div className="divider"></div>

          <div className="degree-requirements-container">
            {errors.map((error, index) => (
              <article key={index} className="degree-requirement">
                <h3
                  className="requirement-title"
                  style={{ alignSelf: "center" }}
                >
                  {error.title}
                </h3>
                {error.errors.length === 0 ? (
                  <h4 style={{ textAlign: "center" }}>{NO_ERRORS}</h4>
                ) : (
                  <ul
                    className="requirement-ul"
                    style={{ alignSelf: "center" }}
                  >
                    {error.errors.map((error, index) => (
                      <li className="requirement-li" key={index}>
                        {error}
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Timetable;
