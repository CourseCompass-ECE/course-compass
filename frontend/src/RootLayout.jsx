import { Outlet, useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Path } from "./utils/enums";
import { TAGLINE } from "./utils/constants";

const RootLayout = () => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const location = useLocation();
  const headerIcons = ["mail", "shopping_cart", "account_circle"];
  const headerIconsPath = [Path.EMAIL, Path.SHOPPING_CART, Path.PROFILE];
  const EXPLORE = "Explore";
  const LOGIN = "Login";
  const TIMETABLES = "Timetables";
  const CREATE_ACCOUNT = "Create Account";

  useEffect(() => {
    setIsUserLoggedIn(location.pathname.includes("/user"));
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
