import { useState, useRef } from "react";
import { changeScroll } from "../utils/changeScroll";

const DropdownItems = (props) => {
  const [elementScrolledTo, setElementScrolledTo] = useState(0);
  const courseOuterContainerRefList = useRef([]);
  const courseContainerRef = useRef();

  return (
    <div className="dropdown-items-outer-container">
      <span
        className="material-symbols-outlined dropdown-arrow dropdown-arrow-left"
        style={props.selectedItems.length === 0 ? { display: "none" } : {}}
        onClick={() =>
          changeScroll(
            -1,
            courseContainerRef,
            courseOuterContainerRefList,
            elementScrolledTo,
            setElementScrolledTo,
            props.selectedItems.length
          )
        }
      >
        arrow_left
      </span>
      <div className="dropdown-items-container" ref={courseContainerRef}>
        {props.selectedItems.map((item, index) => (
          <div
            className="dropdown-item-container"
            key={index}
            ref={(ref) => {
              courseOuterContainerRefList.current[index] = ref;
            }}
          >
            {!Array.isArray(props.allItems) ? props.allItems[item] : item}
            <span
              className="material-symbols-outlined dropdown-item-x"
              onClick={() => props.removeItem(item)}
            >
              close_small
            </span>
          </div>
        ))}
      </div>
      <span
        className="material-symbols-outlined dropdown-arrow dropdown-arrow-right"
        style={props.selectedItems.length === 0 ? { display: "none" } : {}}
        onClick={() =>
          changeScroll(
            1,
            courseContainerRef,
            courseOuterContainerRefList,
            elementScrolledTo,
            setElementScrolledTo,
            props.selectedItems.length
          )
        }
      >
        arrow_right
      </span>
    </div>
  );
};

export default DropdownItems;
