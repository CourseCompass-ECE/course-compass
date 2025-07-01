import { useState } from "react";
import {
  DESIGNATIONS,
  MINORS,
  CERTIFICATES,
  ERROR_MESSAGE_MARGIN_TOP,
} from "../../utils/constants";
import DropdownItems from "../DropdownItems";

const CreateAccountStepFour = (props) => {
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
      props.desiredCertificates.filter((certificate) => certificate !== certificateToRemove)
    );
  }

  const submitStepFour = (event) => {
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
      onSubmit={(event) => submitStepFour(event)}
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

      <div className="text-input-container dropdown-container">
        <select
          value=""
          className="text-input dropdown-input"
          onChange={(event) =>
            props.setDesiredMinors([...props.desiredMinors, event.target.value])
          }
        >
          <option value="" disabled>
            {MINORS_TEXT}
          </option>
          {MINORS.filter((minor) => !props.desiredMinors.includes(minor)).map(
            (minor, index) => (
              <option key={index} value={minor}>
                {minor}
              </option>
            )
          )}
        </select>

        <DropdownItems
          selectedItems={props.desiredMinors}
          allItems={MINORS}
          removeItem={handleRemoveMinor}
          isEceAreaDropdown={false}
        />

        <span
          className="text-input-error"
          style={
            props.desiredMinors.length > 0
              ? { marginTop: ERROR_MESSAGE_MARGIN_TOP }
              : {}
          }
        >
          {desiredMinorsError}
        </span>
      </div>

      <div className="text-input-container dropdown-container">
        <select
          value=""
          className="text-input dropdown-input"
          onChange={(event) =>
            props.setDesiredCertificates([...props.desiredCertificates, event.target.value])
          }
        >
          <option value="" disabled>
            {CERTIFICATES_TEXT}
          </option>
          {CERTIFICATES.filter((certificate) => !props.desiredCertificates.includes(certificate)).map(
            (certificate, index) => (
              <option key={index} value={certificate}>
                {certificate}
              </option>
            )
          )}
        </select>

        <DropdownItems
          selectedItems={props.desiredCertificates}
          allItems={CERTIFICATES}
          removeItem={handleRemoveCertificate}
          isEceAreaDropdown={false}
        />

        <span
          className="text-input-error"
          style={
            props.desiredCertificates.length > 0
              ? { marginTop: ERROR_MESSAGE_MARGIN_TOP }
              : {}
          }
        >
          {desiredCertificatesError}
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

export default CreateAccountStepFour;
