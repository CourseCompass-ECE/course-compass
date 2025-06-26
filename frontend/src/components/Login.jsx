import { useState } from "react";

const Login = () => {
  const [emailUsername, setEmailUsername] = useState("");
  const [password, setPassword] = useState("");

  return (
    <form className="login-form">
      <h1 className="login-form-title">Login</h1>
      <label htmlFor="email-username">Email or Username</label>
      <input
        id="email-username"
        type="text"
        className="text-input"
        placeholder="Email or Username"
        value={emailUsername}
        onChange={(event) => setEmailUsername(event.target.value)}
      />
      <label htmlFor="password">Password</label>
      <input
        id="password"
        type="text"
        className="text-input"
        placeholder="Password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
    </form>
  );
};

export default Login;
