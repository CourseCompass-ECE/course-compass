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
import {
  findParsedResume,
  successfullyDeleteExistingParsedResume,
} from "../../utils/resumeHelperFunctions";
import ParsingLoader from "./ParsingLoader";

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

const CreateAccountStepSixLearningGoal = (props) => {
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
  const FAILED_TO_RETRIEVE_SKILLS_INTERESTS =
    "Something went wrong retrieving skills & interests";
  const LOADING_TEXT =
    "Parsing résumé, uploading résumé + profile photo to the cloud, creating account...";

  const exitAttemptToCreateAccount = async (parsedResumeData) => {
    await successfullyDeleteExistingParsedResume(
      parsedResumeData?.meta?.identifier,
      props.setParsedResumeData
    );
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
      setIsLoading(false);
      return;
    }

    const parsedResumeData = props.parsedResumeData
      ? props.parsedResumeData
      : await findParsedResume(
          setSubmissionError,
          props.resume,
          props.fullName
        );
    if (!parsedResumeData?.data || !parsedResumeData?.meta?.pdf) {
      setIsLoading(false);
      return;
    }

    const newSkillsInterestsObject = await findNewSkillsInterestsFromResumeData(
      parsedResumeData?.data
    );
    if (!newSkillsInterestsObject) {
      return await exitAttemptToCreateAccount(parsedResumeData);
    }

    let totalUserSkills = [
      ...new Set([...props.skills, ...newSkillsInterestsObject.skills]),
    ];
    let totalUserInterests = [
      ...new Set([...props.interests, ...newSkillsInterestsObject.interests]),
    ];

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
        resumeId: parsedResumeData?.meta?.identifier,
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
        return await exitAttemptToCreateAccount(parsedResumeData);
      }
    } catch (error) {
      setSubmissionError(GENERIC_ERROR);
      return await exitAttemptToCreateAccount(parsedResumeData);
    }
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
    textArray?.forEach((text) => {
      wordArray.push(...cleanseAndReturnArrayOfWords(text));
    });
    return wordArray;
  };

  const findAllResumeSkillsInterests = (parsedResumeData) => {
    let hobbyArray = parsedResumeData?.hobby ? parsedResumeData.hobby : [];
    let resumeSkillsInterests = new Set([...hobbyArray]);

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
      let jobDescription = cleanseAndReturnArrayOfWords(
        workExperience?.jobDescription
      );
      let jobTitle = cleanseAndReturnArrayOfWords(workExperience?.jobTitle);
      let organization = cleanseAndReturnArrayOfWords(
        workExperience?.workExperienceOrganization
      );

      resumeSkillsInterests = new Set([
        ...resumeSkillsInterests,
        ...jobTitle,
        ...jobDescription,
        ...organization,
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

    return resumeSkillsInterests;
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

  const doesStringArrayContainSkillInterest = (stringArray, skillInterest) => {
    for (const text of stringArray) {
      if (text?.includes(skillInterest)) {
        return true;
      }
    }
    return false;
  };

  // Now review the full sentence/phrase fields (precisely educationAccreditation, educationOrganization, workExperienceOrganization,
  // jobDescription, jobTitle, summary, objective, achievement, and association) & find any sentences containing any of the skills/interests
  const findSkillsInterestsInFullSentences = (
    parsedResumeData,
    skillsInterestsSet
  ) => {
    let moreSkillsInterestsMatches = new Set([]);

    for (const skillInterest of [...skillsInterestsSet]) {
      let isSkillInterestAdded = false;

      let educationArray = parsedResumeData?.education
        ? parsedResumeData.education
        : [];
      for (const education of educationArray) {
        if (
          education?.educationAccreditation?.includes(skillInterest) ||
          education?.educationOrganization?.includes(skillInterest)
        ) {
          moreSkillsInterestsMatches.add(skillInterest);
          isSkillInterestAdded = true;
          break;
        }
      }
      if (isSkillInterestAdded) continue;

      let workExperienceArray = parsedResumeData?.workExperience
        ? parsedResumeData.workExperience
        : [];
      for (const workExperience of workExperienceArray) {
        if (
          workExperience?.jobDescription?.includes(skillInterest) ||
          workExperience?.jobTitle?.includes(skillInterest) ||
          workExperience?.workExperienceOrganization?.includes(skillInterest)
        ) {
          moreSkillsInterestsMatches.add(skillInterest);
          isSkillInterestAdded = true;
          break;
        }
      }
      if (isSkillInterestAdded) continue;

      if (
        doesStringArrayContainSkillInterest(
          parsedResumeData?.achievement ? parsedResumeData.achievement : [],
          skillInterest
        )
      ) {
        moreSkillsInterestsMatches.add(skillInterest);
        continue;
      } else if (
        doesStringArrayContainSkillInterest(
          parsedResumeData?.association ? parsedResumeData.association : [],
          skillInterest
        )
      ) {
        moreSkillsInterestsMatches.add(skillInterest);
        continue;
      }

      if (
        parsedResumeData?.summary?.includes(skillInterest) ||
        parsedResumeData?.objective?.includes(skillInterest)
      )
        moreSkillsInterestsMatches.add(skillInterest);
    }

    return moreSkillsInterestsMatches;
  };

  const capitalizeSetItems = (set) => {
    return new Set(
      [...set].map((setItem) => {
        return setItem
          .split(" ")
          .map((word) => {
            return word[0].toUpperCase() + word.slice(1);
          })
          .join(" ");
      })
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

    let newSkillsInterests = {};
    let allResumeSkillsInterestsSet =
      findAllResumeSkillsInterests(parsedResumeData);
    allResumeSkillsInterestsSet = new Set(
      [...allResumeSkillsInterestsSet].map((skillInterest) =>
        skillInterest?.toLowerCase()
      )
    );

    newSkillsInterests.skills = validSkillsSet.intersection(
      allResumeSkillsInterestsSet
    );
    newSkillsInterests.interests = validInterestsSet.intersection(
      allResumeSkillsInterestsSet
    );

    const moreSkillsInterestsMatches = findSkillsInterestsInFullSentences(
      parsedResumeData,
      new Set([...validSkillsSet, ...validInterestsSet])
    );
    newSkillsInterests.skills = new Set([
      ...newSkillsInterests.skills,
      ...validSkillsSet.intersection(moreSkillsInterestsMatches),
    ]);
    newSkillsInterests.interests = new Set([
      ...newSkillsInterests.interests,
      ...validInterestsSet.intersection(moreSkillsInterestsMatches),
    ]);

    newSkillsInterests.skills = capitalizeSetItems(newSkillsInterests.skills);
    newSkillsInterests.interests = capitalizeSetItems(
      newSkillsInterests.interests
    );

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

      <ParsingLoader isLoading={isLoading} loadingText={LOADING_TEXT} />
    </form>
  );
};

export default CreateAccountStepSixLearningGoal;
