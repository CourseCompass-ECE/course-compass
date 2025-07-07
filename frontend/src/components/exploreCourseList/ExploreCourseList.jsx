import { useRef, useState } from "react";
import { ECE_AREAS, MINOR, CERTIFICATE } from "../../utils/constants";

const ExploreCourseList = (props) => {
  const [elementScrolledTo, setElementScrolledTo] = useState(0);
  const courseOuterContainerRefList = useRef([]);
  const refList = useRef([]);
  const courseContainerRef = useRef();
  const CODE = "Code: ";
  const AREAS = "Areas: ";
  const MINORS = "Minors: ";
  const CERTIFICATES = "Certificates: ";
  const PREREQUISITES = "Prerequisites: ";
  const COREQUISITES = "Corequisites: ";
  const EXCLUSIONS = "Exclusions: ";
  const RECOMMENDED_PREP = "Recommended Preparation:";
  const NONE = "None";
  const COURSE_DESCRIPTION = "Course Description:";
  const VIEW_FULL_DESCRIPTION = "View Full Description";
  const ANIMATION_CLASS = "explore-course-container-animation";
  const LECTURE_COLOR = "#F3E8DC";
  const TUTORIAL_COLOR = "#E6F4EA";
  const PRACTICAL_COLOR = "#D8C7E9";
  const LECTURE = "LEC";
  const TUTORIAL = "TUT";
  const PRACTICAL = "PRA";

  const changeScroll = (increment) => {
    const newElementIndex = elementScrolledTo + increment;
    if (newElementIndex < 0 || newElementIndex >= props.courses.length) return;

    courseContainerRef.current.scrollTo({
      left: courseOuterContainerRefList.current[newElementIndex].offsetLeft,
      behavior: "smooth",
    });
    setElementScrolledTo(newElementIndex);
  };

  const renderClassHours = (classType, hours) => {
    let backgroundColor;
    switch (classType) {
      case LECTURE:
        backgroundColor = LECTURE_COLOR;
        break;
      case TUTORIAL:
        backgroundColor = TUTORIAL_COLOR;
        break;
      case PRACTICAL:
        backgroundColor = PRACTICAL_COLOR;
        break;
    }

    return (
      <div
        className="explore-classes"
        style={{ backgroundColor: backgroundColor }}
      >
        {classType}: {hours}hrs
      </div>
    );
  };

  const renderCourseRequirements = (reqList, reqType) => {
    return (
      <h4 className="explore-course-heading" style={{ paddingBottom: 0 }}>
        {reqType}
        <span className="explore-course-heading-item">
          {reqList.length === 0 ? ` ${NONE}` : ""}
        </span>
        <ul className="explore-course-area-ul">
          {reqList.map((prereq, index) => (
            <li key={index} className="explore-course-area-li">
              {prereq.code}: {prereq.title}
            </li>
          ))}
        </ul>
      </h4>
    );
  };

  const renderMinorOrCertificate = (course, minorOrCertificate) => {
    return (
      <h4 className="explore-course-heading" style={{ paddingBottom: 0 }}>
        {minorOrCertificate === MINOR ? MINORS : CERTIFICATES}
        <span className="explore-course-heading-item">
          {course.minorsCertificates.filter(
            (minorCertificate) =>
              minorCertificate.minorOrCertificate === minorOrCertificate
          ).length === 0
            ? NONE
            : ""}
        </span>
        <ul className="explore-course-area-ul">
          {course.minorsCertificates
            .filter(
              (minorCertificate) =>
                minorCertificate.minorOrCertificate === minorOrCertificate
            )
            .map((minorCertificate, index) => (
              <li key={index} className="explore-course-area-li">
                {minorCertificate.title}
              </li>
            ))}
        </ul>
      </h4>
    );
  };

  return (
    <div className="explore-course-list-container">
      <span
        className="material-symbols-outlined explore-arrow"
        onClick={() => changeScroll(-1)}
      >
        arrow_left
      </span>
      <div className="explore-course-list" ref={courseContainerRef}>
        {props.courses.map((course, index) => (
          <div
            className="explore-course-outer-container"
            key={index}
            onMouseLeave={() =>
              refList.current[index].classList.remove(ANIMATION_CLASS)
            }
            ref={(ref) => {
              courseOuterContainerRefList.current[index] = ref;
            }}
          >
            <article
              ref={(ref) => {
                refList.current[index] = ref;
              }}
              className="explore-course-container"
            >
              <div className="explore-course-front">
                <div className="explore-course-icon-container">
                  {/* TODO: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?tab=t.0 */}
                  <span className="material-symbols-outlined explore-course-icon cart-icon">
                    {true ? "add_shopping_cart" : "remove_shopping_cart"}
                  </span>
                  {/* TODO: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?tab=t.0 */}
                  <span
                    className={`material-symbols-outlined explore-course-icon favorite-icon ${
                      false ? "favorited" : ""
                    }`}
                  >
                    star
                  </span>
                </div>

                <h3 className="explore-course-title">{course.title}</h3>
                <h4 className="explore-course-heading">
                  {CODE}
                  <span className="explore-course-heading-item">
                    {course.code}
                  </span>
                </h4>

                <h4
                  className="explore-course-heading"
                  style={{ paddingBottom: 0 }}
                >
                  {AREAS}
                  <ul className="explore-course-area-ul">
                    {course.area.map((area, index) => (
                      <li key={index} className="explore-course-area-li">
                        {ECE_AREAS[area]}
                      </li>
                    ))}
                  </ul>
                </h4>

                {renderMinorOrCertificate(course, MINOR)}
                {renderMinorOrCertificate(course, CERTIFICATE)}

                {renderCourseRequirements(course.prerequisites, PREREQUISITES)}
                {renderCourseRequirements(course.corequisites, COREQUISITES)}
                {renderCourseRequirements(course.exclusions, EXCLUSIONS)}
                {renderCourseRequirements(course.recommendedPrep, RECOMMENDED_PREP)}

                <div className="explore-course-description-front-container">
                  <p className="explore-course-description-front">
                    {course.description}
                  </p>
                </div>
                <h4
                  className="explore-course-view-description"
                  onMouseEnter={() =>
                    refList.current[index].classList.add(ANIMATION_CLASS)
                  }
                >
                  {VIEW_FULL_DESCRIPTION}
                </h4>
                <div className="explore-classes-container">
                  {renderClassHours(LECTURE, course.lectureHours)}
                  {renderClassHours(TUTORIAL, course.tutorialHours)}
                  {renderClassHours(PRACTICAL, course.practicalHours)}
                </div>
              </div>

              <div className="explore-course-back">
                <h3 className="explore-course-heading">{COURSE_DESCRIPTION}</h3>
                <p className="explore-course-description">
                  {course.description}
                </p>
              </div>
            </article>
          </div>
        ))}
      </div>
      <span
        className="material-symbols-outlined explore-arrow explore-right-arrow"
        onClick={() => changeScroll(1)}
      >
        arrow_right
      </span>
    </div>
  );
};

export default ExploreCourseList;
