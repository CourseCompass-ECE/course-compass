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
  RECOMMENDATIONS_PATH,
} from "../utils/constants";
import { sortByFavorites } from "../utils/sort";

const Explore = () => {
  const [courseData, setCourseData] = useState([]);
  const [fetchCourseDataError, setFetchCourseDataError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [selectedEceArea, setSelectedEceArea] = useState("");
  const [selectedMinor, setSelectedMinor] = useState("");
  const [selectedCertificate, setSelectedCertificate] = useState("");
  const [selectedCode, setSelectedCode] = useState("");
  const [recommendedCourses, setRecommendedCourses] = useState(null);
  const [recommendedError, setRecommendedError] = useState("");
  const FETCH_COURSES_ERROR_MESSAGE = "Something went wrong fetching courses";
  const RECOMMEND_COURSES_ERROR =
    "Something went wrong fetching recommendations";
  const RECOMMENDED = "Recommended";
  const MINOR_TITLE = "Minor: ";
  const CERTIFICATE_TITLE = "Certificate: ";
  const COURSE_CODE = "Code: ";
  const COURSE_CODES = ["APS", "BME", "ECE", "CSC"];
  const KEYWORD_SEARCH_PLACEHOLDER = "Keyword search";
  const ECE_AREA_DROPDOWN_PLACEHOLDER = "All ECE Areas";
  const MINOR_DROPDOWN_PLACEHOLDER = "All Minors";
  const CERTIFICATE_DROPDOWN_PLACEHOLDER = "All Certificates";
  const CODE_DROPDOWN_PLACEHOLDER = "All Codes";

  const updateCourseData = (updatedCourse) => {
    setCourseData(
      courseData?.map((course) =>
        course.id === updatedCourse.id ? updatedCourse : course
      )
    );
    fetchRecommendedCourses();
  };

  const updateRecommendations = (updatedCourse) => {
    let newRecommendedCourses = recommendedCourses?.filter(
      (course) => course.id !== updatedCourse.id
    );
    if (newRecommendedCourses?.length === 0) {
      fetchRecommendedCourses();
    } else {
      setRecommendedCourses(newRecommendedCourses);
    }
    fetchAllCourseData();
  };

  const filterByTitle = (title) => {
    if (
      selectedMinor &&
      title.includes(MINOR_TITLE) &&
      MINOR_TITLE + selectedMinor !== title
    ) {
      return false;
    } else if (
      selectedCertificate &&
      title.includes(CERTIFICATE_TITLE) &&
      CERTIFICATE_TITLE + selectedCertificate !== title
    ) {
      return false;
    } else if (
      selectedEceArea &&
      !title.includes(MINOR_TITLE) &&
      !title.includes(CERTIFICATE_TITLE) &&
      !title.includes(COURSE_CODE) &&
      selectedEceArea !== title
    ) {
      return false;
    } else if (
      selectedCode &&
      title.includes(COURSE_CODE) &&
      COURSE_CODE + selectedCode !== title
    ) {
      return false;
    }

    return true;
  };

  const filterCourseBySearch = (course) => {
    const lowerCaseSearchInput = searchInput.toLowerCase().trim();
    return (
      course.title.toLowerCase().includes(lowerCaseSearchInput) ||
      course.code.toLowerCase().includes(lowerCaseSearchInput) ||
      course.description.toLowerCase().includes(lowerCaseSearchInput) ||
      course.area.some((area) =>
        ECE_AREAS[area].toLowerCase().includes(lowerCaseSearchInput)
      )
    );
  };

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

  const filterRecommendations = (course) => {
    return (
      (!searchInput.trim() || filterCourseBySearch(course)) &&
      (!selectedEceArea ||
        course.area.some((area) => ECE_AREAS[area] === selectedEceArea)) &&
      (!selectedMinor ||
        filterByMinorOrCertificate(
          course.minorsCertificates,
          MINOR,
          selectedMinor
        )) &&
      (!selectedCertificate ||
        filterByMinorOrCertificate(
          course.minorsCertificates,
          CERTIFICATE,
          selectedCertificate
        )) &&
      (!selectedCode || filterByCourseCode(course.code, selectedCode))
    );
  };

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

  const fetchRecommendedCourses = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${
          Path.EXPLORE
        }${RECOMMENDATIONS_PATH}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRecommendedCourses(data?.recommendedCourses);
      } else {
        setRecommendedError(RECOMMEND_COURSES_ERROR);
      }
    } catch (error) {
      setRecommendedError(RECOMMEND_COURSES_ERROR);
    }
  };

  useEffect(() => {
    fetchRecommendedCourses();
    fetchAllCourseData();
  }, []);

  return (
    <div className="explore-container">
      {courseData.length !== 0 ? (
        <>
          <section className="explore-filters-container">
            <div className="text-input-container search-bar">
              <span
                className="material-symbols-outlined"
                style={{ fontSize: "var(--subheader-size)" }}
              >
                search
              </span>
              <input
                type="text"
                className="text-input explore-filters-width explore-search-input"
                placeholder={KEYWORD_SEARCH_PLACEHOLDER}
                value={searchInput}
                maxLength={50}
                onChange={(event) => setSearchInput(event.target.value)}
              />
            </div>

            <select
              value={selectedEceArea}
              className="text-input email-topic-dropdown"
              onChange={(event) => setSelectedEceArea(event.target.value)}
            >
              <option value="">{ECE_AREA_DROPDOWN_PLACEHOLDER}</option>
              {Object.keys(ECE_AREAS).map((area, index) => (
                <option key={index} value={ECE_AREAS[area]}>
                  {ECE_AREAS[area]}
                </option>
              ))}
            </select>

            <select
              value={selectedMinor}
              className="text-input email-topic-dropdown explore-filters-width"
              onChange={(event) => setSelectedMinor(event.target.value)}
            >
              <option value="">{MINOR_DROPDOWN_PLACEHOLDER}</option>
              {MINORS.map((minor, index) => (
                <option key={index} value={minor}>
                  {minor}
                </option>
              ))}
            </select>

            <select
              value={selectedCertificate}
              className="text-input email-topic-dropdown explore-filters-width"
              onChange={(event) => setSelectedCertificate(event.target.value)}
            >
              <option value="">{CERTIFICATE_DROPDOWN_PLACEHOLDER}</option>
              {CERTIFICATES.map((certificate, index) => (
                <option key={index} value={certificate}>
                  {certificate}
                </option>
              ))}
            </select>

            <select
              value={selectedCode}
              className="text-input email-topic-dropdown explore-filters-width"
              style={{ width: "8vw" }}
              onChange={(event) => setSelectedCode(event.target.value)}
            >
              <option value="">{CODE_DROPDOWN_PLACEHOLDER}</option>
              {COURSE_CODES.map((code, index) => (
                <option key={index} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </section>

          <section>
            <h2 className="explore-recommend-header">{RECOMMENDED}</h2>
            {recommendedCourses?.length > 0 ? (
              <ExploreCourseList
                setCourseData={updateRecommendations}
                courses={recommendedCourses?.filter((course) =>
                  filterRecommendations(course)
                )}
              />
            ) : (
              <div className="loader-container">
                {Array.isArray(recommendedCourses) ? (
                  <h3 className="loader-text">No recommendations left - all courses in shopping cart</h3>
                ) : (
                  <>
                    <div className="loader"></div>
                    <h3 className="loader-text">
                      Loading recommended courses...
                    </h3>
                  </>
                )}
              </div>
            )}
            <span className="recommendation-error">{recommendedError}</span>
          </section>

          {searchInput.trim() ? (
            <section>
              <h2 className="explore-filter-header">{`"${searchInput.trim()}"`}</h2>
              <ExploreCourseList
                setCourseData={updateCourseData}
                courses={courseData.filter((course) =>
                  filterCourseBySearch(course)
                )}
              />
            </section>
          ) : null}

          {filters
            .filter((filter) => filterByTitle(filter.title))
            .map((filter, index) => (
              <section key={index}>
                <h2 className="explore-filter-header">{filter.title}</h2>
                <ExploreCourseList
                  setCourseData={updateCourseData}
                  courses={courseData.filter((course) =>
                    filter.selector(course)
                  )}
                />
              </section>
            ))}
        </>
      ) : (
        <h1 className="explore-error">{fetchCourseDataError}</h1>
      )}
    </div>
  );
};

export default Explore;
