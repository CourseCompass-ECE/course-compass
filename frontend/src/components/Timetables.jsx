import { useEffect } from "react";

const Timetables = (props) => {
  useEffect(() => {
    props.setIsUserLoggedIn(true);
  }, []);

  return <div>Timetables</div>;
};

export default Timetables;
