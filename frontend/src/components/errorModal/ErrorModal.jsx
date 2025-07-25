import {
  PLAN_COURSES_TO_OVERLOAD,
  TIMETABLE_AREAS_CHANGE_TITLE,
} from "../../utils/constants";
const CONFIRM = "Confirm";
import { Checkbox } from "@mui/material";

const ErrorModal = (props) => {
  const toggleCourseInCoursesPlanToOverload = (courseId) => {
    let newCoursesPlanToOverload = [...props.coursesPlanToOverload];

    if (props.coursesPlanToOverload.includes(courseId)) {
      let indexOfCourse = props.coursesPlanToOverload.indexOf(courseId);
      newCoursesPlanToOverload.splice(indexOfCourse, 1);
    } else {
      newCoursesPlanToOverload.push(courseId);
    }

    props.setCoursesPlanToOverload(newCoursesPlanToOverload);
  };

  const generateCourseOptionsSummary = () => {
    const timetableCourseIdsSet = new Set(
      props.timetableCourses?.map((course) => course.courseId)
    );

    return (
      <section className="overload-course-container">
        {props.coursesInCart
          ?.filter((course) => !timetableCourseIdsSet.has(course.id))
          ?.map((course) => (
            <article key={course.id}>
              <Checkbox
                className="timetable-checkbox"
                checked={props.coursesPlanToOverload.includes(course.id)}
                onChange={() => toggleCourseInCoursesPlanToOverload(course.id)}
                disabled={
                  props.coursesPlanToOverload.length === 4 &&
                  !props.coursesPlanToOverload.includes(course.id)
                }
              />
              {course.title}
            </article>
          ))}
      </section>
    );
  };

  return (
    <div
      className="error-modal-container"
      onClick={(event) =>
        !event.target.className.includes("error-modal-container") &&
        !event.target.className.includes("close-modal")
          ? null
          : props.closeAction()
      }
      style={props.isModalDisplaying ? {} : { display: "none" }}
    >
      {props.displayLoader ? (
        <div className="loader timetable-loader"></div>
      ) : (
        <div className="error-modal">
          <span className="material-symbols-outlined close-modal">close</span>
          <h2
            className="timetable-generate-error-title"
            style={
              props.title === PLAN_COURSES_TO_OVERLOAD
                ? { paddingBottom: "15px" }
                : {}
            }
          >
            {props.title}
          </h2>

          <h3 className="timetable-generate-error-message">
            {!props.message && props.timetableCourses
              ? generateCourseOptionsSummary()
              : props.message}
          </h3>
          
          {[TIMETABLE_AREAS_CHANGE_TITLE, PLAN_COURSES_TO_OVERLOAD].includes(
            props.title
          ) ? (
            <button
              className="create-btn confirm-area-change-btn"
              onClick={props.actionOnConfirmation}
            >
              {CONFIRM}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ErrorModal;
