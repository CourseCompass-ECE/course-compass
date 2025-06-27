import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useState } from "react";
import Login from "./components/Login";
import LandingPage from "./components/LandingPage";
import CreateAccount from "./components/CreateAccount";
import Explore from "./components/Explore";
import ExploreCourse from "./components/ExploreCourse";
import Profile from "./components/Profile";
import ShoppingCart from "./components/ShoppingCart";
import Email from "./components/Email";
import CreateEmail from "./components/CreateEmail";
import Timetables from "./components/Timetables";
import CreateTimetable from "./components/CreateTimetable";
import Timetable from "./components/Timetable";
import { Path } from "./utils/enums";

function App() {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  const router = createBrowserRouter([
    {
      path: Path.LOGIN,
      element: <Login setIsUserLoggedIn={setIsUserLoggedIn} />,
    },
    {
      path: Path.LANDING_PAGE,
      element: <LandingPage setIsUserLoggedIn={setIsUserLoggedIn} />,
    },
    {
      path: Path.CREATE_ACCOUNT,
      element: <CreateAccount setIsUserLoggedIn={setIsUserLoggedIn} />,
    },
    {
      path: Path.EXPLORE,
      element: <Explore setIsUserLoggedIn={setIsUserLoggedIn} />,
    },
    {
      path: Path.EXPLORE_COURSE,
      element: <ExploreCourse setIsUserLoggedIn={setIsUserLoggedIn} />,
    },
    {
      path: Path.PROFILE,
      element: <Profile setIsUserLoggedIn={setIsUserLoggedIn} />,
    },
    {
      path: Path.SHOPPING_CART,
      element: <ShoppingCart setIsUserLoggedIn={setIsUserLoggedIn} />,
    },
    {
      path: Path.EMAIL,
      element: <Email setIsUserLoggedIn={setIsUserLoggedIn} />,
    },
    {
      path: Path.CREATE_EMAIL,
      element: <CreateEmail setIsUserLoggedIn={setIsUserLoggedIn} />,
    },
    {
      path: Path.TIMETABLES,
      element: <Timetables setIsUserLoggedIn={setIsUserLoggedIn} />,
    },
    {
      path: Path.CREATE_TIMETABLE,
      element: <CreateTimetable setIsUserLoggedIn={setIsUserLoggedIn} />,
    },
    {
      path: Path.TIMETABLE,
      element: <Timetable setIsUserLoggedIn={setIsUserLoggedIn} />,
    },

    // Todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?tab=t.0
  ]);

  return (
    <div>
      <header>
        <div className="glassmorphism" />
        <div className="header-content-container">
          <div>C🧭urseC🧭mpass</div>
          <nav>
            <ul>
              <li>
                Login
              </li>
              <li>
                Create Account
              </li>
            </ul>
          </nav>
        </div>
        {/* Todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?tab=t.0 */}
      </header>
      <main>
        <RouterProvider router={router} />
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
}

export default App;
