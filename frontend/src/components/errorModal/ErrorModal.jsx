import { TIMETABLE_AREAS_CHANGE_TITLE } from "../../utils/constants";
const CONFIRM = "Confirm";

const ErrorModal = (props) => {
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
          <h2 className="timetable-generate-error-title">{props.title}</h2>
          <h3 className="timetable-generate-error-message">{props.message}</h3>
          {props.title === TIMETABLE_AREAS_CHANGE_TITLE ? (
            <button className="create-btn confirm-area-change-btn" onClick={props.updateTimetableAreas}>
              {CONFIRM}
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default ErrorModal;
