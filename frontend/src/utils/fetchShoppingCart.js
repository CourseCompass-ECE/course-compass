import { Path } from "./enums";

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