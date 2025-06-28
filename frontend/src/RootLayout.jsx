import { Outlet, useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Path } from "./utils/enums";
import { TAGLINE, LOGGED_IN } from "./utils/constants";
import { useNavigate } from "react-router-dom";

const RootLayout = () => {
  const navigate = useNavigate();
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const location = useLocation();
  const headerIcons = ["mail", "shopping_cart", "account_circle"];
  const headerIconsPath = [Path.EMAIL, Path.SHOPPING_CART, Path.PROFILE];
  const EXPLORE = "Explore";
  const LOGIN = "Login";
  const TIMETABLES = "Timetables";
  const CREATE_ACCOUNT = "Create Account";
  const LOGOUT_ERROR = "Error logging out";

  const logout = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${Path.LOGOUT}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (response.ok) {
        navigate(Path.LOGIN);
      } else {
        setLogoutError(LOGOUT_ERROR);
      }
    } catch (error) {
      setLogoutError(LOGOUT_ERROR);
    }
  };

  const checkUserLoggedIn = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${Path.CHECK_CREDENTIALS}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data?.message === LOGGED_IN;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    const userAuthentication = async () => {
      const userLoggedIn = await checkUserLoggedIn();
      const onPageWhereUserLoggedIn = location.pathname.includes("/user");
      
      if (!userLoggedIn && onPageWhereUserLoggedIn) {
        navigate(Path.LOGIN);
      } else if (userLoggedIn && !onPageWhereUserLoggedIn) {
        navigate(Path.EXPLORE);
      }
      setIsUserLoggedIn(onPageWhereUserLoggedIn);
    };

    userAuthentication();
  }, [location.pathname]);

  return (
    <div>
      <header>
        <div className="glassmorphism" />
        <div className="header-content-container">
          <Link
            className="header-title"
            to={isUserLoggedIn ? Path.EXPLORE : Path.LANDING_PAGE}
          >
            C<span className="header-title-compass">🧭</span>urseC
            <span className="header-title-compass">🧭</span>mpass
          </Link>
          <nav>
            <ul className="header-ul">
              <li className="header-li">
                <Link
                  className="header-link"
                  to={isUserLoggedIn ? Path.EXPLORE : Path.LOGIN}
                >
                  {isUserLoggedIn ? EXPLORE : LOGIN}
                </Link>
              </li>

              <li className="header-li">
                <Link
                  className="header-link"
                  to={isUserLoggedIn ? Path.TIMETABLES : Path.CREATE_ACCOUNT}
                >
                  {isUserLoggedIn ? TIMETABLES : CREATE_ACCOUNT}
                </Link>
              </li>

              {headerIcons.map((icon, index) => (
                <li
                  key={index}
                  className="header-li"
                  style={isUserLoggedIn ? {} : { display: "none" }}
                >
                  <Link className="header-link" to={headerIconsPath[index]}>
                    <span className="material-symbols-outlined header-icon">
                      {icon}
                    </span>
                  </Link>
                </li>
              ))}
              <li
                className="header-li logout"
                style={isUserLoggedIn ? {} : { display: "none" }}
              >
                <span
                  className="material-symbols-outlined header-icon"
                  onClick={logout}
                >
                  logout
                </span>
                <div className="logout-error">{logoutError}</div>
              </li>
            </ul>
          </nav>
        </div>
        {/* Todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?tab=t.0 */}
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        {/* Todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?tab=t.0 */}
        <div className="footer-text footer-tagline">{TAGLINE}</div>
        <div className="footer-text">&copy; 2025 CourseCompass</div>
      </footer>
    </div>
  );
};

export default RootLayout;
