import DropdownItem from "../DropdownItem";
import { ECE_AREAS } from "../../utils/constants";

const CreateAccountStepThree = (props) => {
  const STEP_TITLE = "Share Your Interests + Current Skills";

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
      <div className="text-input-container">
        <select
          value=""
          className="text-input dropdown-input"
          onChange={(event) =>
            props.setEceAreas([...props.eceAreas, event.target.value])
          }
        >
          <option value="" disabled>
            ECE Areas
          </option>
          {Object.entries(ECE_AREAS)
            .filter(([key]) => !props.eceAreas.includes(key))
            .map(([key, value], index) => (
              <option key={index} value={key}>
                {value}
              </option>
            ))}
        </select>

        <div>
          {props.eceAreas.map((areaKey) => (
            <DropdownItem areaKey={areaKey}/>
          ))}
        </div>
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
