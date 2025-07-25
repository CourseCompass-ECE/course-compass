import CreateAccountButton from "./CreateAccountButton";
import { CONTINUE } from "../../utils/constants";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

const CreateAccountStepThree = (props) => {
  const [resumeError, setResumeError] = useState("");

  const STEP_TITLE = "Add Your Résumé";
  const BEFORE_DRAG_INSTRUCTIONS =
    "Drag & drop your résumé or click here to select it (pdf, docx)";
  const AFTER_DRAG_INSTRUCTIONS = "Drop your résumé here!";
  const FILE_TYPES_TO_ACCEPT =
    ".docx,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf";
  const INVALID_FILE_TYPE = "Please provide a valid file type: pdf, docx";
  const MISSING_RESUME =
    "Please upload a résumé with one of the following file types: pdf, docx";

  const submitStepThree = (event) => {
    event.preventDefault();
    if (props.resume) {
      props.setCurrentStep(props.currentStep + 1);
    } else {
      setResumeError(MISSING_RESUME);
    }
  };

  const onDrop = useCallback((fileArray) => {
    setResumeError("");

    if (
      fileArray.length > 0 &&
      FILE_TYPES_TO_ACCEPT.split(",").includes(fileArray[0].type)
    ) {
      props.setResume(fileArray[0]);
    } else {
      setResumeError(INVALID_FILE_TYPE);
    }
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
        style={
          isDragActive
            ? { backgroundColor: "var(--background-mixed)", borderWidth: "3px" }
            : {}
        }
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
          <input {...getInputProps()} accept={FILE_TYPES_TO_ACCEPT} />
          <span className="material-symbols-outlined resume-upload-icon">
            cloud_upload
          </span>
          {isDragActive ? (
            <p>{AFTER_DRAG_INSTRUCTIONS}</p>
          ) : (
            <p>{BEFORE_DRAG_INSTRUCTIONS}</p>
          )}
        </div>
      </div>
      <span className="resume-upload-error">{resumeError}</span>

      <CreateAccountButton buttonText={CONTINUE} />
    </form>
  );
};

export default CreateAccountStepThree;
