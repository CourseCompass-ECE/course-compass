import { OVERLOADED_POSITION } from "../../utils/constants.js";
import CurrentTimetable from "./CurrentTimetable.jsx";

const CurrentTimetablesList = (props) => {
  const NO_TIMETABLES = "No timetables created";

  return (
    <div>
      {props.timetables.length === 0 ? (
        <h3 className="no-emails-message">{NO_TIMETABLES}</h3>
      ) : (
        <div className="sent-emails-container">
          {props.timetables.map((timetable, index) => (
            <CurrentTimetable
              key={index}
              timetable={timetable}
              notOverloadedCourses={timetable?.courses?.filter(
                (course) => course.position !== OVERLOADED_POSITION
              )}
              overloadedCourses={timetable?.courses?.filter(
                (course) => course.position === OVERLOADED_POSITION
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrentTimetablesList;
