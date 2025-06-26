import { useState } from "react";

const Login = () => {
  const [emailUsername, setEmailUsername] = useState("");
  const [emailUsernameError, setEmailUsernameError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const EMAIL_USERNAME_EMPTY_ERROR = "Email or username is required";
  const PASSWORD_EMPTY_ERROR = "Password is required";

  const login = (event) => {
    event.preventDefault();
    setEmailUsernameError("");
    setPasswordError("");

    if (!emailUsername) {
      setEmailUsernameError(EMAIL_USERNAME_EMPTY_ERROR);
      return;
    } else if (!password) {
      setPasswordError(PASSWORD_EMPTY_ERROR);
      return;
    }
  };

  return (
    <form className="login-form" onSubmit={(event) => login(event)}>
      <h1 className="login-form-title">Login</h1>
      <div className="text-input-container">
        <input
          type="text"
          className="text-input"
          placeholder="Email or Username"
          value={emailUsername}
          maxLength={254}
          onChange={(event) => setEmailUsername(event.target.value)}
        />
        <span className="text-input-error">{emailUsernameError}</span>
      </div>

      <div className="text-input-container">
        <div className="login-password-container">
          <input
            type={isPasswordVisible ? "text" : "password"}
            className="text-input"
            placeholder="Password"
            value={password}
            maxLength={30}
            onChange={(event) => setPassword(event.target.value)}
          />
          <span
            class="material-symbols-outlined login-password-eye-icon"
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
  );
};

export default Login;
