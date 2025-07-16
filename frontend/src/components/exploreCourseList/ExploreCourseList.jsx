import { useRef, useState } from "react";
import ExploreCourse from "./ExploreCourse";
import { changeScroll } from "../../utils/changeScroll";

const ExploreCourseList = (props) => {
  const [elementScrolledTo, setElementScrolledTo] = useState(0);
  const courseOuterContainerRefList = useRef([]);
  const courseContainerRef = useRef();

  return (
    <div className="explore-course-list-container">
      <span
        className="material-symbols-outlined explore-arrow"
        onClick={() =>
          changeScroll(
            -1,
            courseContainerRef,
            courseOuterContainerRefList,
            elementScrolledTo,
            setElementScrolledTo,
            props.courses.length
          )
        }
      >
        arrow_left
      </span>
      <div className="explore-course-list" ref={courseContainerRef}>
        {props.courses.map((course, index) => (
          <ExploreCourse
            key={index}
            index={index}
            course={course}
            courseOuterContainerRefList={courseOuterContainerRefList}
            setCourseData={props.setCourseData}
          />
        ))}
      </div>
      <span
        className="material-symbols-outlined explore-arrow explore-right-arrow"
        onClick={() =>
          changeScroll(
            1,
            courseContainerRef,
            courseOuterContainerRefList,
            elementScrolledTo,
            setElementScrolledTo,
            props.courses.length
          )
        }
      >
        arrow_right
      </span>
    </div>
  );
};

export default ExploreCourseList;
