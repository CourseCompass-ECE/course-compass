import { useEffect, useState } from "react";
import { checkUserLoggedIn } from "../utils/functions";
import { Link } from "react-router-dom";
import { Path } from "../utils/enums";

const ErrorPage = () => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const LOGGED_IN_PAGE = "Explore Page";
  const LOGGED_OUT_PAGE = "Login Page";

  useEffect(() => {
    const setLoggedInStatus = async () => {
      setIsUserLoggedIn(await checkUserLoggedIn());
    };

    setLoggedInStatus();
  }, []);

  return (
    <div className="error-page-container">
      <h1 className="error-page-title">
        <div>
          C<span className="error-page-compass">🧭</span>urse
        </div>
        <div className="error-page-swing">
          C<span className="error-page-compass">🧭</span>mpass
        </div>
      </h1>
      <h2 className="error-page-message">
        Page Not Found | Return to{" "}
        <Link
          className="error-page-link"
          to={isUserLoggedIn ? Path.EXPLORE : Path.LOGIN}
        >
          {isUserLoggedIn ? LOGGED_IN_PAGE : LOGGED_OUT_PAGE}
        </Link>
      </h2>
    </div>
  );
};

export default ErrorPage;
