import { Path } from "./enums";
import { sortByFavorites } from "./sort";

const FETCH_COURSES_ERROR_MESSAGE =
    "Something went wrong fetching courses in shopping cart";

export const fetchCoursesInCart = async (setFetchCoursesError, setCoursesInCart) => {
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
          sortByFavorites(data?.courses)
        );
      } else {
        setFetchCoursesError(FETCH_COURSES_ERROR_MESSAGE);
      }
    } catch (error) {
      setFetchCoursesError(FETCH_COURSES_ERROR_MESSAGE);
    }
  };