import { CODE } from "../../utils/constants";
const DELETE = "delete";

const TimetableCourseSummary = (props) => {
  return (
    <article
      className="course-placeholder timetable-course-details-container"
      style={props.isTimetableOption ? { cursor: "not-allowed" } : {}}
      onClick={(event) =>
        event.target.innerText !== DELETE && !props.isTimetableOption
          ? props.setSelectedCourse(props.courseId)
          : null
      }
    >
      <span
        className="material-symbols-outlined timetable-course-delete"
        onClick={props.deleteTimetableCourse}
        style={props.isTimetableOption ? { display: "none" } : {}}
      >
        {DELETE}
      </span>
      <h4 className="explore-course-title timetable-course-title">
        {props.title}
      </h4>
      <h5 className="explore-course-heading">
        {CODE}
        <span className="explore-course-heading-item">{props.code}</span>
      </h5>
    </article>
  );
};

export default TimetableCourseSummary;
