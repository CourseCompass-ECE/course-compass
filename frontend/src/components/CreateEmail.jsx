import { useState } from "react";
import { Path } from "../utils/enums";
import {
  EMAIL_TOPICS,
  ALL_EMAIL_TOPICS,
  GENERIC_ERROR,
  TO,
} from "../utils/constants";
import { EMAIL_REGEX } from "../utils/regex";
import { useNavigate } from "react-router-dom";
import CreateEmailList from "./createEmailList/CreateEmailList";

const CreateEmail = () => {
  const navigate = useNavigate();
  const [emailTopic, setEmailTopic] = useState("");
  const [emailTopicError, setEmailTopicError] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [subjectLineError, setSubjectLineError] = useState("");
  const [emails, setEmails] = useState([]);
  // According to Outlook & Gmail, can send an email with at least 1 "To" recipient or 1 "CC" recipient
  const [emailsError, setEmailsError] = useState("");
  const [body, setBody] = useState("");
  const [bodyError, setBodyError] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const TITLE = "Create Email";
  const EMAIL_TOPIC = "Email Topic";
  const EMAIL_TOPIC_PLACEHOLDER = "Select an email topic";
  const SUBJECT_LINE = "Subject Line";
  const SUBJECT_LINE_PLACEHOLDER = "Enter email subject line";
  const TO_CC = "To/CC";
  const ADD_EMAIL_ADDRESS = "Add Email Address";
  const BODY = "Body";
  const BODY_PLACEHOLDER = "Enter email body";
  const SEND_EMAIL = "Send Email";
  const EMAIL_TOPIC_ERROR_MESSAGE = "Please select an email topic";
  const SUBJECT_LINE_ERROR_MESSAGE = "Please provide a subject line";
  const NO_EMAILS_ERROR_MESSAGE = "Please provide at least one email address";
  const INVALID_EMAIL_ERROR_MESSAGE = "At least one email provided is invalid";
  const DUPLICATE_EMAILS_ERROR_MESSAGE = "Duplicate emails have been provided";
  const NO_TO_EMAILS_ERROR_MESSAGE = `At least one email must be marked as "${TO}"`;
  const BODY_ERROR_MESSAGE = "Please provide a body";

  const addNewEmailAddress = () => {
    setEmails([
      ...emails,
      {
        emailAddress: "",
        toOrCC: TO,
      },
    ]);
  };

  const submitEmail = async (event) => {
    event.preventDefault();
    setEmailTopicError("");
    setSubjectLineError("");
    setEmailsError("");
    setBodyError("");

    const newEmails = emails.map((email) => {
      return { ...email, emailAddress: email.emailAddress ? email.emailAddress.trim() : email.emailAddress };
    });
    const newSubjectLine = subjectLine ? subjectLine.trim() : subjectLine;
    const newBody = body ? body.trim() : body;

    const emailAddresses = newEmails.map((email) => email.emailAddress);
    const duplicateAddresses = emailAddresses.filter(
      (emailAddress, index) => emailAddresses.indexOf(emailAddress) !== index
    );

    if (!emailTopic) {
      setEmailTopicError(EMAIL_TOPIC_ERROR_MESSAGE);
      return;
    } else if (!newSubjectLine) {
      setSubjectLineError(SUBJECT_LINE_ERROR_MESSAGE);
      return;
    } else if (newEmails.length === 0) {
      setEmailsError(NO_EMAILS_ERROR_MESSAGE);
      return;
    } else if (
      newEmails.some((email) => !email.emailAddress || !EMAIL_REGEX.test(email.emailAddress))
    ) {
      setEmailsError(INVALID_EMAIL_ERROR_MESSAGE);
      return;
    } else if (duplicateAddresses.length > 0) {
      setEmailsError(DUPLICATE_EMAILS_ERROR_MESSAGE);
      return;
    } else if (!newEmails.some((email) => email.toOrCC === TO)) {
      setEmailsError(NO_TO_EMAILS_ERROR_MESSAGE);
      return;
    } else if (!newBody) {
      setBodyError(BODY_ERROR_MESSAGE);
      return;
    }

    try {
      const emailData = {
        topic: emailTopic,
        subjectLine: newSubjectLine,
        recipientEmails: newEmails,
        body: newBody,
      };

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${Path.CREATE_EMAIL}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(emailData),
          credentials: "include",
        }
      );

      if (response.ok) {
        navigate(Path.EMAIL);
      } else {
        setSubmissionError(GENERIC_ERROR);
      }
    } catch (error) {
      setSubmissionError(GENERIC_ERROR);
    }
  };

  return (
    <div className="page-container">
      <button
        className="create-account-back-container create-email-back-container"
        onClick={() => navigate(Path.EMAIL)}
      >
        <span className="material-symbols-outlined create-account-back-icon">
          west
        </span>
      </button>
      <h1 className="page-title">{TITLE}</h1>
      <form
        className="create-email-form"
        onSubmit={(event) => submitEmail(event)}
      >
        <label htmlFor="email-topic" className="page-big-header">
          {EMAIL_TOPIC}
        </label>
        <select
          id="email-topic"
          value={emailTopic}
          className="text-input email-topic-dropdown"
          onChange={(event) => setEmailTopic(event.target.value)}
        >
          <option value="" disabled>
            {EMAIL_TOPIC_PLACEHOLDER}
          </option>
          {EMAIL_TOPICS.filter((topic) => topic !== ALL_EMAIL_TOPICS).map(
            (topic, index) => (
              <option key={index} value={topic}>
                {topic}
              </option>
            )
          )}
        </select>
        <div className="create-email-section-spacing text-input-error dropdown-input-error">
          {emailTopicError}
        </div>

        <label htmlFor="subject-line" className="page-big-header">
          {SUBJECT_LINE}
        </label>
        <div className="text-input-container">
          <input
            id="subject-line"
            type="text"
            className="text-input"
            placeholder={SUBJECT_LINE_PLACEHOLDER}
            value={subjectLine}
            maxLength={125}
            onChange={(event) => setSubjectLine(event.target.value)}
          />
          <div className="create-email-section-spacing text-input-error dropdown-input-error">
            {subjectLineError}
          </div>
        </div>

        <label className="page-big-header">{TO_CC}</label>
        <div
          className={`create-btn add-email-address-btn ${
            emails.length < 20 ? "" : "disable-add-email"
          }`}
          onClick={() => (emails.length < 20 ? addNewEmailAddress() : null)}
        >
          <span className="material-symbols-outlined">add_2</span>
          {ADD_EMAIL_ADDRESS}
        </div>
        <CreateEmailList emails={emails} setEmails={setEmails} />
        <div className="create-email-section-spacing text-input-error dropdown-input-error">
          {emailsError}
        </div>

        <label htmlFor="body" className="page-big-header">
          {BODY}
        </label>
        <div className="text-input-container">
          <textarea
            id="body"
            className="text-input create-email-body"
            placeholder={BODY_PLACEHOLDER}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
          <div className="create-email-section-spacing text-input-error dropdown-input-error">
            {bodyError}
          </div>
        </div>

        <div className="text-input-container create-email-btn">
          <button type="submit" className="form-btn">
            {SEND_EMAIL}
          </button>
          <span className="create-email-submission-error">
            {submissionError}
          </span>
        </div>
      </form>
    </div>
  );
};

export default CreateEmail;
