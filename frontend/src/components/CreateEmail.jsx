import { useEffect } from "react";

const CreateEmail = (props) => {
  useEffect(() => {
    props.setIsUserLoggedIn(true);
  }, []);

  return <div>Create Email</div>;
};

export default CreateEmail;
