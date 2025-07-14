const {
  NUM_DAYS_ROLLING_AVERAGE,
  findRecommendedCourses,
  createIdListFromObjectList,
} = require("../utils/findRecommendedCourses");
const Course = require("../api/course-model");

const userId = 1;
const expectedCourseFields = {
  id: expect.any(Number),
  description: expect.any(String),
  area: expect.arrayContaining([expect.any(String)]),
  code: expect.any(String),
  title: expect.any(String),
  prerequisiteAmount: expect.any(Number),
  corequisiteAmount: expect.any(Number),
  lectureHours: expect.any(Number),
  tutorialHours: expect.any(Number),
  practicalHours: expect.any(Number),
  minorsCertificates: expect.any(Array),
  prerequisites: expect.any(Array),
  corequisites: expect.any(Array),
  exclusions: expect.any(Array),
  recommendedPrep: expect.any(Array),
  inUserShoppingCart: expect.any(Boolean),
  inUserFavorites: expect.any(Boolean),
  skillsInterests: expect.any(Array),
  score: expect.any(Number),
};

// Wording of test title based on documentation (https://jestjs.io/docs/asynchronous)
test("the recommendation function returns list of course objects with a valid course structure", async () => {
  const courses = await Course.findCourses(userId);
  const cartCourses = await Course.findCoursesInCart(userId);
  const recommendedCourses = await findRecommendedCourses(
    courses,
    userId,
    true
  );
  expect(recommendedCourses).toEqual(
    courses.length === cartCourses.length
      ? expect.any(Array)
      : expect.arrayContaining([expect.objectContaining(expectedCourseFields)])
  );
});

test("the recommendation function returns list with length of at least the rolling average window", async () => {
  const courses = await Course.findCourses(userId);
  const shoppingCartCourseIds = new Set(
    createIdListFromObjectList(await Course.findCoursesInCart(userId))
  );
  let coursesNotInCart = courses.filter(
    (course) => !shoppingCartCourseIds.has(course.id)
  );
  const recommendedCourses = await findRecommendedCourses(
    courses,
    userId,
    true
  );
  expect(recommendedCourses.length).toBeGreaterThanOrEqual(
    coursesNotInCart.length >= NUM_DAYS_ROLLING_AVERAGE * 2
      ? NUM_DAYS_ROLLING_AVERAGE
      : coursesNotInCart.length
  );
});
