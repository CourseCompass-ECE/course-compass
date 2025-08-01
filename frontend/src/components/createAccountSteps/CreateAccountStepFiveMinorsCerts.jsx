import { useState } from "react";
import {
  DESIGNATIONS,
  MINORS,
  CERTIFICATES,
  CONTINUE
} from "../../utils/constants";
import RenderDropdownMenu from "../../utils/renderDropdown";
import CreateAccountButton from "./CreateAccountButton";

const CreateAccountStepFiveMinorsCerts = (props) => {
  const [desiredDesignationError, setDesiredDesignationError] = useState("");
  const [desiredMinorsError, setDesiredMinorsError] = useState("");
  const [desiredCertificatesError, setDesiredCertificatesError] = useState("");

  const STEP_TITLE = "What Do You Want on Your Degree?";
  const DESIGNATION_TEXT = "Designation (choose 1)";
  const MINORS_TEXT = "Minors (minimum of 1)";
  const CERTIFICATES_TEXT = "Certificates (minimum of 1)";
  const DESIGNATION_ERROR_MESSAGE = "Please select a designation";
  const MINORS_ERROR_MESSAGE = "Please select at least 1 minor";
  const CERTIFICATES_ERROR_MESSAGE = "Please select at least 1 certificate";

  const handleRemoveMinor = (minorToRemove) => {
    props.setDesiredMinors(
      props.desiredMinors.filter((minor) => minor !== minorToRemove)
    );
  };

  const handleRemoveCertificate = (certificateToRemove) => {
    props.setDesiredCertificates(
      props.desiredCertificates.filter(
        (certificate) => certificate !== certificateToRemove
      )
    );
  };

  const submitStepFive = (event) => {
    event.preventDefault();
    setDesiredDesignationError("");
    setDesiredMinorsError("");
    setDesiredCertificatesError("");

    if (!props.desiredDesignation) {
      setDesiredDesignationError(DESIGNATION_ERROR_MESSAGE);
      return;
    } else if (props.desiredMinors.length < 1) {
      setDesiredMinorsError(MINORS_ERROR_MESSAGE);
      return;
    } else if (props.desiredCertificates.length < 1) {
      setDesiredCertificatesError(CERTIFICATES_ERROR_MESSAGE);
      return;
    }

    props.setCurrentStep(props.currentStep + 1);
  };

  return (
    <form
      className="create-account-form"
      onSubmit={(event) => submitStepFive(event)}
    >
      <h1 className="create-account-form-title">{STEP_TITLE}</h1>
      <div className="text-input-container">
        <select
          value={props.desiredDesignation}
          className="text-input dropdown-without-items-list"
          onChange={(event) => props.setDesiredDesignation(event.target.value)}
        >
          <option value="" disabled>
            {DESIGNATION_TEXT}
          </option>
          {Object.entries(DESIGNATIONS).map(([key, value], index) => (
            <option key={index} value={key}>
              {value}
            </option>
          ))}
        </select>

        <span className="text-input-error">{desiredDesignationError}</span>
      </div>

      <RenderDropdownMenu
        setItems={props.setDesiredMinors}
        currentItems={props.desiredMinors}
        placeholderText={MINORS_TEXT}
        menuItems={MINORS}
        removeItem={handleRemoveMinor}
        errorMessage={desiredMinorsError}
      />

      <RenderDropdownMenu
        setItems={props.setDesiredCertificates}
        currentItems={props.desiredCertificates}
        placeholderText={CERTIFICATES_TEXT}
        menuItems={CERTIFICATES}
        removeItem={handleRemoveCertificate}
        errorMessage={desiredCertificatesError}
      />

      <CreateAccountButton buttonText={CONTINUE} />
    </form>
  );
};

export default CreateAccountStepFiveMinorsCerts;
