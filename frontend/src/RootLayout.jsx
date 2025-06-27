import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

const RootLayout = () => {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setIsUserLoggedIn(location.pathname.includes("/user"));
  }, [location.pathname]);

  return (
    <div>
      <header>
        <div className="glassmorphism" />
        <div className="header-content-container">
          <div>C🧭urseC🧭mpass</div>
          <nav>
            <ul>
              <li>Login</li>
              <li>Create Account</li>
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
        <div>
          <span>
            {isUserLoggedIn ? "USER LOGGED IN" : "USER NOT LOGGED IN"}
          </span>
        </div>
        <h2 className="footer-text">&copy; 2025 CourseCompass</h2>
      </footer>
    </div>
  );
};

export default RootLayout;
