import { useState } from "react";

const CreateAccountStepTwo = (props) => {
  const [pfpError, setPfpError] = useState("");
  const STEP_TITLE = "Add a Profile Picture";
  const PFP_ALT = "User's profile picture";
  const PFP_PLACEHOLDER_URL = "/placeholderPfp.png";
  const PFP_ERROR = "Please add a profile picture";

  const handleAddPfp = () => {
    const imageFiles = document.getElementById("create-account-pfp-file").files;
    if (imageFiles.length > 0) {
      props.setPfpUrl(URL.createObjectURL(imageFiles[0]));
    } else {
      props.setPfpUrl("");
    }
  };

  const submitStepTwo = (event) => {
    event.preventDefault();
    if (props.pfpUrl) {
      props.setCurrentStep(props.currentStep + 1);
    } else {
      setPfpError(PFP_ERROR);
    }
  };

  return (
    <form
      className="create-account-form"
      onSubmit={(event) => submitStepTwo(event)}
    >
      <h1 className="create-account-form-title">{STEP_TITLE}</h1>
      <div
        className="create-account-pfp-button"
        onClick={() =>
          document.getElementById("create-account-pfp-file").click()
        }
      >
        <img
          className="create-account-pfp-img"
          alt={PFP_ALT}
          src={props.pfpUrl ? props.pfpUrl : PFP_PLACEHOLDER_URL}
        />
        <span className="create-account-text">Click to Add</span>
        <input
          type="file"
          id="create-account-pfp-file"
          className="create-account-pfp-file"
          accept="image/png, image/jpeg"
          onChange={handleAddPfp}
        />
        <span className="text-input-error create-account-pfp-error">{pfpError}</span>
      </div>

      <div className="text-input-container create-account-btn">
        <button type="submit" className="form-btn">
          Continue
        </button>
      </div>
    </form>
  );
};

export default CreateAccountStepTwo;
