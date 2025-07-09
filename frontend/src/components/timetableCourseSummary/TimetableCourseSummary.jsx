import { CODE } from "../../utils/constants";

const TimetableCourseSummary = (props) => {
  return (
    <article className="course-placeholder timetable-course-details-container" onClick={() => props.setSelectedCourse(props.courseId)}>
      <h4 className="explore-course-title timetable-course-title">{props.title}</h4>
      <h5 className="explore-course-heading">
            {CODE}
            <span className="explore-course-heading-item">
              {props.code}
            </span>
          </h5>
    </article>
  );
};

export default TimetableCourseSummary;
