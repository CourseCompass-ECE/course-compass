import { Outlet, useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Path } from "./utils/enums";
import { TAGLINE, CREATE_ACCOUNT } from "./utils/constants";
import { useNavigate } from "react-router-dom";
import { checkUserLoggedIn } from "./utils/authFunctions";

const RootLayout = (props) => {
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState("");
  const location = useLocation();
  const headerIcons = ["mail", "shopping_cart"];
  const headerIconsPath = [Path.EMAIL, Path.SHOPPING_CART];
  const EXPLORE = "Explore";
  const LOGIN = "Login";
  const TIMETABLES = "Timetables";
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

  useEffect(() => {
    const userAuthentication = async () => {
      const loggedInStatus = await checkUserLoggedIn(props.setIsUserLoggedIn);
      const onPageWhereUserLoggedIn = location.pathname.includes("/user");
      
      if (!loggedInStatus && (onPageWhereUserLoggedIn || location.pathname === "/")) {
        navigate(Path.LOGIN);
      } else if (loggedInStatus && !onPageWhereUserLoggedIn) {
        navigate(Path.EXPLORE);
      }
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
            to={props.isUserLoggedIn ? Path.EXPLORE : Path.LOGIN}
          >
            C<span className="header-title-compass">🧭</span>urseC
            <span className="header-title-compass">🧭</span>mpass
          </Link>
          <nav>
            <ul className="header-ul">
              <li className="header-li">
                <Link
                  className="header-link"
                  to={props.isUserLoggedIn ? Path.EXPLORE : Path.LOGIN}
                >
                  {props.isUserLoggedIn ? EXPLORE : LOGIN}
                </Link>
              </li>

              <li className="header-li">
                <Link
                  className="header-link"
                  to={props.isUserLoggedIn ? Path.TIMETABLES : Path.CREATE_ACCOUNT}
                >
                  {props.isUserLoggedIn ? TIMETABLES : CREATE_ACCOUNT}
                </Link>
              </li>

              {headerIcons.map((icon, index) => (
                <li
                  key={index}
                  className="header-li"
                  style={props.isUserLoggedIn ? {} : { display: "none" }}
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
                style={props.isUserLoggedIn ? {} : { display: "none" }}
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
      </header>
      <main>
        <Outlet />
      </main>
      <footer>
        <div className="footer-text footer-tagline">{TAGLINE}</div>
        <div className="footer-text">&copy; 2025 CourseCompass</div>
      </footer>
    </div>
  );
};

export default RootLayout;
