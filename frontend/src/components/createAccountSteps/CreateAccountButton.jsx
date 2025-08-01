const CreateAccountButton = (props) => {
  return (
    <div className="text-input-container create-account-btn">
      <button
        type="submit"
        className="form-btn"
        onClick={(event) =>
          props.submitStepThree ? props.submitStepThree(event) : null
        }
      >
        {props.buttonText}
      </button>
      {props.submissionError ? (
        <span className="text-input-error submission-error create-account-submission-error">
          {props.submissionError}
        </span>
      ) : null}
    </div>
  );
};

export default CreateAccountButton;
