const SentEmailsList = (props) => {
  const NO_EMAILS = "No emails created";
  const TOPIC = "Topic: ";
  const TO_EMAILS = "To: ";
  const CC_EMAILS = "Cc: ";
  const BODY = "Body:";
  return (
    <div>
      {props.emails.length === 0 ? (
        <h3 className="no-emails-message">{NO_EMAILS}</h3>
      ) : (
        <div className="sent-emails-container">
          {props.emails.map((email, index) => {
            return (
              <div key={index} className="sent-email-container">
                <h3 className="email-title">{email.subjectLine}</h3>
                <h4 className="email-header">
                  {TOPIC}
                  {email.topic}
                </h4>
                <h4 className="email-header">
                  {TO_EMAILS}
                  {email.to.map((toEmail, index) => {
                    return `${toEmail}${
                      index === email.to.length - 1 ? "" : ","
                    } `;
                  })}
                </h4>
                <h4 className="email-header">
                  {CC_EMAILS}
                  {email.cc.length === 0
                    ? "No Cc Emails"
                    : email.cc.map((ccEmail, index) => {
                        return `${ccEmail}${
                          index === email.cc.length - 1 ? "" : ","
                        } `;
                      })}
                </h4>
                <h4 className="email-header">{BODY}</h4>
                <h5 className="email-header email-body">{email.body}</h5>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SentEmailsList;
