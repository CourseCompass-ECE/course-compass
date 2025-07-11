import { useRef, useState } from "react";
import {
  ECE_AREAS,
  MINOR,
  CERTIFICATE,
  CART_PATH,
  FAVORITES_PATH,
  ID_QUERY_PARAM,
  CODE,
} from "../../utils/constants";
import { Path } from "../../utils/enums";
import { sortByFavorites } from "../../utils/sort";

const ExploreCourse = (props) => {
  const refList = useRef([]);
  const [changeCartError, setChangeCartError] = useState("");
  const [changeCartErrorId, setChangeCartErrorId] = useState(null);
  const [changeFavoritesError, setChangeFavoritesError] = useState("");
  const [changeFavoritesErrorId, setChangeFavoritesErrorId] = useState(null);

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
  const CHANGE_CART_ERROR_MESSAGE = "Error updating shopping cart";
  const CHANGE_FAVORITES_ERROR_MESSAGE = "Error updating favorites";

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

  const toggleCourseInCart = async (courseId) => {
    setChangeCartError("");
    setChangeFavoritesError("");
    setChangeCartErrorId(null);
    setChangeFavoritesErrorId(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${
          Path.EXPLORE
        }${CART_PATH}${ID_QUERY_PARAM}${courseId}`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        props.setCourseData(data?.course);
      } else {
        setChangeCartError(CHANGE_CART_ERROR_MESSAGE);
        setChangeCartErrorId(courseId);
      }
    } catch (error) {
      setChangeCartError(CHANGE_CART_ERROR_MESSAGE);
      setChangeCartErrorId(courseId);
    }
  };

  const toggleCourseInFavorites = async (courseId) => {
    setChangeCartError("");
    setChangeFavoritesError("");
    setChangeCartErrorId(null);
    setChangeFavoritesErrorId(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${
          Path.EXPLORE
        }${FAVORITES_PATH}${ID_QUERY_PARAM}${courseId}`,
        {
          method: "PATCH",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        props.setCourseData(data?.course);
      } else {
        setChangeFavoritesError(CHANGE_FAVORITES_ERROR_MESSAGE);
        setChangeFavoritesErrorId(courseId);
      }
    } catch (error) {
      setChangeFavoritesError(CHANGE_FAVORITES_ERROR_MESSAGE);
      setChangeFavoritesErrorId(courseId);
    }
  };

  return (
    <div
      className="explore-course-outer-container"
      onMouseLeave={() =>
        refList.current[props.index].classList.remove(ANIMATION_CLASS)
      }
      ref={(ref) => {
        props.courseOuterContainerRefList.current[props.index] = ref;
      }}
    >
      <article
        ref={(ref) => {
          refList.current[props.index] = ref;
        }}
        className="explore-course-container"
      >
        <div className="explore-course-front">
          <div className="explore-course-icon-container">
            <span
              className="material-symbols-outlined explore-course-icon cart-icon"
              onClick={() => toggleCourseInCart(props.course.id)}
            >
              {!props.course.inUserShoppingCart
                ? "add_shopping_cart"
                : "remove_shopping_cart"}
            </span>
            {/* TODO: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?tab=t.0 */}
            <span
              className={`material-symbols-outlined explore-course-icon favorite-icon ${
                props.course.inUserFavorites ? "favorited" : ""
              }`}
              onClick={() => toggleCourseInFavorites(props.course.id)}
            >
              star
            </span>
          </div>
          <div className="text-input-error explore-cart-error">
            {changeCartErrorId === props.course.id ? changeCartError : ""}
            {changeFavoritesErrorId === props.course.id
              ? changeFavoritesError
              : ""}
          </div>

          <h3 className="explore-course-title">{props.course.title}</h3>
          <h4 className="explore-course-heading">
            {CODE}
            <span className="explore-course-heading-item">
              {props.course.code}
            </span>
          </h4>

          <h4 className="explore-course-heading" style={{ paddingBottom: 0 }}>
            {AREAS}
            <span className="explore-course-heading-item">
              {props.course.area.length === 0 ? NONE : ""}
            </span>
            <ul className="explore-course-area-ul">
              {props.course.area.map((area, index) => (
                <li key={index} className="explore-course-area-li">
                  {ECE_AREAS[area]}
                </li>
              ))}
            </ul>
          </h4>

          {renderMinorOrCertificate(props.course, MINOR)}
          {renderMinorOrCertificate(props.course, CERTIFICATE)}

          {renderCourseRequirements(props.course.prerequisites, PREREQUISITES)}
          {renderCourseRequirements(props.course.corequisites, COREQUISITES)}
          {renderCourseRequirements(props.course.exclusions, EXCLUSIONS)}
          {renderCourseRequirements(
            props.course.recommendedPrep,
            RECOMMENDED_PREP
          )}

          <div className="explore-course-description-front-container">
            <p className="explore-course-description-front">
              {props.course.description}
            </p>
          </div>
          <h4
            className="explore-course-view-description"
            onMouseEnter={() =>
              refList.current[props.index].classList.add(ANIMATION_CLASS)
            }
          >
            {VIEW_FULL_DESCRIPTION}
          </h4>
          <div className="explore-classes-container">
            {renderClassHours(LECTURE, props.course.lectureHours)}
            {renderClassHours(TUTORIAL, props.course.tutorialHours)}
            {renderClassHours(PRACTICAL, props.course.practicalHours)}
          </div>
        </div>

        <div className="explore-course-back">
          <h3 className="explore-course-heading">{COURSE_DESCRIPTION}</h3>
          <p className="explore-course-description">
            {props.course.description}
          </p>
        </div>
      </article>
    </div>
  );
};

export default ExploreCourse;
