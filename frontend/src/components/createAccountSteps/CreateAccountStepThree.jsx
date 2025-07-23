import CreateAccountButton from "./CreateAccountButton";
import { CONTINUE } from "../../utils/constants";
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";

const CreateAccountStepThree = () => {
  const STEP_TITLE = "Add Your Résumé";
  const BEFORE_DRAG_INSTRUCTIONS =
    "Drag & drop your résumé or click here to select it";
  const AFTER_DRAG_INSTRUCTIONS = "Drop your résumé here!";

  const submitStepThree = (event) => {
    event.preventDefault();
    if (props.pfp) {
      props.setCurrentStep(props.currentStep + 1);
    } else {
      setPfpError(PFP_ERROR);
    }
  };

  const onDrop = useCallback((file) => {
    // handle edge case where user provides a whole folder - must be declared to test pop-up functionality on-click & drag/drop functionality
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
  });

  return (
    <form
      className="create-account-form"
      onSubmit={(event) => submitStepThree(event)}
    >
      <h1 className="create-account-form-title">{STEP_TITLE}</h1>

      <div
        {...getRootProps()}
        className="resume-upload-container"
        style={isDragActive ? { backgroundColor: "var(--background-mixed)", borderWidth: "3px" } : {}}
      >
        <div
          className="resume-upload-background"
          style={
            isDragActive
              ? { background: "linear-gradient(135deg, #c3dafe, #e0c3fc)" }
              : {}
          }
        />
        <div className="resume-upload-items">
          <input {...getInputProps()} />
          <span class="material-symbols-outlined resume-upload-icon">
            cloud_upload
          </span>
          {isDragActive ? (
            <p>{AFTER_DRAG_INSTRUCTIONS}</p>
          ) : (
            <p>{BEFORE_DRAG_INSTRUCTIONS}</p>
          )}
        </div>
      </div>

      <CreateAccountButton buttonText={CONTINUE} />
    </form>
  );
};

export default CreateAccountStepThree;
