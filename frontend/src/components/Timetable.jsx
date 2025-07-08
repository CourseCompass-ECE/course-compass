import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Path } from "../utils/enums";
import { ONLY_NUMBERS } from "../utils/regex";
import { ID_QUERY_PARAM } from "../utils/constants";

const Timetable = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [timetable, setTimetable] = useState(null);

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
        setTimetable(data?.timetable);
      } else {
        navigate(Path.TIMETABLES);
      }
    } catch (error) {
      navigate(Path.TIMETABLES);
    }
  };

  useEffect(() => {
    const callFetchTimetableData = async (id) => {
      await fetchTimetableData(id);
    };

    const timetableId = searchParams.get("id");
    if (!ONLY_NUMBERS.test(timetableId)) navigate(Path.TIMETABLES);
    callFetchTimetableData(timetableId);
  }, []);

  return (
    <div className="page-container">
      <button
        className="create-account-back-container create-email-back-container"
        onClick={() => navigate(Path.TIMETABLES)}
      >
        <span className="material-symbols-outlined create-account-back-icon">
          west
        </span>
      </button>
      <h1 className="page-title">{timetable?.title}</h1>
    </div>
  );
};

export default Timetable;
