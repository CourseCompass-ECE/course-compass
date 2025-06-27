import { useEffect } from "react";

const Explore = (props) => {

  useEffect(() => {
    props.setIsUserLoggedIn(true);
  }, []);

  return <div>Explore</div>;
};

export default Explore;
