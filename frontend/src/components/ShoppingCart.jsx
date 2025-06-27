import { useEffect } from "react";

const ShoppingCart = (props) => {

  useEffect(() => {
    props.setIsUserLoggedIn(true);
  }, []);

  return <div>Shopping Cart</div>;
};

export default ShoppingCart;
