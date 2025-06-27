// Todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?tab=t.0
import { useEffect } from "react";

const ExploreCourse = (props) => {

  useEffect(() => {
    props.setIsUserLoggedIn(true);
  }, []);

  return <div>Explore Course</div>;
};

export default ExploreCourse;
