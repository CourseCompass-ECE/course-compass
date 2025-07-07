import { useRef, useState } from "react";

const ExploreCourseList = (props) => {
  const [elementScrolledTo, setElementScrolledTo] = useState(0);
  const refList = useRef([]);
  const courseContainerRef = useRef();

  const changeScroll = (increment) => {
    const newElementIndex = elementScrolledTo + increment;
    if (newElementIndex < 0 || newElementIndex >= props.courses.length) return;

    courseContainerRef.current.scrollTo({
      left: refList.current[newElementIndex].offsetLeft,
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
          <article
            ref={(ref) => {
              refList.current[index] = ref;
            }}
            key={index}
            className="explore-course-container"
          >
            <div className="explore-course-icon-container">
              {/* TODO: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?tab=t.0 */}
              <span class="material-symbols-outlined explore-course-icon cart-icon">
                {true ? "add_shopping_cart" : "remove_shopping_cart"}
              </span>
              {/* TODO: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?tab=t.0 */}
              <span class={`material-symbols-outlined explore-course-icon favorite-icon ${false ? "favorited" : ""}`}>star</span>
            </div>
            <h3 className="explore-course-title">{course.title}</h3>
          </article>
        ))}
      </div>
      <span
        className="material-symbols-outlined explore-arrow"
        onClick={() => changeScroll(1)}
      >
        arrow_right
      </span>
    </div>
  );
};

export default ExploreCourseList;
