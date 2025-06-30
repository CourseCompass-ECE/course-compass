import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CreateAccountStepOne from "./createAccountSteps/CreateAccountStepOne";
import CreateAccountStepTwo from "./createAccountSteps/CreateAccountStepTwo";
import CreateAccountStepThree from "./createAccountSteps/CreateAccountStepThree";
import CreateAccountStepFour from "./createAccountSteps/CreateAccountStepFour";
import CreateAccountStepFive from "./createAccountSteps/CreateAccountStepFive";

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

  const renderPage = () => {
    switch (currentStep) {
      case 1:
        return (
          <CreateAccountStepOne
            fullName={fullName}
            setFullName={setFullName}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            currentStep={currentStep}
            setCurrentStep={setCurrentStep}
          />
        );
      case 2:
        return <CreateAccountStepTwo />;
      case 3:
        return <CreateAccountStepThree />;
      case 4:
        return <CreateAccountStepFour />;
      case 5:
        return (
          <CreateAccountStepFive
            fullName={fullName}
            email={email}
            password={password}
          />
        );
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
