import { useEffect } from "react";
import { useState } from "react";
import { Path } from "../utils/enums";
import ExploreCourseList from "./exploreCourseList/ExploreCourseList";
import {
  ECE_AREAS,
  MINORS,
  CERTIFICATES,
  MINOR,
  CERTIFICATE,
} from "../utils/constants";

const Explore = () => {
  const [courseData, setCourseData] = useState([]);
  const [fetchCourseDataError, setFetchCourseDataError] = useState("");
  const FETCH_COURSES_ERROR_MESSAGE = "Something went wrong fetching courses";
  const RECOMMENDED = "Recommended";
  const MINOR_TITLE = "Minor: ";
  const CERTIFICATE_TITLE = "Certificate: ";
  const COURSE_CODE = "Code: ";
  const COURSE_CODES = ["APS", "BME", "ECE", "CSC"];

  const filterByEceArea = (courseAreas, area) => {
    return courseAreas.includes(area);
  };

  const filterByMinorOrCertificate = (
    courseMinorsCertificates,
    minorOrCertificate,
    minorCertificateTitle
  ) => {
    return courseMinorsCertificates.some(
      (minorCertificate) =>
        minorCertificate.minorOrCertificate === minorOrCertificate &&
        minorCertificate.title === minorCertificateTitle
    );
  };

  const filterByCourseCode = (courseCode, codeToFilterBy) => {
    return courseCode.includes(codeToFilterBy);
  };

  const eceAreaFilters = Object.keys(ECE_AREAS).map((area) => {
    return {
      title: ECE_AREAS[area],
      selector: (course) => filterByEceArea(course.area, area),
    };
  });

  const minorFilters = MINORS.map((minor) => {
    return {
      title: `${MINOR_TITLE}${minor}`,
      selector: (course) =>
        filterByMinorOrCertificate(course.minorsCertificates, MINOR, minor),
    };
  });

  const certificateFilters = CERTIFICATES.map((certificate) => {
    return {
      title: `${CERTIFICATE_TITLE}${certificate}`,
      selector: (course) =>
        filterByMinorOrCertificate(
          course.minorsCertificates,
          CERTIFICATE,
          certificate
        ),
    };
  });

  const courseCodeFilters = COURSE_CODES.map((code) => {
    return {
      title: `${COURSE_CODE}${code}`,
      selector: (course) => filterByCourseCode(course.code, code),
    };
  });

  const filters = [
    {
      title: "All Courses",
      selector: () => true,
    },
    ...eceAreaFilters,
    ...minorFilters,
    ...certificateFilters,
    ...courseCodeFilters,
  ];

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

  useEffect(() => {
    fetchAllCourseData();
  }, []);

  return (
    <div className="explore-container">
      {courseData.length !== 0 ? (
        <>
          <section className="explore-filters-container"></section>
          <section>
            <h2 className="explore-recommend-header">{RECOMMENDED}</h2>
          </section>
          {filters.map((filter, index) => (
            <section key={index}>
              <h2 className="explore-filter-header">{filter.title}</h2>
              <ExploreCourseList
                courses={courseData.filter((course) => filter.selector(course))}
              />
            </section>
          ))}
        </>
      ) : (
        <h2 className="explore-error">{fetchCourseDataError}</h2>
      )}
    </div>
  );
};

export default Explore;
