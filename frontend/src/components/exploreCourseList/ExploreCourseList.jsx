import { useRef, useState } from "react";
import ExploreCourse from "./ExploreCourse";

const ExploreCourseList = (props) => {
  const [elementScrolledTo, setElementScrolledTo] = useState(0);
  const courseOuterContainerRefList = useRef([]);
  const courseContainerRef = useRef();

  const changeScroll = (increment) => {
    const newElementIndex = elementScrolledTo + increment;
    if (newElementIndex < 0 || newElementIndex >= props.courses.length) return;

    courseContainerRef.current.scrollTo({
      left: courseOuterContainerRefList.current[newElementIndex].offsetLeft,
      behavior: "smooth",
    });
    setElementScrolledTo(newElementIndex);
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
          <ExploreCourse
            key={index}
            index={index}
            course={course}
            fetchAllCourseData={props.fetchAllCourseData}
            courseOuterContainerRefList={courseOuterContainerRefList}
          />
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
