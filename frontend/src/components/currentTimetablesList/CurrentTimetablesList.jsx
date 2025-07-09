import CurrentTimetable from "./CurrentTimetable.jsx";

const CurrentTimetablesList = (props) => {
  const NO_TIMETABLES = "No timetables created";

  return (
    <div>
      {props.timetables.length === 0 ? (
        <h3 className="no-emails-message">{NO_TIMETABLES}</h3>
      ) : (
        <div className="sent-emails-container">
          {props.timetables.map((timetable, index) => 
            <CurrentTimetable key={index} timetable={timetable} />
          )}
        </div>
      )}
    </div>
  );
};

export default CurrentTimetablesList;
