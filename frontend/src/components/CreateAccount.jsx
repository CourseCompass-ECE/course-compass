import { useState } from "react";
import { Path } from "../utils/enums";
import { useNavigate } from "react-router-dom";
import { GENERIC_ERROR, DUPLICATE_EMAIL_ERROR } from "../utils/constants";
import CreateAccountStepOne from "./CreateAccountStepOne";

const CreateAccount = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const progressBarItems = [
    "Personal",
    "Profile Picture",
    "Interests + Skills",
    "Degree",
    "Learning Goal",
  ];

  const [submissionError, setSubmissionError] = useState("");
  const submitStepFive = async (event) => {
    event.preventDefault();

    try {
      const newUser = {
        fullName: fullName,
        email: email,
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
          credentials: "include",
        }
      );

      if (response.ok) {
        navigate(Path.EXPLORE);
      } else {
        const data = await response.json();
        setSubmissionError(
          data.message === DUPLICATE_EMAIL_ERROR
            ? DUPLICATE_EMAIL_ERROR
            : GENERIC_ERROR
        );
      }
    } catch (error) {
      setSubmissionError(GENERIC_ERROR);
      //todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?tab=t.0 (in PR notes)
    }
  };

  const renderPage = () => {
    switch (currentStep) {
      case 1:
        return <CreateAccountStepOne />;
      default:
        return <></>;
    }
  };

  return (
    <div className="create-account">
      {renderPage()}
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
