import { useEffect } from "react";

const Email = (props) => {

  useEffect(() => {
    props.setIsUserLoggedIn(true);
  }, []);

  return <div>Email</div>;
};

export default Email;
