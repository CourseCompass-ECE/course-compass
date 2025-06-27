import { useEffect } from "react";

const Profile = (props) => {

  useEffect(() => {
    props.setIsUserLoggedIn(true);
  }, []);

  return <div>Profile</div>;
};

export default Profile;
