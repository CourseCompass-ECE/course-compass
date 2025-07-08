import { useState, useEffect } from "react";
import { Path } from "../utils/enums";
import ExploreCourseList from "./exploreCourseList/ExploreCourseList";

const ShoppingCart = () => {
  const [coursesInCart, setCoursesInCart] = useState([]);
  const [fetchCoursesError, setFetchCoursesError] = useState("");
  const FETCH_COURSES_ERROR_MESSAGE =
    "Something went wrong fetching courses in shopping cart";
  const SHOPPING_CART = "Shopping Cart";

  const fetchCoursesInCart = async () => {
    setFetchCoursesError("");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}${Path.SHOPPING_CART}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCoursesInCart(
          data?.courses.sort((courseA, courseB) => {
            if (courseA.inUserFavorites) {
              return -1;
            } else if (courseB.inUserFavorites) {
              return 1;
            } else {
              return 0;
            }
          })
        );
      } else {
        setFetchCoursesError(FETCH_COURSES_ERROR_MESSAGE);
      }
    } catch (error) {
      setFetchCoursesError(FETCH_COURSES_ERROR_MESSAGE);
    }
  };

  useEffect(() => {
    fetchCoursesInCart();
  }, []);

  return (
    <div className="explore-container">
      {!fetchCoursesError ? (
        <>
          <h1 className="page-title" style={{textAlign: 'center'}}>{SHOPPING_CART}</h1>
          <ExploreCourseList
            fetchAllCourseData={fetchCoursesInCart}
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
