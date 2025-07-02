import { useState } from "react";
import { EMAIL_TOPICS } from "../utils/constants";

const Email = () => {
  const [selectedTopic, setSelectedTopic] = useState("All Email Topics");
  const TITLE = "Email";
  const BUTTON_TEXT = "Create Email";
  const SENT_EMAILS = "Sent Emails";
  const EMAIL_TOPIC = "Email Topic";

  return (
    <div className="page-container">
      <h1 className="page-title">{TITLE}</h1>
      <button className="create-btn">
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
