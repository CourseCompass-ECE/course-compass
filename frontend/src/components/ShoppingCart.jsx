import { useState, useEffect } from "react";
import { Path } from "../utils/enums";
import ExploreCourseList from "./exploreCourseList/ExploreCourseList";
import { SHOPPING_CART } from "../utils/constants";
import { fetchCoursesInCart } from "../utils/fetchShoppingCart";

const ShoppingCart = () => {
  const [coursesInCart, setCoursesInCart] = useState([]);
  const [fetchCoursesError, setFetchCoursesError] = useState("");

  const fetchShoppingCart = async () => {
    await fetchCoursesInCart(
      setFetchCoursesError,
      setCoursesInCart
    );
  };

  useEffect(() => {
    fetchShoppingCart();
  }, []);

  return (
    <div className="explore-container">
      {!fetchCoursesError ? (
        <>
          <h1 className="page-title" style={{ textAlign: "center" }}>
            {SHOPPING_CART}
          </h1>
          <ExploreCourseList
            fetchAllCourseData={fetchShoppingCart}
            courses={coursesInCart}
          />
        </>
      ) : (
        <h1 className="explore-error">{fetchCoursesError}</h1>
      )}
    </div>
  );
};

export default ShoppingCart;
