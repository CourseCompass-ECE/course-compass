export const sortByFavorites = (courseList) => {
  return courseList.sort((courseA, courseB) => {
    if (courseA?.inUserFavorites) {
      return -1;
    } else if (courseB?.inUserFavorites) {
      return 1;
    } else {
      return 0;
    }
  });
};
