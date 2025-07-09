import { useState, useEffect } from "react";
import { Path } from "../utils/enums";
import { useNavigate } from "react-router-dom";
import CurrentTimetablesList from "./currentTimetablesList/CurrentTimetablesList";
import { CONFLICT_FREE, CONFLICTING } from "../utils/constants";

const Timetables = () => {
  const navigate = useNavigate();
  const [currentTimetables, setCurrentTimetables] = useState([]);
  const [selectedSort, setSelectedSort] = useState("");
  const [fetchTimetablesError, setFetchTimetablesError] = useState("");
  const TITLE = "Timetables";
  const BUTTON_TEXT = "Create Timetable";
  const CURRENT_TIMETABLES = "Current Timetables";
  const ALPHABETICAL = "Alphabetical";
  const DATE = "Date (Newest to Oldest)";
  const SORT_OPTIONS = [ALPHABETICAL, DATE, CONFLICT_FREE, CONFLICTING];
  const SORTING_METHOD_PLACEHOLDER = "Sort By";
  const FETCH_ERROR_MESSAGE = "Something went wrong fetching timetables";

  const sortTimetables = (timetables) => {
    switch (selectedSort) {
      case ALPHABETICAL:
        return timetables.toSorted((timetableA, timetableB) => timetableA.title.localeCompare(timetableB.title));
      case DATE:
        return timetables.toSorted((timetableA, timetableB) => new Date(timetableB.updatedAt) - new Date(timetableA.updatedAt));
      case CONFLICT_FREE:
        return timetables.filter((timetable) => timetable.isConflictFree);
      case CONFLICTING:
        return timetables.filter((timetable) => !timetable.isConflictFree);
      default:
        return timetables;
    }
  };

  const fetchAllTimetables = async () => {
    setFetchTimetablesError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${Path.TIMETABLES}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCurrentTimetables(data?.timetables);
      } else {
        setFetchTimetablesError(FETCH_ERROR_MESSAGE);
      }
    } catch (error) {
      setFetchTimetablesError(FETCH_ERROR_MESSAGE);
    }
  };

  useEffect(() => {
    fetchAllTimetables();
  }, []);

  return (
    <div className="page-container">
      <h1 className="page-title">{TITLE}</h1>
      <div className="create-btn-height">
        <div
          className="create-btn"
          style={{ width: "250px" }}
          onClick={() => navigate(Path.CREATE_TIMETABLE)}
        >
          <span className="material-symbols-outlined">add_2</span>
          {BUTTON_TEXT}
        </div>
      </div>

      <div className="email-sent-filter-container">
        <h2 className="page-big-header">{CURRENT_TIMETABLES}</h2>
        <select
          value={selectedSort}
          className="text-input email-topic-dropdown"
          style={{ width: "20vw" }}
          onChange={(event) => setSelectedSort(event.target.value)}
        >
          <option value="">{SORTING_METHOD_PLACEHOLDER}</option>
          {SORT_OPTIONS.map((sortType, index) => (
            <option key={index} value={sortType}>
              {sortType}
            </option>
          ))}
        </select>
      </div>

      <CurrentTimetablesList timetables={sortTimetables(currentTimetables)} />

      <div className="text-input-error fetch-emails-error">
        {fetchTimetablesError}
      </div>
    </div>
  );
};

export default Timetables;
