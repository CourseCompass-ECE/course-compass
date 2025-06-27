import { useEffect } from "react";

const LandingPage = (props) => {
  useEffect(() => {
    props.setIsUserLoggedIn(false);
  }, []);

  return <div>Landing Page</div>;
};

export default LandingPage;
