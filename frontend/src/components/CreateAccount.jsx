import { useState } from "react";
import {
  ONE_OR_MORE_WHITESPACE_REGEX,
  EMAIL_REGEX,
  ALPHANUMERIC_REGEX,
  UPPERCASE_LETTER,
  LOWERCASE_LETTER,
  NUMBER,
} from "../utils/regex";
import { Path } from "../utils/enums";
import { useNavigate } from "react-router-dom";

const CreateAccount = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [passwordRequirementsMet, setPasswordRequirementsMet] = useState({
    charLimit: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });
  const [submissionError, setSubmissionError] = useState("");
  const FULL_NAME_ERROR = "Please enter your full name";
  const EMAIL_ERROR = "Please enter a valid email address";
  const PASSWORD_ERROR = "Please enter a valid password";
  const DUPLICATE_EMAIL_ERROR = "Email is already in use";
  const GENERIC_ACCOUNT_CREATION_ERROR =
    "Something went wrong. Please try again";
  const progressBarItems = [
    "Personal",
    "Profile Picture",
    "Interests + Skills",
    "Degree",
    "Learning Goal",
  ];
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

    setPassword(password);
  };

  const createAccount = async (event) => {
    event.preventDefault();
    setFullNameError("");
    setEmailError("");
    setPasswordError("");
    setSubmissionError("");

    if (fullName.trim().split(ONE_OR_MORE_WHITESPACE_REGEX).length < 2) {
      setFullNameError(FULL_NAME_ERROR);
      return;
    } else if (!EMAIL_REGEX.test(email)) {
      setEmailError(EMAIL_ERROR);
      return;
    } else if (Object.values(passwordRequirementsMet).includes(false)) {
      setPasswordError(PASSWORD_ERROR);
      return;
    }

    const userFullName = fullName.trim();
    const userEmail = email.trim();

    try {
      const newUser = {
        fullName: userFullName,
        email: userEmail,
        password,
        pfpUrl: "placeholder",
        interests: [],
        skills: [],
        eceAreas: [],
        desiredDesignation: "COMPUTER", // placeholder choice (between COMPUTER & ELECTRICAL)
        learningGoal: "placeholder",
      };

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${Path.CREATE_ACCOUNT}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newUser),
        }
      );

      if (response.ok) {
        navigate(Path.EXPLORE);
      } else {
        const data = await response.json();
        setSubmissionError(
          data.message === DUPLICATE_EMAIL_ERROR
            ? DUPLICATE_EMAIL_ERROR
            : GENERIC_ACCOUNT_CREATION_ERROR
        );
      }
    } catch (error) {
      setSubmissionError(GENERIC_ACCOUNT_CREATION_ERROR);
    }
  };

  return (
    <div className="create-account">
      <form
        className="create-account-form"
        onSubmit={(event) => createAccount(event)}
      >
        <h1 className="create-account-form-title">Get Started</h1>
        <div className="text-input-container">
          <input
            type="text"
            className="text-input"
            placeholder="Full Name"
            value={fullName}
            maxLength={100}
            onChange={(event) => setFullName(event.target.value)}
          />
          <span className="text-input-error">{fullNameError}</span>
        </div>

        <div className="text-input-container">
          <input
            type="text"
            className="text-input"
            placeholder="Email"
            value={email}
            maxLength={254}
            onChange={(event) => setEmail(event.target.value)}
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
              value={password}
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

        <div className="text-input-container">
          <button type="submit" className="form-btn">
            Continue
          </button>
          <span className="text-input-error submission-error">{submissionError}</span>
        </div>

      </form>
      <aside className="create-account-progress-bar-container">
        <ul className="create-account-progress-bar-content">
          {progressBarItems.map((item, index) => (
            <li
              key={index}
              className="create-account-progress-bar-content-item"
            >
              {item}
            </li>
          ))}
        </ul>
        <div className="create-account-progress-bar">
          <div
            className="create-account-progress"
            style={{ width: `${15 * currentStep}vw` }}
          />
        </div>
      </aside>
    </div>
  );
};

export default CreateAccount;
