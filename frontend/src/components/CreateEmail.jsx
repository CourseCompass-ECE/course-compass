import { useState } from "react";
import { Path } from "../utils/enums";
import { EMAIL_TOPICS, ALL_EMAIL_TOPICS } from "../utils/constants";
import {useNavigate} from "react-router-dom";
import CreateEmailList from "./createEmailList/CreateEmailList";

const CreateEmail = () => {
  const navigate = useNavigate();
  const [emailTopic, setEmailTopic] = useState("");
  const [subjectLine, setSubjectLine] = useState("");
  const [emails, setEmails] = useState([]);
  const [body, setBody] = useState("");
  const TITLE = "Create Email";
  const EMAIL_TOPIC = "Email Topic";
  const EMAIL_TOPIC_PLACEHOLDER = "Select an email topic";
  const SUBJECT_LINE = "Subject Line";
  const SUBJECT_LINE_PLACEHOLDER = "Enter email subject line";
  const TO_CC = "To/CC";
  const ADD_EMAIL_ADDRESS = "Add Email Address";
  const TO = "To";
  const BODY = "Body";
  const BODY_PLACEHOLDER = "Enter email body";

  const addNewEmailAddress = () => {
    setEmails([
      ...emails,
      {
        emailAddress: "",
        toOrCC: TO,
      },
    ]);
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
      <form className="create-email-form">
        <label htmlFor="email-topic" className="page-big-header">
          {EMAIL_TOPIC}
        </label>
        <select
          id="email-topic"
          value={emailTopic}
          className="text-input email-topic-dropdown create-email-section-spacing"
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

        <label htmlFor="subject-line" className="page-big-header">
          {SUBJECT_LINE}
        </label>
        <div className="text-input-container">
          <input
            id="subject-line"
            type="text"
            className="text-input create-email-section-spacing"
            placeholder={SUBJECT_LINE_PLACEHOLDER}
            value={subjectLine}
            maxLength={125}
            onChange={(event) => setSubjectLine(event.target.value)}
          />
        </div>

        <label className="page-big-header">{TO_CC}</label>
        <div
          className={`create-btn add-email-address-btn ${emails.length < 20 ? "" : "disable-add-email"}`}
          onClick={() => emails.length < 20 ? addNewEmailAddress() : null}
        >
          <span className="material-symbols-outlined">add_2</span>
          {ADD_EMAIL_ADDRESS}
        </div>
        <CreateEmailList emails={emails} setEmails={setEmails}/>

        <label
          htmlFor="body"
          className="page-big-header create-email-section-spacing-top"
        >
          {BODY}
        </label>
        <div className="text-input-container">
          <textarea
            id="body"
            className="text-input create-email-section-spacing create-email-body"
            placeholder={BODY_PLACEHOLDER}
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </div>

        <div className="text-input-container create-email-btn">
          <button type="submit" className="form-btn">
            Continue
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEmail;
