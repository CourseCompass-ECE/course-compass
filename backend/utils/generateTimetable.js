import Course from "../api/course-model.js";
import { createIdListFromObjectList } from "./findRecommendedCourses.js";

const MINIMUM_COURSES = 20;
const NOT_ENOUGH_COURSES_ERROR =
  "A minimum of 20 courses are required in the shopping cart to generate a timetable";
const NOT_ENOUGH_COURSES_AFTER_REFINING_ERROR =
  "A minimum of 20 courses are required in the shopping cart, with all course requirements met by other shopping cart courses, to generate a timetable";

const isPrereqOrCoreqMet = (
  prereqOrCoreqList,
  prereqOrCoreqAmount,
  shoppingCartIdList
) => {
  if (prereqOrCoreqAmount === 0) return true;
  let requirementsMet = 0;
  prereqOrCoreqList.forEach((requirementCourse) => {
    if (shoppingCartIdList.has(requirementCourse.id)) {
      requirementsMet++;
      if (requirementsMet === prereqOrCoreqAmount) return true;
    }
  });
  return false;
};

const areMinimumRequirementsMet = (course, shoppingCartIdList) => {
  if (
    !isPrereqOrCoreqMet(
      course.prerequisites,
      course.prerequisiteAmount,
      shoppingCartIdList
    ) ||
    !isPrereqOrCoreqMet(
      course.corequisites,
      course.corequisiteAmount,
      shoppingCartIdList
    )
  )
    return false;

  return true;
};

export const generateTimetable = async (userId) => {
  const shoppingCartCourses = await Course.findCoursesInCart(userId);
  if (shoppingCartCourses.length < MINIMUM_COURSES)
    throw new Error(NOT_ENOUGH_COURSES_ERROR);

  const shoppingCartIdList = new Set(
    createIdListFromObjectList(shoppingCartCourses)
  );
  const refinedShoppingCart = shoppingCartCourses.filter((cartCourse) =>
    areMinimumRequirementsMet(cartCourse, shoppingCartIdList)
  );

  if (refinedShoppingCart.length < MINIMUM_COURSES)
    throw new Error(NOT_ENOUGH_COURSES_AFTER_REFINING_ERROR);
};
