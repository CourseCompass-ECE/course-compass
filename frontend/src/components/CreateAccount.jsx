import { useState } from "react";
import CreateAccountStepOneLoginInfo from "./createAccountSteps/CreateAccountStepOneLoginInfo";
import CreateAccountStepTwoPfp from "./createAccountSteps/CreateAccountStepTwoPfp";
import CreateAccountStepThreeResume from "./createAccountSteps/CreateAccountStepThreeResume";
import CreateAccountStepFourSkillsInterests from "./createAccountSteps/CreateAccountStepFourSkillsInterests";
import CreateAccountStepFiveMinorsCerts from "./createAccountSteps/CreateAccountStepFiveMinorsCerts";
import CreateAccountStepSixLearningGoal from "./createAccountSteps/CreateAccountStepSixLearningGoal";

const CreateAccount = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pfp, setPfp] = useState(null);
  const [pfpPreview, setPfpPreview] = useState("");
  const [resume, setResume] = useState(null);
  const [resumeToDisplay, setResumeToDisplay] = useState(null);
  const [parsedResumeData, setParsedResumeData] = useState(null);
  const [eceAreas, setEceAreas] = useState([]);
  const [interests, setInterests] = useState([]);
  const [skills, setSkills] = useState([]);
  const [desiredDesignation, setDesiredDesignation] = useState("");
  const [desiredMinors, setDesiredMinors] = useState([]);
  const [desiredCertificates, setDesiredCertificates] = useState([]);
  const [learningGoalText, setLearningGoalText] = useState("");
  const progressBarItems = [
    "Personal",
    "Profile Picture",
    "Résumé",
    "Interests + Skills",
    "Degree",
    "Learning Goal",
  ];

  const renderPage = () => {
    switch (currentStep) {
      case 1:
        return (
          <CreateAccountStepOneLoginInfo
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
        return (
          <CreateAccountStepTwoPfp
            setCurrentStep={setCurrentStep}
            currentStep={currentStep}
            pfp={pfp}
            setPfp={setPfp}
            pfpPreview={pfpPreview}
            setPfpPreview={setPfpPreview}
          />
        );
      case 3:
        return (
          <CreateAccountStepThreeResume
            setCurrentStep={setCurrentStep}
            currentStep={currentStep}
            setResume={setResume}
            resume={resume}
            resumeToDisplay={resumeToDisplay}
            setResumeToDisplay={setResumeToDisplay}
            parsedResumeData={parsedResumeData}
            setParsedResumeData={setParsedResumeData}
            fullName={fullName}
          />
        );
      case 4:
        return (
          <CreateAccountStepFourSkillsInterests
            setCurrentStep={setCurrentStep}
            currentStep={currentStep}
            eceAreas={eceAreas}
            setEceAreas={setEceAreas}
            interests={interests}
            setInterests={setInterests}
            skills={skills}
            setSkills={setSkills}
          />
        );
      case 5:
        return (
          <CreateAccountStepFiveMinorsCerts
            setCurrentStep={setCurrentStep}
            currentStep={currentStep}
            desiredDesignation={desiredDesignation}
            setDesiredDesignation={setDesiredDesignation}
            desiredMinors={desiredMinors}
            setDesiredMinors={setDesiredMinors}
            desiredCertificates={desiredCertificates}
            setDesiredCertificates={setDesiredCertificates}
          />
        );
      case 6:
        return (
          <CreateAccountStepSixLearningGoal
            fullName={fullName}
            email={email}
            password={password}
            pfp={pfp}
            eceAreas={eceAreas}
            interests={interests}
            skills={skills}
            desiredDesignation={desiredDesignation}
            desiredMinors={desiredMinors}
            desiredCertificates={desiredCertificates}
            learningGoalText={learningGoalText}
            setLearningGoalText={setLearningGoalText}
            resume={resume}
            parsedResumeData={parsedResumeData}
            setParsedResumeData={setParsedResumeData}
          />
        );
      default:
        return <></>;
    }
  };

  return (
    <div className="create-account">
      <button
        className="create-account-back-container"
        style={currentStep === 1 ? { display: "none" } : {}}
        onClick={() => setCurrentStep(currentStep - 1)}
      >
        <span className="material-symbols-outlined create-account-back-icon">
          west
        </span>
      </button>
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
