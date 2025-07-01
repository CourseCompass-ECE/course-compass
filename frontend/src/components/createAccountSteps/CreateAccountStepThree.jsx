import DropdownItems from "../DropdownItems";
import { ECE_AREAS, SKILLS, INTERESTS } from "../../utils/constants";

const CreateAccountStepThree = (props) => {
  const STEP_TITLE = "Share Your Interests + Current Skills";
  const ECE_AREAS_TEXT = "ECE Areas (minimum of 2)";
  const INTERESTS_TEXT = "Interests (minimum of 5)";
  const SKILLS_TEXT = "Skills (minimum of 5)";

  const handleRemoveEceArea = (eceAreaKey) => {
    props.setEceAreas(props.eceAreas.filter((area) => area !== eceAreaKey));
  };

  const handleRemoveInterest = (interestToRemove) => {
    props.setInterests(
      props.interests.filter((interest) => interest !== interestToRemove)
    );
  };

  const handleRemoveSkill = (skillToRemove) => {
    props.setSkills(
      props.skills.filter((skill) => skill !== skillToRemove)
    );
  };

  const submitStepThree = (event) => {
    event.preventDefault();
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
          {SKILLS.filter(
            (skill) => !props.skills.includes(skill)
          ).map((skill, index) => (
            <option key={index} value={skill}>
              {skill}
            </option>
          ))}
        </select>

        <DropdownItems
          selectedItems={props.skills}
          allItems={SKILLS}
          removeItem={handleRemoveSkill}
          isEceAreaDropdown={false}
        />
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
