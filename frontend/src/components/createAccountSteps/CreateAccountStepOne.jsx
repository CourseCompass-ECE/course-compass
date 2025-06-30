import { useEffect, useState } from "react";
import {
  ONE_OR_MORE_WHITESPACE_REGEX,
  EMAIL_REGEX,
  ALPHANUMERIC_REGEX,
  UPPERCASE_LETTER,
  LOWERCASE_LETTER,
  NUMBER,
} from "../../utils/regex";
import { EMAIL_ERROR } from "../../utils/constants";

const CreateAccountStepOne = (props) => {
  const [fullNameError, setFullNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [passwordRequirementsMet, setPasswordRequirementsMet] = useState({
    charLimit: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });
  const STEP_TITLE = "Let's Get Started";
  const FULL_NAME_ERROR = "Please enter your full name";
  const PASSWORD_ERROR = "Please enter a valid password";

  const passwordRequirements = [
    "At least 8 characters",
    "Uppercase letter",
    "Lowercase letter",
    "At least 1 number",
    "At least 1 special character",
  ];

  const handlePasswordChange = (password) => {
    const newRequirementsStatus = { ...passwordRequirementsMet };
    newRequirementsStatus.charLimit = password.length >= 8;
    newRequirementsStatus.uppercase = UPPERCASE_LETTER.test(password);
    newRequirementsStatus.lowercase = LOWERCASE_LETTER.test(password);
    newRequirementsStatus.number = NUMBER.test(password);
    newRequirementsStatus.specialChar =
      !ALPHANUMERIC_REGEX.test(password) && password.length > 0;
    setPasswordRequirementsMet(newRequirementsStatus);

    props.setPassword(password);
  };

  const submitStepOne = (event) => {
    event.preventDefault();
    setFullNameError("");
    setEmailError("");
    setPasswordError("");

    if (props.fullName.trim().split(ONE_OR_MORE_WHITESPACE_REGEX).length < 2) {
      setFullNameError(FULL_NAME_ERROR);
      return;
    } else if (!EMAIL_REGEX.test(props.email)) {
      setEmailError(EMAIL_ERROR);
      return;
    } else if (Object.values(passwordRequirementsMet).includes(false)) {
      setPasswordError(PASSWORD_ERROR);
      return;
    }

    props.setFullName(props.fullName.trim());
    props.setEmail(props.email.trim());
    props.setCurrentStep(props.currentStep + 1);
  };

  useEffect(() => {
    handlePasswordChange(props.password);
  }, []);

  return (
    <form
      className="create-account-form"
      onSubmit={(event) => submitStepOne(event)}
    >
      <h1 className="create-account-form-title">{STEP_TITLE}</h1>
      <div className="text-input-container">
        <input
          type="text"
          className="text-input"
          placeholder="Full Name"
          value={props.fullName}
          maxLength={100}
          onChange={(event) => props.setFullName(event.target.value)}
        />
        <span className="text-input-error">{fullNameError}</span>
      </div>

      <div className="text-input-container">
        <input
          type="text"
          className="text-input"
          placeholder="Email"
          value={props.email}
          maxLength={254}
          onChange={(event) => props.setEmail(event.target.value)}
        />
        <span className="text-input-error">{emailError}</span>
      </div>

      <div className="password-requirements-container">
        <ul className="password-requirements-ul">
          {passwordRequirements.map((requirement, index) => {
            const isRequirementMet = Object.values(passwordRequirementsMet)[
              index
            ];
            return (
              <div key={index} className="password-requirement-container">
                <span
                  style={{
                    color: isRequirementMet
                      ? "var(--correct-green)"
                      : "var(--error-red)",
                  }}
                  className="material-symbols-outlined"
                >
                  {isRequirementMet ? "check_circle" : "cancel"}
                </span>
                <li className="password-requirements-li">{requirement}</li>
              </div>
            );
          })}
        </ul>
      </div>

      <div className="text-input-container">
        <div className="create-account-password-container">
          <input
            type={isPasswordVisible ? "text" : "password"}
            className="text-input"
            placeholder="Password"
            value={props.password}
            maxLength={30}
            onChange={(event) => handlePasswordChange(event.target.value)}
          />
          <span
            className="material-symbols-outlined create-account-password-eye-icon"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            {isPasswordVisible ? "visibility_off" : "visibility"}
          </span>
        </div>
        <span className="text-input-error">{passwordError}</span>
      </div>

      <div className="text-input-container create-account-btn">
        <button type="submit" className="form-btn">
          Continue
        </button>
      </div>
    </form>
  );
};

export default CreateAccountStepOne;
