import DropdownItems from "../DropdownItems";
import { ECE_AREAS, SKILLS, INTERESTS, ERROR_MESSAGE_MARGIN_TOP } from "../../utils/constants";
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

  return (
    <form
      className="create-account-form"
      onSubmit={(event) => submitStepThree(event)}
    >
      <h1 className="create-account-form-title">{STEP_TITLE}</h1>
      <div className="text-input-container dropdown-container">
        <select
          value=""
          className="text-input dropdown-input"
          onChange={(event) =>
            props.setEceAreas([...props.eceAreas, event.target.value])
          }
        >
          <option value="" disabled>
            {ECE_AREAS_TEXT}
          </option>
          {Object.entries(ECE_AREAS)
            .filter(([key]) => !props.eceAreas.includes(key))
            .map(([key, value], index) => (
              <option key={index} value={key}>
                {value}
              </option>
            ))}
        </select>

        <DropdownItems
          selectedItems={props.eceAreas}
          allItems={ECE_AREAS}
          removeItem={handleRemoveEceArea}
          isEceAreaDropdown={true}
        />

        <span
          className="text-input-error"
          style={
            props.eceAreas.length > 0
              ? { marginTop: ERROR_MESSAGE_MARGIN_TOP }
              : {}
          }
        >
          {eceAreasError}
        </span>
      </div>

      <div className="text-input-container dropdown-container">
        <select
          value=""
          className="text-input dropdown-input"
          onChange={(event) =>
            props.setInterests([...props.interests, event.target.value])
          }
        >
          <option value="" disabled>
            {INTERESTS_TEXT}
          </option>
          {INTERESTS.filter(
            (interest) => !props.interests.includes(interest)
          ).map((interest, index) => (
            <option key={index} value={interest}>
              {interest}
            </option>
          ))}
        </select>

        <DropdownItems
          selectedItems={props.interests}
          allItems={INTERESTS}
          removeItem={handleRemoveInterest}
          isEceAreaDropdown={false}
        />

        <span
          className="text-input-error"
          style={
            props.interests.length > 0
              ? { marginTop: ERROR_MESSAGE_MARGIN_TOP }
              : {}
          }
        >
          {interestsError}
        </span>
      </div>

      <div className="text-input-container dropdown-container">
        <select
          value=""
          className="text-input dropdown-input"
          onChange={(event) =>
            props.setSkills([...props.skills, event.target.value])
          }
        >
          <option value="" disabled>
            {SKILLS_TEXT}
          </option>
          {SKILLS.filter((skill) => !props.skills.includes(skill)).map(
            (skill, index) => (
              <option key={index} value={skill}>
                {skill}
              </option>
            )
          )}
        </select>

        <DropdownItems
          selectedItems={props.skills}
          allItems={SKILLS}
          removeItem={handleRemoveSkill}
          isEceAreaDropdown={false}
        />

        <span
          className="text-input-error"
          style={
            props.skills.length > 0
              ? { marginTop: ERROR_MESSAGE_MARGIN_TOP }
              : {}
          }
        >
          {skillsError}
        </span>
      </div>

      <div className="text-input-container create-account-btn">
        <button type="submit" className="form-btn">
          Continue
        </button>
      </div>
    </form>
  );
};

export default CreateAccountStepThree;
