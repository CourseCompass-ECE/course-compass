import { GENERIC_ERROR } from "../../frontend/src/utils/constants.js";
import User from "../api/user-model.js";

const NO_COURSE = "No Overloaded Course";
const NO_CODE = "Not Applicable";

export const findOverloadedCourses = async (userId, courseIds, timetableId) => {
  const user = await User.findUserById(userId);
  const timetable = await User.findUserTimetableByIds(timetableId, userId);
  if (!user || !timetable) throw new Error(GENERIC_ERROR);

  let overloadedCourses = [...Array(4)]?.map((_, term) => {
    return {
      title: NO_COURSE,
      code: NO_CODE,
      id: null,
      term: term + 1,
    };
  });

  return [{ score: 10, courses: overloadedCourses },{ score: 15, courses: overloadedCourses },{ score: 20, courses: overloadedCourses },];
};
