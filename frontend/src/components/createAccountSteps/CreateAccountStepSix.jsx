import { useState } from "react";
import { Path } from "../../utils/enums";
import { useNavigate } from "react-router-dom";
import {
  GENERIC_ERROR,
  DUPLICATE_EMAIL_ERROR,
  DESIGNATIONS,
  CREATE_ACCOUNT,
} from "../../utils/constants";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import CreateAccountButton from "./CreateAccountButton";
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

const CreateAccountStepSix = (props) => {
  const navigate = useNavigate();
  const [learningGoalError, setLearningGoalError] = useState("");
  const [submissionError, setSubmissionError] = useState("");

  const STEP_TITLE = "What’s Your Ultimate Learning Goal?";
  const STEP_DESCRIPTION = `Share the top 3+ specific ${
    DESIGNATIONS[props.desiredDesignation]
  } concepts you aim to learn before graduating, using a comma-separated list`;
  const LEARNING_GOAL = "Learning Goal (concept 1, concept 2, ...)";
  const LEARNING_GOAL_ERROR =
    "Please list 3 or more concepts, separated by commas";

  const submitStepSix = async (event) => {
    event.preventDefault();
    setLearningGoalError("");

    let learningGoal = props.learningGoalText
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
      const storageRef = ref(storage, "images/" + props.pfp.name);
      let pfpUrl;
      await uploadBytes(storageRef, props.pfp).then(async (snapshot) => {
        await getDownloadURL(snapshot.ref).then((downloadURL) => {
          pfpUrl = downloadURL;
        });
      });

      const newUser = {
        fullName: props.fullName,
        email: props.email,
        password: props.password,
        pfpUrl: pfpUrl,
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
      onSubmit={(event) => submitStepSix(event)}
    >
      <h1 className="create-account-form-title create-account-step-six-title">
        {STEP_TITLE}
      </h1>
      <h2 className="create-account-form-subtitle">{STEP_DESCRIPTION}</h2>
      <div className="text-input-container">
        <input
          type="text"
          className="text-input"
          placeholder={LEARNING_GOAL}
          value={props.learningGoalText}
          maxLength={150}
          onChange={(event) => props.setLearningGoalText(event.target.value)}
        />
        <span className="text-input-error">{learningGoalError}</span>
      </div>

      <CreateAccountButton
        buttonText={CREATE_ACCOUNT}
        submissionError={submissionError}
      />
    </form>
  );
};

export default CreateAccountStepSix;
