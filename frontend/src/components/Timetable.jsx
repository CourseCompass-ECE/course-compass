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
  TIMETABLE_AREAS_CHANGE_TITLE,
  PLAN_COURSES_TO_OVERLOAD,
  UPDATE_AREAS_PATH,
  MAXIMUM_DURATION,
  OVERLOAD_PATH,
  OVERLOADED_POSITION,
  CONFLICTING_TIMETABLE_ERROR
} from "../utils/constants";
import { fetchCoursesInCart } from "../utils/fetchShoppingCart";
import ExploreCourse from "./exploreCourseList/ExploreCourse";
import TimetableCourseSummary from "./timetableCourseSummary/TimetableCourseSummary";
import { areRequirementsMet } from "../utils/requirementsCheck";
import { updateCoursesInCart } from "../utils/updateCourses";
import { Slider, Checkbox } from "@mui/material";
import ErrorModal from "./errorModal/ErrorModal";
import { isValidIgnoringOverloaded } from "../../../backend/utils/requirementCheckHelpers";

const Timetable = () => {
  const OVERLOADED_COURSES_TITLE = "Overloaded Courses";
  const initialTerms = [
    {
      title: "3rd Year, Fall",
      courses: Array(5).fill(null),
    },
    { title: "3rd Year, Winter", courses: Array(5).fill(null) },
    { title: "4th Year, Fall", courses: Array(5).fill(null) },
    { title: "4th Year, Winter", courses: Array(5).fill(null) },
  ];
  const initialOverloadedCourses = {
    title: OVERLOADED_COURSES_TITLE,
    courses: Array(4).fill(null),
  };
  const DEFAULT_DURATION = 5;
  const MINIMUM_DURATION = 1;

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
  const [
    isTimetableGeneratingOverloading,
    setIsTimetableGeneratingOverloading,
  ] = useState(false);
  const [generatedTimetables, setGeneratedTimetables] = useState(null);
  const [currentOption, setCurrentOption] = useState(null);
  const [originalTerms, setOriginalTerms] = useState(null);
  const [timetableOverloadedError, setTimetableOverloadedError] = useState("");
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
  const [generateTimetableDuration, setGenerateTimetableDuration] =
    useState(DEFAULT_DURATION);
  const [anyKernelDepth, setAnyKernelDepth] = useState(false);
  const [anyDepth, setAnyDepth] = useState(false);
  const [displayUpdateAreasPopup, setDisplayUpdateAreasPopup] = useState(false);
  const [kernelAreaChanges, setKernelAreaChanges] = useState(null);
  const [depthAreaChanges, setDepthAreaChanges] = useState(null);
  const [overloadedCourses, setOverloadedCourses] = useState(
    initialOverloadedCourses
  );
  const [overloadedCoursesOptions, setOverloadedCoursesOptions] =
    useState(null);
  const [originalOverloadedCourses, setOriginalOverloadedCourses] =
    useState(null);
  const [coursesPlanToOverload, setCoursesPlanToOverload] = useState([]);
  const [overloadTimetableError, setOverloadTimetableError] = useState("");
  const [isPlanningToOverload, setIsPlanningToOverload] = useState(false);

  const TIMETABLE = "Timetable";
  const TIMETABLE_DESCRIPTION = "Timetable Description ";
  const DESIGNATION = "Designation";
  const NO_DESIGNATION =
    "No designation is possible with the current timetable";
  const TIMETABLE_SELECTION_INFO =
    "Click on a course from your shopping cart or currently in your timetable, then click on any open tile to move it";
  const GENERATE_BUTTON_TEXT = "Generate Timetable";
  const OVERLOAD_BUTTON_TEXT = "Overload Timetable";
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
  const GENERATE_TIMETABLE_ERROR_TITLE = "Unable to Generate Timetable";
  const OVERLOAD_TIMETABLE_ERROR_TITLE = "Unable to Overload Timetable";
  const REQUIREMENTS_CONTAINER_NEW_BOTTOM = "7vh";
  const OPTION = "Option: ";
  const TIMETABLE_SCORE_OUTLINE_ALT =
    "Gold leaf circular outline to encase timetable score";
  const TIMETABLE_SCORE_OUTLINE = [
    "/goldOutline.png",
    "/silverOutline.png",
    "/bronzeOutline.png",
  ];
  const TIMETABLE_GENERATION_DURATION = "Maximum Duration (s):";
  const DURATION_QUERY_PARAM = "&duration=";
  const ANY_KERNEL_DEPTH_QUERY_PARAM = "&anyKernelDepth=";
  const ANY_DEPTH_QUERY_PARAM = "&anyDepth=";
  const GENERATE_TIMETABLE_SETTINGS = "Generate Timetable Settings:";
  const CHOOSE_ANY_KERNEL_AND_DEPTH_AREAS = "Choose any kernel & depth areas:";
  const CHOOSE_ANY_DEPTH_AREAS = "Choose any depth areas:";
  const KERNEL_AREA_CHANGES = "Kernel Area Changes:";
  const DEPTH_AREA_CHANGES = "Depth Area Changes:";
  const INSUFFICIENT_COURSES_PROVIDED =
    "At least 1 course must be added to overload the timetable";

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
        setOverloadedCoursesToDisplay(data?.timetable?.courses);
        areRequirementsMet(
          data?.timetable,
          setKernelCourses,
          setDepthCourses,
          setIsECE472Met,
          setIsOtherCoursesMet,
          setOtherCoursesAmount,
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
      if (courseObject.position !== OVERLOADED_POSITION)
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
      setIsTimetableGeneratingOverloading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${
          Path.TIMETABLE
        }${GENERATE_PATH}${ID_QUERY_PARAM}${timetableId}${DURATION_QUERY_PARAM}${generateTimetableDuration}${ANY_KERNEL_DEPTH_QUERY_PARAM}${
          anyKernelDepth ? 1 : 0
        }${ANY_DEPTH_QUERY_PARAM}${anyDepth ? 1 : 0}`,
        {
          method: "GET",
          credentials: "include",
        }
      );
      setIsTimetableGeneratingOverloading(false);

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
      setIsTimetableGeneratingOverloading(false);
      setGenerateTimetableError(error?.message ? error.message : GENERIC_ERROR);
    }
  };

  const overloadTimetable = async (timetableId) => {
    try {
      let courseIds = coursesPlanToOverload;
      setCoursesPlanToOverload([]);
      setIsPlanningToOverload(false);

      if (courseIds.length === 0) {
        setOverloadTimetableError(INSUFFICIENT_COURSES_PROVIDED);
        return;
      } else if (!isValidIgnoringOverloaded(timetable)) {
        setOverloadTimetableError(CONFLICTING_TIMETABLE_ERROR);
        return;
      }

      setIsTimetableGeneratingOverloading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${
          Path.TIMETABLE
        }${OVERLOAD_PATH}${ID_QUERY_PARAM}${timetableId}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseIds: courseIds,
          }),
        }
      );
      setIsTimetableGeneratingOverloading(false);

      if (response.ok) {
        const data = await response.json();
        if (data?.overloadedCourses.length > 0)
          setOverloadedCoursesOptions(data?.overloadedCourses);
        else throw new Error();
      } else {
        const error = await response.json();
        setOverloadTimetableError(
          error?.message ? error.message : GENERIC_ERROR
        );
      }
    } catch (error) {
      setIsTimetableGeneratingOverloading(false);
      setOverloadTimetableError(error?.message ? error.message : GENERIC_ERROR);
    }
  };

  const setOverloadedCoursesToDisplay = (timetableCourses) => {
    let courseArray = Array(4).fill(null);
    timetableCourses
      .filter((courseObject) => courseObject.position === OVERLOADED_POSITION)
      .forEach((courseObject) => {
        courseArray[courseObject.term - 1] = {
          title: courseObject.course.title,
          code: courseObject.course.code,
          id: courseObject.course.id,
          term: courseObject.term,
        };
      });
    setOverloadedCourses({ ...initialOverloadedCourses, courses: courseArray });
  };

  const updateOverloadedCourses = async () => {
    setTimetableOverloadedError("");

    try {
      let cleanedOverloadedCourses = overloadedCoursesOptions[
        currentOption - 1
      ]?.courses?.filter((course) => course.id !== null);

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${
          Path.TIMETABLE
        }${OVERLOAD_PATH}${ID_QUERY_PARAM}${timetable.id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courses: cleanedOverloadedCourses,
          }),
        }
      );

      if (response.ok) {
        exitTimetableOrOverloadedOptions();
        fetchTimetableData(timetable.id);
      } else {
        setTimetableOverloadedError(GENERIC_ERROR);
      }
    } catch (error) {
      setTimetableOverloadedError(GENERIC_ERROR);
    }
  };

  const insertOverloadedCoursesOption = (index) => {
    setOverloadedCourses({
      ...initialOverloadedCourses,
      courses: overloadedCoursesOptions[index]?.courses?.toSorted(
        (courseA, courseB) => courseA.term - courseB.term
      ),
    });
  };

  const enableOverloadedSelection = () => {
    setOriginalOverloadedCourses(overloadedCourses);
    insertOverloadedCoursesOption(0);
    setCurrentOption(1);
  };

  const enableTimetableSelection = () => {
    setOriginalTerms(terms);
    organizeCourses(generatedTimetables[0].courses);
    setCurrentOption(1);
  };

  const updateTimetableOrOverloadedOption = (change) => {
    const newOption = currentOption + change;
    let options = overloadedCoursesOptions
      ? overloadedCoursesOptions
      : generatedTimetables;
    if (newOption > 0 && newOption <= options.length) {
      setTimetableOverloadedError("");
      setCurrentOption(newOption);
      if (generatedTimetables) organizeCourses(options[newOption - 1].courses);
      else insertOverloadedCoursesOption(newOption - 1);
    }
  };

  const exitTimetableOrOverloadedOptions = () => {
    setOriginalTerms(null);
    setOriginalOverloadedCourses(null);
    setGeneratedTimetables(null);
    setOverloadedCoursesOptions(null);
    setCurrentOption(null);
    setTimetableOverloadedError("");
  };

  const selectTimetableOption = async () => {
    setTimetableOverloadedError("");

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
            courses: generatedTimetables[currentOption - 1].courses,
          }),
        }
      );

      if (response.ok) {
        exitTimetableOrOverloadedOptions();
        fetchTimetableData(timetable.id);
      } else {
        setTimetableOverloadedError(GENERIC_ERROR);
      }
    } catch (error) {
      setTimetableOverloadedError(GENERIC_ERROR);
    }
  };

  const handleTimetableSelection = () => {
    let generatedTimetableKernelSet = new Set(
      generatedTimetables[currentOption - 1].kernel
    );
    let generatedTimetableDepthSet = new Set(
      generatedTimetables[currentOption - 1].depth
    );
    let existingTimetableKernelSet = new Set(timetable.kernel);
    let existingTimetableDepthSet = new Set(timetable.depth);

    let commonKernelAreas = generatedTimetableKernelSet.intersection(
      existingTimetableKernelSet
    );
    let commonDepthAreas = generatedTimetableDepthSet.intersection(
      existingTimetableDepthSet
    );

    let removedKernelAreas = commonKernelAreas.symmetricDifference(
      existingTimetableKernelSet
    );
    let removedDepthAreas = commonDepthAreas.symmetricDifference(
      existingTimetableDepthSet
    );
    let newKernelAreas = commonKernelAreas.symmetricDifference(
      generatedTimetableKernelSet
    );
    let newDepthAreas = commonDepthAreas.symmetricDifference(
      generatedTimetableDepthSet
    );

    if (removedKernelAreas.size !== 0 || removedDepthAreas.size !== 0) {
      setKernelAreaChanges(
        removedKernelAreas.size !== 0
          ? {
              removed: [...removedKernelAreas],
              added: [...newKernelAreas],
            }
          : null
      );
      setDepthAreaChanges(
        removedDepthAreas.size !== 0
          ? { removed: [...removedDepthAreas], added: [...newDepthAreas] }
          : null
      );
      setDisplayUpdateAreasPopup(true);
    } else {
      selectTimetableOption();
    }
  };

  const cancelChangeAreasAttempt = () => {
    setDisplayUpdateAreasPopup(false);
    setKernelAreaChanges(null);
    setDepthAreaChanges(null);
  };

  const renderAreaChanges = (areaChangesObject, changeText) => {
    return (
      <>
        {areaChangesObject?.removed ? <span>{changeText}</span> : null}
        <ul
          style={areaChangesObject ? { display: "block" } : { display: "none" }}
          className="area-changes-summary"
        >
          {areaChangesObject?.removed
            ? areaChangesObject?.removed?.map((kernelAreaRemoved, index) => {
                let kernelAreaAdded = areaChangesObject.added[index];
                return (
                  <li
                    key={index}
                    className="area-change"
                  >{`${ECE_AREAS[kernelAreaRemoved]} -> ${ECE_AREAS[kernelAreaAdded]}`}</li>
                );
              })
            : null}
        </ul>
      </>
    );
  };

  const generateAreaChangesSummary = () => {
    return (
      <>
        {renderAreaChanges(kernelAreaChanges, KERNEL_AREA_CHANGES)}
        {renderAreaChanges(depthAreaChanges, DEPTH_AREA_CHANGES)}
      </>
    );
  };

  const updateTimetableAreas = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${
          Path.TIMETABLE
        }${UPDATE_AREAS_PATH}${ID_QUERY_PARAM}${timetable.id}`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            kernel: generatedTimetables[currentOption - 1].kernel,
            depth: generatedTimetables[currentOption - 1].depth,
          }),
        }
      );

      if (response.ok) {
        await selectTimetableOption();
        cancelChangeAreasAttempt();
        fetchTimetableData(timetable.id);
      } else {
        cancelChangeAreasAttempt();
        setUpdateTimetableError(GENERIC_ERROR);
      }
    } catch (error) {
      cancelChangeAreasAttempt();
      setUpdateTimetableError(GENERIC_ERROR);
    }
  };

  const kernelDepthToggled = () => {
    if (!anyKernelDepth) setAnyDepth(true);
    setAnyKernelDepth(!anyKernelDepth);
  };

  const depthToggled = () => {
    if (anyDepth) setAnyKernelDepth(false);
    setAnyDepth(!anyDepth);
  };

  const resetTimetableErrorMessages = () => {
    setGenerateTimetableError("");
    setOverloadTimetableError("");
  };

  const renderScore = () => {
    if (currentOption && generatedTimetables) {
      return generatedTimetables[currentOption - 1]?.score;
    } else if (currentOption && overloadedCoursesOptions) {
      return overloadedCoursesOptions[currentOption - 1]?.score;
    }
    return "";
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
    if (originalTerms || originalOverloadedCourses) return;
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

  useEffect(() => {
    if (overloadedCoursesOptions) enableOverloadedSelection();
  }, [overloadedCoursesOptions]);

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
                      !originalTerms &&
                      !originalOverloadedCourses
                        ? setSelectedCourse(course.id)
                        : null
                    }
                    style={{
                      cursor:
                        originalTerms || originalOverloadedCourses
                          ? "not-allowed"
                          : "pointer",
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
              style={{
                display:
                  originalTerms || originalOverloadedCourses ? "block" : "none",
              }}
            >
              <span
                className="material-symbols-outlined timetable-selection-arrow"
                onClick={() => updateTimetableOrOverloadedOption(-1)}
              >
                arrow_left
              </span>
              {`${OPTION}${currentOption} of ${
                generatedTimetables?.length || overloadedCoursesOptions?.length
              }`}
              <img
                className="timetable-score-outline"
                alt={TIMETABLE_SCORE_OUTLINE_ALT}
                src={
                  TIMETABLE_SCORE_OUTLINE[currentOption ? currentOption - 1 : 0]
                }
              />
              <span className="timetable-option-score">{renderScore()}%</span>
              <span
                className="material-symbols-outlined timetable-selection-arrow timetable-selection-right-arrow"
                onClick={() => updateTimetableOrOverloadedOption(1)}
              >
                arrow_right
              </span>
              <div className="timetable-options-select-container">
                <span
                  className="material-symbols-outlined timetable-edit-icon timetable-yes"
                  onClick={
                    originalTerms
                      ? handleTimetableSelection
                      : updateOverloadedCourses
                  }
                >
                  check_circle
                </span>
                <span
                  className="material-symbols-outlined timetable-edit-icon timetable-no"
                  onClick={() => {
                    originalTerms
                      ? setTerms(originalTerms)
                      : setOverloadedCourses(originalOverloadedCourses);
                    exitTimetableOrOverloadedOptions();
                  }}
                >
                  cancel
                </span>
              </div>
              <div>
                <span className="text-input-error timetable-select-error">
                  {timetableOverloadedError}
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
                  originalTerms || originalOverloadedCourses
                    ? null
                    : generateTimetable(timetable?.id)
                }
                style={
                  originalTerms || originalOverloadedCourses
                    ? { cursor: "not-allowed" }
                    : {}
                }
              >
                <span className="material-symbols-outlined">wand_stars</span>
                {GENERATE_BUTTON_TEXT}
              </button>
            </div>
            <div className="generate-timetable-options-container">
              <span className="timetable-settings">
                {GENERATE_TIMETABLE_SETTINGS}
              </span>
              <span className="timetable-option-text timetable-checkbox-option-text">
                {CHOOSE_ANY_KERNEL_AND_DEPTH_AREAS}
              </span>
              <Checkbox
                className="timetable-checkbox"
                checked={anyKernelDepth}
                onChange={kernelDepthToggled}
              />

              <span className="timetable-option-text timetable-checkbox-option-text">
                {CHOOSE_ANY_DEPTH_AREAS}
              </span>
              <Checkbox
                className="timetable-checkbox"
                checked={anyDepth}
                onChange={depthToggled}
              />

              <span className="timetable-option-text">
                {TIMETABLE_GENERATION_DURATION}
              </span>
              <Slider
                defaultValue={DEFAULT_DURATION}
                min={MINIMUM_DURATION}
                max={MAXIMUM_DURATION}
                valueLabelDisplay="auto"
                onChange={(event) =>
                  setGenerateTimetableDuration(event.target.value)
                }
              />
            </div>
            <span className="timetable-change-error">
              {updateTimetableError}
            </span>

            <div className="create-btn-height overload-timetable">
              <button
                className="create-btn generate-background generate-timetable"
                onClick={() =>
                  originalTerms || originalOverloadedCourses
                    ? null
                    : setIsPlanningToOverload(true)
                }
                style={
                  originalTerms || originalOverloadedCourses
                    ? { cursor: "not-allowed" }
                    : {}
                }
              >
                <span className="material-symbols-outlined">add_ad</span>
                {OVERLOAD_BUTTON_TEXT}
              </button>
            </div>
          </h2>

          {[...terms, overloadedCourses].map((term, termId) => (
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
                      isViewOnlyTimetableCourse={
                        originalTerms || originalOverloadedCourses
                          ? true
                          : false
                      }
                      termNumber={
                        term.title === OVERLOADED_COURSES_TITLE
                          ? positionId + 1
                          : null
                      }
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
                              term.title !== OVERLOADED_COURSES_TITLE
                                ? termId + 1
                                : positionId + 1,
                              term.title !== OVERLOADED_COURSES_TITLE
                                ? positionId + 1
                                : OVERLOADED_POSITION
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

      <ErrorModal
        title={
          generateTimetableError
            ? GENERATE_TIMETABLE_ERROR_TITLE
            : OVERLOAD_TIMETABLE_ERROR_TITLE
        }
        message={generateTimetableError || overloadTimetableError}
        closeAction={resetTimetableErrorMessages}
        isModalDisplaying={
          generateTimetableError ||
          overloadTimetableError ||
          isTimetableGeneratingOverloading
        }
        displayLoader={isTimetableGeneratingOverloading}
      />

      <ErrorModal
        title={TIMETABLE_AREAS_CHANGE_TITLE}
        message={generateAreaChangesSummary()}
        closeAction={cancelChangeAreasAttempt}
        isModalDisplaying={displayUpdateAreasPopup}
        displayLoader={false}
        actionOnConfirmation={updateTimetableAreas}
      />

      <ErrorModal
        title={PLAN_COURSES_TO_OVERLOAD}
        message={null}
        timetableCourses={timetable?.courses?.filter(
          (courseObject) => courseObject.position !== OVERLOADED_POSITION
        )}
        coursesInCart={coursesInCart}
        coursesPlanToOverload={coursesPlanToOverload}
        setCoursesPlanToOverload={setCoursesPlanToOverload}
        closeAction={() => setIsPlanningToOverload(false)}
        isModalDisplaying={isPlanningToOverload}
        displayLoader={false}
        actionOnConfirmation={() => overloadTimetable(timetable.id)}
      />

      <section
        className="timetable-requirements-container"
        style={
          originalTerms || originalOverloadedCourses
            ? { cursor: "not-allowed" }
            : {
                bottom: isRequirementsMenuOpen
                  ? REQUIREMENTS_CONTAINER_NEW_BOTTOM
                  : "",
              }
        }
        onMouseEnter={() =>
          originalTerms || originalOverloadedCourses
            ? null
            : setIsRequirementsMenuOpen(true)
        }
        onMouseLeave={() => setIsRequirementsMenuOpen(false)}
      >
        <span className="material-symbols-outlined requirements-menu">
          {isRequirementsMenuOpen &&
          !originalTerms &&
          !originalOverloadedCourses
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
