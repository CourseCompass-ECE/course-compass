import { useState } from "react";
import { Path } from "../../utils/enums";
import {
  GENERIC_ERROR,
  DUPLICATE_EMAIL_ERROR,
  DESIGNATIONS,
} from "../../utils/constants";

const CreateAccountStepFive = (props) => {
  const [learningGoalText, setLearningGoalText] = useState("");
  const [learningGoalError, setLearningGoalError] = useState("");
  const [submissionError, setSubmissionError] = useState("");

  const STEP_TITLE = "What’s Your Ultimate Learning Goal?";
  const STEP_DESCRIPTION = `Share the top 3+ specific ${
    DESIGNATIONS[props.desiredDesignation]
  } concepts you aim to learn before graduating, using a comma-separated list`;
  const LEARNING_GOAL = "Learning Goal (concept 1, concept 2, ...)";
  const LEARNING_GOAL_ERROR =
    "Please list 3 or more concepts, separated by commas";

  const submitStepFive = async (event) => {
    event.preventDefault();
    setLearningGoalError("");

    let learningGoal = learningGoalText
      .split(",")
      .filter((concept) => concept.trim() !== "");
    learningGoal.forEach(
      (concept, index) => (learningGoal[index] = concept.trim())
    );

    if (learningGoal.length < 3) {
      setLearningGoalError(LEARNING_GOAL_ERROR);
      return;
    }

    try {
      const newUser = {
        fullName: props.fullName,
        email: props.email,
        password: props.password,
        pfpUrl: props.pfpUrl,
        interests: props.interests,
        skills: props.skills,
        eceAreas: props.eceAreas,
        desiredDesignation: props.desiredDesignation,
        desiredMinors: props.desiredMinors,
        desiredCertificates: props.desiredCertificates,
        learningGoal: learningGoal,
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
    }
  };

  return (
    <form
      className="create-account-form"
      onSubmit={(event) => submitStepFive(event)}
    >
      <h1 className="create-account-form-title create-account-step-five-title">
        {STEP_TITLE}
      </h1>
      <h2 className="create-account-form-subtitle">{STEP_DESCRIPTION}</h2>
      <div className="text-input-container">
        <input
          type="text"
          className="text-input"
          placeholder={LEARNING_GOAL}
          value={learningGoalText}
          maxLength={150}
          onChange={(event) => setLearningGoalText(event.target.value)}
        />
        <span className="text-input-error">{learningGoalError}</span>
      </div>

      <div className="text-input-container create-account-btn">
        <button type="submit" className="form-btn">
          Create Account
        </button>
        <span className="text-input-error submission-error create-account-submission-error">
          {submissionError}
        </span>
      </div>
    </form>
  );
};

export default CreateAccountStepFive;
