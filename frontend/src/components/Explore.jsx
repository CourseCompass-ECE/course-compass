import { useEffect } from "react";
import { useState } from "react";
import { Path } from "../utils/enums";

const Explore = () => {
  const [courseData, setCourseData] = useState([]);
  const [fetchCourseDataError, setFetchCourseDataError] = useState("");
  const FETCH_COURSES_ERROR_MESSAGE = "Something went wrong fetching courses";
  const RECOMMENDED = "Recommended";

  const fetchAllCourseData = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${Path.EXPLORE}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCourseData(data?.courses);
      } else {
        setFetchCourseDataError(FETCH_COURSES_ERROR_MESSAGE);
      }
    } catch (error) {
      setFetchCourseDataError(FETCH_COURSES_ERROR_MESSAGE);
    }
  };
  console.log(courseData);

  useEffect(() => {
    fetchAllCourseData();
  }, []);

  return (
    <div>
      {courseData.length !== 0 ? (
        <>
          <section className="explore-filters-container"></section>
          <section>
            <h2 className="explore-recommend-header">{RECOMMENDED}</h2>
          </section>
        </>
      ) : (
        <h2 className="explore-error">{fetchCourseDataError}</h2>
      )}
    </div>
  );
};

export default Explore;
