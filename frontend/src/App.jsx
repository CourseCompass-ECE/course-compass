import "./App.css";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./components/Login";
import { Path } from "./utils/enums";

function App() {
  const routes = createBrowserRouter([
    {
      path: Path.LOGIN,
      element: <Login />,
    },
    {
      path: "*",
      element: <></>,
    },
    // Todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?tab=t.0
  ]);

  return (
    <div>
      <header>
        <div className="glassmorphism" />
        {/* Todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?tab=t.0 */}
      </header>
      <main>
        <RouterProvider router={routes} />
      </main>
      <footer>
        {/* Todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?tab=t.0 */}
        <div></div>
        <h2 className="footer-text">&copy; 2025 CourseCompass</h2>
      </footer>
    </div>
  );
}

export default App;
