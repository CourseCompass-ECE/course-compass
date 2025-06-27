import { useState } from "react";

const CreateAccount = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [fullNameError, setFullNameError] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const createAccount = (event) => {
    event.preventDefault();
  };

  return (
    <>
      <form
        className="create-account-form"
        onSubmit={(event) => createAccount(event)}
      >
        <h1 className="create-account-form-title">Create Account</h1>
        <div className="text-input-container">
          <input
            type="text"
            className="text-input"
            placeholder="Full Name"
            value={fullName}
            maxLength={100}
            onChange={(event) => setFullName(event.target.value)}
          />
          <span className="text-input-error">{fullNameError}</span>
        </div>

        <div className="text-input-container">
          <input
            type="text"
            className="text-input"
            placeholder="Email"
            value={email}
            maxLength={254}
            onChange={(event) => setEmail(event.target.value)}
          />
          <span className="text-input-error">{emailError}</span>
        </div>

        <div className="text-input-container">
          <div className="create-account-password-container">
            <input
              type={isPasswordVisible ? "text" : "password"}
              className="text-input"
              placeholder="Password"
              value={password}
              maxLength={30}
              onChange={(event) => setPassword(event.target.value)}
            />
            <span
              className="material-symbols-outlined create-account-password-eye-icon"
              onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            >
              {isPasswordVisible ? "visibility_off" : "visibility"}
            </span>
          </div>
          <span className="text-input-error">{passwordError}</span>
        </div>

        <button type="submit" className="form-btn">
          Continue
        </button>
      </form>
      <aside>
        
      </aside>
    </>
  );
};

export default CreateAccount;
