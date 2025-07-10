import DropdownItems from "../components/DropdownItems";
import { ERROR_MESSAGE_MARGIN_TOP, KERNEL_TEXT, DEPTH_TEXT } from "./constants";
const KERNEL_DEPTH_MARGIN_TOP = "5px";

const RenderDropdownMenu = (props) => {
  return (
    <div className="text-input-container dropdown-container">
      <select
        value=""
        className="text-input dropdown-input"
        onChange={(event) =>
          props.setItems([...props.currentItems, event.target.value])
        }
      >
        <option value="" disabled>
          {props.placeholderText}
        </option>
        {!Array.isArray(props.menuItems)
          ? Object.entries(props.menuItems)
              .filter(([key]) => !props.currentItems.includes(key))
              .map(([key, value], index) => (
                <option key={index} value={key}>
                  {value}
                </option>
              ))
          : props.menuItems
              .filter((item) => !props.currentItems.includes(item))
              .map((item, index) => (
                <option key={index} value={item}>
                  {item}
                </option>
              ))}
      </select>

      <DropdownItems
        selectedItems={props.currentItems}
        allItems={props.menuItems}
        removeItem={props.removeItem}
      />

      <span
        className={`text-input-error ${props.placeholderText === KERNEL_TEXT || props.placeholderText === DEPTH_TEXT ? "kernel-depth-error" : ""}`}
        style={
          props.currentItems.length > 0
            ? { marginTop: props.placeholderText !== KERNEL_TEXT && props.placeholderText !== DEPTH_TEXT ? ERROR_MESSAGE_MARGIN_TOP : KERNEL_DEPTH_MARGIN_TOP }
            : {}
        }
      >
        {props.errorMessage}
      </span>
    </div>
  );
};

export default RenderDropdownMenu;
