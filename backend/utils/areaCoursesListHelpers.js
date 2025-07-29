export const updateAreaCoursesList = (courseObject, areaCoursesList) => {
  courseObject.course.area.forEach((area) => {
    areaCoursesList
      .find((areaCourseList) => areaCourseList.area === area)
      ?.courses?.push(courseObject.course);
  });
};

export const initializeAreaCoursesList = (areaCourseList, kernelAreas) => {
  kernelAreas.forEach((area) => {
    areaCourseList.push({ area, courses: [] });
  });
  return areaCourseList;
};