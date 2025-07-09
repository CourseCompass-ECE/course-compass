import DropdownItems from "../DropdownItems";
import {
  ECE_AREAS,
  SKILLS,
  INTERESTS,
  ERROR_MESSAGE_MARGIN_TOP,
} from "../../utils/constants";
import { useState } from "react";

const CreateAccountStepThree = (props) => {
  const [eceAreasError, setEceAreasError] = useState("");
  const [interestsError, setInterestsError] = useState("");
  const [skillsError, setSkillsError] = useState("");

  const STEP_TITLE = "Share Your Interests + Current Skills";
  const ECE_AREAS_TEXT = "ECE Areas (minimum of 2)";
  const INTERESTS_TEXT = "Interests (minimum of 5)";
  const SKILLS_TEXT = "Skills (minimum of 5)";
  const ECE_AREAS_ERROR_MESSAGE = "Please add a minimum of 2 ECE areas";
  const INTERESTS_ERROR_MESSAGE = "Please add a minimum of 5 interests";
  const SKILLS_ERROR_MESSAGE = "Please add a minimum of 5 skills";

  const handleRemoveEceArea = (eceAreaKey) => {
    props.setEceAreas(props.eceAreas.filter((area) => area !== eceAreaKey));
  };

  const handleRemoveInterest = (interestToRemove) => {
    props.setInterests(
      props.interests.filter((interest) => interest !== interestToRemove)
    );
  };

  const handleRemoveSkill = (skillToRemove) => {
    props.setSkills(props.skills.filter((skill) => skill !== skillToRemove));
  };

  const submitStepThree = (event) => {
    event.preventDefault();
    setEceAreasError("");
    setInterestsError("");
    setSkillsError("");

    if (props.eceAreas.length < 2) {
      setEceAreasError(ECE_AREAS_ERROR_MESSAGE);
      return;
    } else if (props.interests.length < 5) {
      setInterestsError(INTERESTS_ERROR_MESSAGE);
      return;
    } else if (props.skills.length < 5) {
      setSkillsError(SKILLS_ERROR_MESSAGE);
      return;
    }

    props.setCurrentStep(props.currentStep + 1);
  };

  const renderDropdownMenu = (
    setItems,
    currentItems,
    placeholderText,
    menuItems,
    removeItem,
    errorMessage
  ) => {
    return (
      <div className="text-input-container dropdown-container">
        <select
          value=""
          className="text-input dropdown-input"
          onChange={(event) => setItems([...currentItems, event.target.value])}
        >
          <option value="" disabled>
            {placeholderText}
          </option>
          {!Array.isArray(menuItems)
            ? Object.entries(menuItems)
                .filter(([key]) => !currentItems.includes(key))
                .map(([key, value], index) => (
                  <option key={index} value={key}>
                    {value}
                  </option>
                ))
            : menuItems.filter(
                (item) => !currentItems.includes(item)
              ).map((item, index) => (
                <option key={index} value={item}>
                  {item}
                </option>
              ))}
        </select>

        <DropdownItems
          selectedItems={currentItems}
          allItems={menuItems}
          removeItem={removeItem}
        />

        <span
          className="text-input-error"
          style={
            currentItems.length > 0
              ? { marginTop: ERROR_MESSAGE_MARGIN_TOP }
              : {}
          }
        >
          {errorMessage}
        </span>
      </div>
    );
  };

  return (
    <form
      className="create-account-form"
      onSubmit={(event) => submitStepThree(event)}
    >
      <h1 className="create-account-form-title">{STEP_TITLE}</h1>
      {renderDropdownMenu(
        props.setEceAreas,
        props.eceAreas,
        ECE_AREAS_TEXT,
        ECE_AREAS,
        handleRemoveEceArea,
        eceAreasError
      )}

      {renderDropdownMenu(
        props.setInterests,
        props.interests,
        INTERESTS_TEXT,
        INTERESTS,
        handleRemoveInterest,
        interestsError
      )}

      {renderDropdownMenu(
        props.setSkills,
        props.skills,
        SKILLS_TEXT,
        SKILLS,
        handleRemoveSkill,
        skillsError
      )}

      <div className="text-input-container create-account-btn">
        <button type="submit" className="form-btn">
          Continue
        </button>
      </div>
    </form>
  );
};

export default CreateAccountStepThree;
