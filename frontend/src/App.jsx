import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { useState } from "react";
import Login from "./components/Login";
import LandingPage from "./components/LandingPage";
import CreateAccount from "./components/CreateAccount";
import Explore from "./components/Explore";
import ExploreCourseDetails from "./components/ExploreCourseDetails";
import Profile from "./components/Profile";
import ShoppingCart from "./components/ShoppingCart";
import Email from "./components/Email";
import CreateEmail from "./components/CreateEmail";
import Timetables from "./components/Timetables";
import CreateTimetable from "./components/CreateTimetable";
import Timetable from "./components/Timetable";
import { Path } from "./utils/enums";
import RootLayout from "./RootLayout";
import ErrorPage from "./components/ErrorPage";

function App() {
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <RootLayout isUserLoggedIn={isUserLoggedIn} setIsUserLoggedIn={setIsUserLoggedIn} />,
      errorElement: <ErrorPage isUserLoggedIn={isUserLoggedIn} setIsUserLoggedIn={setIsUserLoggedIn} />,
      children: [
        {
          path: Path.LOGIN,
          element: <Login />,
        },
        {
          path: Path.LANDING_PAGE,
          element: <LandingPage />,
        },
        {
          path: Path.CREATE_ACCOUNT,
          element: <CreateAccount />,
        },
        {
          path: Path.EXPLORE,
          element: <Explore />,
        },
        {
          path: Path.EXPLORE_COURSE,
          element: <ExploreCourseDetails />,
        },
        {
          path: Path.PROFILE,
          element: <Profile />,
        },
        {
          path: Path.SHOPPING_CART,
          element: <ShoppingCart />,
        },
        {
          path: Path.EMAIL,
          element: <Email />,
        },
        {
          path: Path.CREATE_EMAIL,
          element: <CreateEmail />,
        },
        {
          path: Path.TIMETABLES,
          element: <Timetables />,
        },
        {
          path: Path.CREATE_TIMETABLE,
          element: <CreateTimetable />,
        },
        {
          path: Path.TIMETABLE,
          element: <Timetable />,
        },
        // Todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?tab=t.0
      ],
    },
  ]);

  return <RouterProvider router={router} />;
}

export default App;
