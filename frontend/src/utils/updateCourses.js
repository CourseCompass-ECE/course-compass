import { sortByFavorites } from "./sort";

export const updateCoursesInCart = (
  updatedCourse,
  setCoursesInCart,
  coursesInCart
) => {
  setCoursesInCart(
    sortByFavorites(
      coursesInCart
        ?.map((course) =>
          course.id === updatedCourse.id ? updatedCourse : course
        )
        .filter((course) => course.inUserShoppingCart)
    )
  );
};
