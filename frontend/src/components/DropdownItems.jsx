const DropdownItems = (props) => {
  return (
    <div className="dropdown-items-container">
      {props.selectedItems.map((item, index) => (
        <div className="dropdown-item-container" key={index}>
          {props.isEceAreaDropdown ? props.allItems[item] : item}
          <span className="material-symbols-outlined dropdown-item-x" onClick={() => props.removeItem(item)}>close_small</span>
        </div>
      ))}
    </div>
  );
};

export default DropdownItems;
