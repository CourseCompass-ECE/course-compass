import {
  CONFLICTING,
  CONFLICT_FREE,
  DESIGNATIONS,
  NO_DESIGNATION,
  ID_QUERY_PARAM
} from "../../utils/constants";
import { useNavigate } from "react-router-dom";
import { Path } from "../../utils/enums";

const CurrentTimetable = (props) => {
  const navigate = useNavigate();
  const COURSES_SCHEDULED = "Courses Scheduled:";
  const DESCRIPTION = "Description:";
  const LAST_UPDATED = "Last Updated: ";
  const AM = "AM";
  const PM = "PM";

  const formatDate = (date) => {
    const dateObject = new Date(date);
    const day = dateObject.toLocaleDateString();
    let minutes = dateObject.getMinutes();
    let hours = dateObject.getHours();
    const amOrPm = hours > 11 ? PM : AM;
    if (hours > 12) hours -= 12;
    if (hours === 0) hours = 12;
    return (`${day}, ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${amOrPm}`)
  }

  return (
    <div
      className="sent-email-container timetable-container"
      style={{
        borderColor: props.timetable.isConflictFree
          ? "var(--correct-green)"
          : "var(--error-red)",
      }}
      onClick={() => navigate(`${Path.TIMETABLE}${ID_QUERY_PARAM}${props.timetable.id}`)}
    >
      <h3 className="email-title">{props.timetable.title}</h3>
      <h4 className="email-header">
        {COURSES_SCHEDULED}{" "}
        <span
          style={{ fontFamily: "var(--text-font)" }}
        >{`${props.notOverloadedCourses.length} / 20 courses + ${props.overloadedCourses.length} overloaded`}</span>
      </h4>
      <h4 className="email-header">{DESCRIPTION}</h4>
      <h5 className="email-header email-body" style={{ height: "35%" }}>
        {props.timetable.description}
      </h5>

      <div className="timetable-tags-date-container">
        <div className="timetable-tags-container">
          <div className="timetable-tag">
            {props.timetable.isConflictFree ? CONFLICT_FREE : CONFLICTING}
          </div>
          <div className="timetable-tag">
            {props.timetable.designation
              ? DESIGNATIONS[props.timetable.designation]
              : NO_DESIGNATION}
          </div>
        </div>
        <div className="timetable-date">
          {LAST_UPDATED}
          {formatDate(props.timetable.updatedAt)}
        </div>
      </div>
    </div>
  );
};

export default CurrentTimetable;
