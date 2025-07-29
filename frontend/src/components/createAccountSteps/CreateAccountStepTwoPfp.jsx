import { useState } from "react";
import CreateAccountButton from "./CreateAccountButton";
import { CONTINUE } from "../../utils/constants";

const CreateAccountStepTwoPfp = (props) => {
  const [pfpError, setPfpError] = useState("");
  const STEP_TITLE = "Add a Profile Picture";
  const PFP_ALT = "User's profile picture";
  const PFP_PLACEHOLDER_URL = "/placeholderPfp.png";
  const PFP_ERROR = "Please add a profile picture";
  const IMAGE_PNG = "image/png";
  const IMAGE_JPG = "image/jpeg";

  const handleAddPfp = () => {
    const imageFiles = document.getElementById("create-account-pfp-file").files;
    if (
      imageFiles.length > 0 &&
      (imageFiles[0].type === IMAGE_JPG || imageFiles[0].type === IMAGE_PNG)
    ) {
      const reader = new FileReader();
      reader.readAsDataURL(imageFiles[0]);
      reader.addEventListener(
        "load",
        () => {
          props.setPfpPreview(reader.result);
          props.setPfp(imageFiles[0]);
        },
        false
      );
    }
  };

  const submitStepTwo = (event) => {
    event.preventDefault();
    if (props.pfp) {
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
          src={props.pfpPreview ? props.pfpPreview : PFP_PLACEHOLDER_URL}
        />
        <span className="create-account-text">Click to Add</span>
        <input
          type="file"
          id="create-account-pfp-file"
          className="create-account-pfp-file"
          accept={`${IMAGE_PNG}, ${IMAGE_JPG}`}
          onChange={handleAddPfp}
        />
        <span className="text-input-error create-account-pfp-error">
          {pfpError}
        </span>
      </div>

      <CreateAccountButton buttonText={CONTINUE} />
    </form>
  );
};

export default CreateAccountStepTwoPfp;
