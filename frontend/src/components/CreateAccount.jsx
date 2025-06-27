import { useEffect } from "react";

const CreateAccount = (props) => {

  useEffect(() => {
    props.setIsUserLoggedIn(false);
  }, []);

  return <div>Create Account</div>;
};

export default CreateAccount;
