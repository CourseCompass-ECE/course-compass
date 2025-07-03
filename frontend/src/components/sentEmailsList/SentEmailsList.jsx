const SentEmailsList = (props) => {
  return (
    <div>
      {props.emails.length === 0 ? (
        <h3 className="no-emails-message">No emails created</h3>
      ) : (
        <div className="sent-emails-container">
          {props.emails.map((email, index) => {
            return (
            <div key={index} className="sent-email-container">
              <h3 className="email-title">{email.subjectLine}</h3>
              <h4 className="email-header">Topic: {email.topic}</h4>
              <h4 className="email-header">
                To:{" "}
                {email.to.map((toEmail, index) => {
                  return `${toEmail}${
                    index === email.to.length - 1 ? "" : ","
                  } `;
                })}
              </h4>
              <h4 className="email-header">
                Cc:{" "}
                {email.cc.length === 0 ? "No Cc Emails" : email.cc.map((ccEmail, index) => {
                  return `${ccEmail}${
                    index === email.cc.length - 1 ? "" : ","
                  } `;
                })}
              </h4>
              <h4 className="email-header">Body:</h4>
              <h5 className="email-header email-body">{email.body}</h5>
            </div>
          )})}
        </div>
      )}
    </div>
  );
};

export default SentEmailsList;
