import { ECE_AREAS, SKILLS, INTERESTS, CONTINUE } from "../../utils/constants";
import { useState } from "react";
import RenderDropdownMenu from "../../utils/renderDropdown";
import CreateAccountButton from "./CreateAccountButton";

const CreateAccountStepFourSkillsInterests = (props) => {
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

  const submitStepFour = (event) => {
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
      onSubmit={(event) => submitStepFour(event)}
    >
      <h1 className="create-account-form-title">{STEP_TITLE}</h1>
      <RenderDropdownMenu
        setItems={props.setEceAreas}
        currentItems={props.eceAreas}
        placeholderText={ECE_AREAS_TEXT}
        menuItems={ECE_AREAS}
        removeItem={handleRemoveEceArea}
        errorMessage={eceAreasError}
      />

      <RenderDropdownMenu
        setItems={props.setInterests}
        currentItems={props.interests}
        placeholderText={INTERESTS_TEXT}
        menuItems={INTERESTS}
        removeItem={handleRemoveInterest}
        errorMessage={interestsError}
      />

      <RenderDropdownMenu
        setItems={props.setSkills}
        currentItems={props.skills}
        placeholderText={SKILLS_TEXT}
        menuItems={SKILLS}
        removeItem={handleRemoveSkill}
        errorMessage={skillsError}
      />

      <CreateAccountButton buttonText={CONTINUE} />
    </form>
  );
};

export default CreateAccountStepFourSkillsInterests;
