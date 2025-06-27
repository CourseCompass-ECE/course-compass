import { useEffect } from "react";

const CreateTimetable = (props) => {
  useEffect(() => {
    props.setIsUserLoggedIn(true);
  }, []);

  return <div>Create Timetable</div>;
};

export default CreateTimetable;
