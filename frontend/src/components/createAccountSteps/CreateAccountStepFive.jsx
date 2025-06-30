import { useState } from "react";
import { Path } from "../../utils/enums";
import { GENERIC_ERROR, DUPLICATE_EMAIL_ERROR } from "../../utils/constants";

const CreateAccountStepFive = (props) => {
  const [submissionError, setSubmissionError] = useState("");

  const submitStepFive = async (event) => {
    event.preventDefault();
    try {
      const newUser = {
        fullName: props.fullName,
        email: props.email,
        password: props.password,
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

  return <div>Five</div>;
};

export default CreateAccountStepFive;
