import { useState } from "react";
import { EMAIL_TOPICS, ALL_EMAIL_TOPICS } from "../utils/constants";
import { useNavigate } from "react-router-dom";
import { Path } from "../utils/enums";
import { useEffect } from "react";
import SentEmailsList from "./sentEmailsList/SentEmailsList";

const Email = () => {
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState(ALL_EMAIL_TOPICS);
  const [emails, setEmails] = useState([]);
  const [fetchError, setFetchError] = useState("");
  const TITLE = "Email";
  const BUTTON_TEXT = "Create Email";
  const SENT_EMAILS = "Sent Emails";
  const FETCH_EMAILS_ERROR_MESSAGE = "Something went wrong fetching emails";

  const fetchAllEmails = async () => {
    setFetchError("");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${Path.EMAIL}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setEmails(data?.emails);
      } else {
        setFetchError(FETCH_EMAILS_ERROR_MESSAGE);
      }
    } catch (error) {
      setFetchError(FETCH_EMAILS_ERROR_MESSAGE);
    }
  };

  useEffect(() => {
    fetchAllEmails();
  }, []);

  return (
    <div className="page-container">
      <h1 className="page-title">{TITLE}</h1>
      <div className="create-btn-height">
        <div className="create-btn" onClick={() => navigate(Path.CREATE_EMAIL)}>
          <span className="material-symbols-outlined">add_2</span>
          {BUTTON_TEXT}
        </div>
      </div>
      <div className="email-sent-filter-container">
        <h2 className="page-big-header">{SENT_EMAILS}</h2>
        <select
          value={selectedTopic}
          className="text-input email-topic-dropdown"
          onChange={(event) => setSelectedTopic(event.target.value)}
        >
          {EMAIL_TOPICS.map((topic, index) => (
            <option key={index} value={topic}>
              {topic}
            </option>
          ))}
        </select>
      </div>

      <SentEmailsList emails={selectedTopic === ALL_EMAIL_TOPICS ? emails : emails.filter((email) => email.topic === selectedTopic)} />

      <div className="text-input-error fetch-emails-error">{fetchError}</div>
    </div>
  );
};
export default Email;
