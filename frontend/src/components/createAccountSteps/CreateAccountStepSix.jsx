import { useState } from "react";
import { Path } from "../../utils/enums";
import { useNavigate } from "react-router-dom";
import {
  GENERIC_ERROR,
  DUPLICATE_EMAIL_ERROR,
  DESIGNATIONS,
  CREATE_ACCOUNT,
  SKILLS_INTERESTS_PATH,
  SKILL,
  INTEREST,
} from "../../utils/constants";
import { initializeApp } from "firebase/app";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import CreateAccountButton from "./CreateAccountButton";
import { REMOVE_PUNCTUATION_AND_SPLIT_WORDS } from "../../utils/regex";
import { stopwords } from "../../../../backend/utils/constants";

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

const UPLOAD_RESUME_ENDPOINT = "https://api.affinda.com/v3/documents";
const DUPLICATE_DOCUMENT_ERROR_CODE = "duplicate_document_error";
const DUPLICATE_DOCUMENT_ERROR_MESSAGE =
  "Résumé provided is a duplicate of a previously uploaded résumé. Please use a different résumé";
const FAILED_TO_PARSE_STORE_RESUME_ERROR =
  "Something went wrong parsing & storing your résumé. Please reupload your résumé in step 3";
const FAILED_TO_RETRIEVE_SKILLS_INTERESTS =
  "Something went wrong retrieving skills & interests";
const RESUME = "Resume";
const AFFINDA_PARSER_API_HEADER = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${import.meta.env.VITE_AFFINDA_RESUME_PARSER_API_KEY}`,
};
const LOADING_TEXT =
  "Parsing résumé, uploading résumé + profile photo to the cloud...";

const CreateAccountStepSix = (props) => {
  const navigate = useNavigate();
  const [learningGoalError, setLearningGoalError] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const STEP_TITLE = "What’s Your Ultimate Learning Goal?";
  const STEP_DESCRIPTION = `Share the top 3+ specific ${
    DESIGNATIONS[props.desiredDesignation]
  } concepts you aim to learn before graduating, using a comma-separated list`;
  const LEARNING_GOAL = "Learning Goal (concept 1, concept 2, ...)";
  const LEARNING_GOAL_ERROR =
    "Please list 3 or more concepts, separated by commas";
  const END_OF_STRING_TO_REMOVE = "base64,";

  const exitAttemptToCreateAccount = () => {
    setIsLoading(false);
  };

  const submitStepSix = async (event) => {
    event.preventDefault();
    setSubmissionError("");
    setIsLoading(true);
    setLearningGoalError("");

    let learningGoal = props.learningGoalText
      .split(",")
      .filter((concept) => concept.trim() !== "");
    learningGoal.forEach(
      (concept, index) => (learningGoal[index] = concept.trim())
    );

    if (learningGoal.length < 3) {
      setLearningGoalError(LEARNING_GOAL_ERROR);
      return exitAttemptToCreateAccount();
    }

    const parsedResumeData = await findParsedResume();
    if (!parsedResumeData?.data || !parsedResumeData?.meta?.pdf) {
      return exitAttemptToCreateAccount();
    }

    const newSkillsInterestsObject = await findNewSkillsInterestsFromResumeData(
      parsedResumeData?.data
    );
    if (!newSkillsInterestsObject) {
      return exitAttemptToCreateAccount();
    }

    let totalUserSkills = new Array(
      new Set([...props.skills, ...newSkillsInterestsObject.skills])
    );
    let totalUserInterests = new Array(
      new Set([...props.interests, ...newSkillsInterestsObject.interests])
    );

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
        resumeUrl: parsedResumeData?.meta?.pdf,
        interests: totalUserInterests,
        skills: totalUserSkills,
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
        return exitAttemptToCreateAccount();
      }
    } catch (error) {
      setSubmissionError(GENERIC_ERROR);
      return exitAttemptToCreateAccount();
    }
  };

  const findParsedResume = async () => {
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(props.resume);
      reader.addEventListener(
        "load",
        async () => {
          try {
            let newBaseURL = reader.result.slice(
              reader.result.indexOf(END_OF_STRING_TO_REMOVE) +
                END_OF_STRING_TO_REMOVE.length
            );

            const resumeData = {
              file: newBaseURL,
              workspace: import.meta.env.VITE_WORKSPACE_ID,
              documentType: import.meta.env.VITE_DOCUMENT_TYPE_ID,
              rejectDuplicates: true,
              fileName: `${props.fullName}'s ${RESUME}`,
              compact: true,
              enableValidationTool: false,
            };

            const response = await fetch(UPLOAD_RESUME_ENDPOINT, {
              method: "POST",
              headers: AFFINDA_PARSER_API_HEADER,
              body: JSON.stringify(resumeData),
            });

            if (response.ok) {
              const data = await response.json();
              resolve(data);
            } else {
              const errorObject = await response.json();
              if (
                errorObject?.errors &&
                errorObject?.errors[0]?.code === DUPLICATE_DOCUMENT_ERROR_CODE
              )
                setSubmissionError(DUPLICATE_DOCUMENT_ERROR_MESSAGE);
              else setSubmissionError(FAILED_TO_PARSE_STORE_RESUME_ERROR);

              resolve(null);
            }
          } catch (error) {
            setSubmissionError(FAILED_TO_PARSE_STORE_RESUME_ERROR);
            resolve(null);
          }
        },
        false
      );
    });
  };

  const cleanseAndReturnArrayOfWords = (text) => {
    let stopwordsSet = new Set(stopwords);

    let wordArray = text
      ?.match(REMOVE_PUNCTUATION_AND_SPLIT_WORDS)
      ?.filter((word) => !stopwordsSet.has(word));

    return wordArray ? wordArray : [];
  };

  const splitWordsInTextArray = (textArray) => {
    let wordArray = [];
    textArray.forEach((text) => {
      wordArray.push(...cleanseAndReturnArrayOfWords(text));
    });
    return wordArray;
  };

  const findAllResumeSkillsInterests = (parsedResumeData) => {
    let resumeSkillsInterests = new Set([...parsedResumeData?.hobby]);

    parsedResumeData?.skill?.forEach((skill) => {
      resumeSkillsInterests = new Set([
        ...resumeSkillsInterests,
        skill?.subCategory,
        skill?.name,
        skill?.category,
      ]);
    });

    parsedResumeData?.education?.forEach((education) => {
      let educationMajors = education?.educationMajor
        ? education.educationMajor
        : [];
      let educationMinors = education?.educationMinor
        ? education.educationMinor
        : [];
      let educationAccreditation = cleanseAndReturnArrayOfWords(
        education?.educationAccreditation
      );
      let educationOrganization = cleanseAndReturnArrayOfWords(
        education?.educationOrganization
      );

      resumeSkillsInterests = new Set([
        ...resumeSkillsInterests,
        ...educationAccreditation,
        ...educationOrganization,
        ...educationMajors,
        ...educationMinors,
      ]);
    });

    parsedResumeData?.workExperience?.forEach((workExperience) => {
      let jobDescriptionTextArray = cleanseAndReturnArrayOfWords(
        workExperience?.jobDescription
      );

      resumeSkillsInterests = new Set([
        ...resumeSkillsInterests,
        workExperience?.jobTitle,
        ...jobDescriptionTextArray,
      ]);
    });

    let summaryData = cleanseAndReturnArrayOfWords(parsedResumeData?.summary);
    let objectiveData = cleanseAndReturnArrayOfWords(
      parsedResumeData?.objective
    );
    resumeSkillsInterests = new Set([
      ...resumeSkillsInterests,
      ...summaryData,
      ...objectiveData,
    ]);

    resumeSkillsInterests = new Set([
      ...resumeSkillsInterests,
      ...splitWordsInTextArray(parsedResumeData?.achievement),
      ...splitWordsInTextArray(parsedResumeData?.association),
    ]);
  };

  const convertSkillsInterestsObjectToSet = (
    skillOrInterest,
    skillsInterestsObject
  ) => {
    return new Set(
      skillsInterestsObject
        .filter(
          (skillInterest) => skillInterest.skillOrInterest === skillOrInterest
        )
        .map((skillInterest) => skillInterest.name.toLowerCase())
    );
  };

  const findNewSkillsInterestsFromResumeData = async (parsedResumeData) => {
    let skillsInterestsObject = await findAllSkillsInterests();
    if (!skillsInterestsObject) return null;

    let validSkillsSet = convertSkillsInterestsObjectToSet(
      SKILL,
      skillsInterestsObject
    );
    let validInterestsSet = convertSkillsInterestsObjectToSet(
      INTEREST,
      skillsInterestsObject
    );

    let newSkillsInterests = { skills: [], interests: [] };
    const allResumeSkillsInterestsSet =
      findAllResumeSkillsInterests(parsedResumeData);
      
    return newSkillsInterests;
  };

  const exitAttemptToFindSkillsInterests = () => {
    setSubmissionError(FAILED_TO_RETRIEVE_SKILLS_INTERESTS);
    return null;
  };

  const findAllSkillsInterests = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${
          Path.CREATE_ACCOUNT
        }${SKILLS_INTERESTS_PATH}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data?.skillsInterests;
      } else {
        return exitAttemptToFindSkillsInterests();
      }
    } catch (error) {
      return exitAttemptToFindSkillsInterests();
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

      <div
        className="error-modal-container"
        style={{ display: isLoading ? "flex" : "none" }}
      >
        <div className="loader timetable-loader"></div>
        <span className="loading-text">{LOADING_TEXT}</span>
      </div>
    </form>
  );
};

export default CreateAccountStepSix;
