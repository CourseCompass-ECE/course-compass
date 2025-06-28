import { useState } from "react";
import { Path } from "../utils/enums";
import {
  GENERIC_ERROR,
  INVALID_LOGIN_ERROR,
  EMAIL_ERROR,
} from "../utils/constants";
import { EMAIL_REGEX } from "../utils/regex";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const navigate = useNavigate();

  const PASSWORD_EMPTY_ERROR = "Password is required";

  const login = async (event) => {
    event.preventDefault();
    setEmailError("");
    setPasswordError("");
    setSubmissionError("");

    if (!EMAIL_REGEX.test(email)) {
      setEmailError(EMAIL_ERROR);
      return;
    } else if (!password) {
      setPasswordError(PASSWORD_EMPTY_ERROR);
      return;
    }

    const userEmail = email.trim();

    try {
      const userCredentials = {
        email: userEmail,
        password,
      };

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${Path.LOGIN}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userCredentials),
          credentials: "include",
        }
      );

      if (response.ok) {
        navigate(Path.EXPLORE);
      } else {
        const data = await response.json();
        setSubmissionError(
          data.message === INVALID_LOGIN_ERROR
            ? INVALID_LOGIN_ERROR
            : GENERIC_ERROR
        );
      }
    } catch (error) {
      setSubmissionError(GENERIC_ERROR);
    }
  };

  return (
    <form className="login-form" onSubmit={(event) => login(event)}>
      <h1 className="login-form-title">Login</h1>
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
            className="material-symbols-outlined login-password-eye-icon"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
          >
            {isPasswordVisible ? "visibility_off" : "visibility"}
          </span>
        </div>
        <span className="text-input-error">{passwordError}</span>
      </div>

      <div className="text-input-container">
        <button type="submit" className="form-btn">
          Continue
        </button>
        <span className="text-input-error submission-error">
          {submissionError}
        </span>
      </div>
    </form>
  );
};

export default Login;
