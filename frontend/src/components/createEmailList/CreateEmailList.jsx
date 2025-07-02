const CreateEmailList = (props) => {
  const EMAIL_ADDRESS_PLACEHOLDER = "Enter email address";
  const TO = "To";
  const CC = "CC";

  const updateEmailAddress = (newEmailAddress, index) => {
    const newEmails = props.emails.map((email, idx) => {
      if (idx === index) {
        return { ...email, emailAddress: newEmailAddress };
      }
      return email;
    });
    props.setEmails(newEmails);
  };

  const changeToOrCC = (event, toOrCC, index) => {
    event.preventDefault();
    const newEmails = props.emails.map((email, idx) => {
      if (idx === index) {
        return { ...email, toOrCC: toOrCC };
      }
      return email;
    });
    props.setEmails(newEmails);
  };

  return (
    <>
      {props.emails.map((email, index) => (
        <div key={index} className="email-container">
          <div className="text-input-container">
            <input
              type="text"
              className="text-input email-input"
              placeholder={EMAIL_ADDRESS_PLACEHOLDER}
              value={email.emailAddress}
              maxLength={125}
              onChange={(event) =>
                updateEmailAddress(event.target.value, index)
              }
            />
          </div>
          <button
            onClick={(event) => changeToOrCC(event, TO, index)}
            className={`form-btn email-list-btn ${
              email.toOrCC === TO ? "email-list-btn-selected" : ""
            }`}
          >
            {TO}
          </button>
          <button
            onClick={(event) => changeToOrCC(event, CC, index)}
            className={`form-btn email-list-btn ${
              email.toOrCC === CC ? "email-list-btn-selected" : ""
            }`}
          >
            {CC}
          </button>
          <div>
            <span
              onClick={() =>
                props.setEmails(
                  props.emails.filter((email, idx) => idx !== index)
                )
              }
              className="material-symbols-outlined email-remove"
            >
              close
            </span>
          </div>
        </div>
      ))}
    </>
  );
};

export default CreateEmailList;
