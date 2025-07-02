import { useState } from "react";
import { EMAIL_TOPICS, ALL_EMAIL_TOPICS } from "../utils/constants";
import { useNavigate } from "react-router-dom";
import { Path } from "../utils/enums";

const Email = () => {
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState(ALL_EMAIL_TOPICS);
  const TITLE = "Email";
  const BUTTON_TEXT = "Create Email";
  const SENT_EMAILS = "Sent Emails";

  return (
    <div className="page-container">
      <h1 className="page-title">{TITLE}</h1>
      <button
        className="create-btn"
        onClick={() => navigate(Path.CREATE_EMAIL)}
      >
        <span className="material-symbols-outlined">add_2</span>
        {BUTTON_TEXT}
      </button>
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
    </div>
  );
};
export default Email;
