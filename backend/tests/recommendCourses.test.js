const {
  NUM_COURSES_ROLLING_AVERAGE,
  findRecommendedCourses,
  createIdListFromObjectList,
  findMatchesToRelatedUsersCourses,
  calculateScoreFromSimilarity,
  cleanseText,
  CART_WORD_MATCH,
  CART_DESIGNATION_MATCH,
  CART_AREA_MATCH,
  CART_MINOR_MATCH,
  CART_CERTIFICATE_MATCH,
  CART_SPECIFIC_SKILL_INTEREST_MATCH,
  CART_GENERIC_SKILL_INTEREST_MATCH,
  CART_PREREQ_COREQ_PREP_FROM_CART,
  CART_PREREQ_COREQ_PREP_FROM_COURSE,
  CART_EXCLUSION,
  EXACT_MATCH_BASE_PENALTY_PERCENTAGE,
  CONSIDER_WORD_MATCH_FREQUENCY,
} = require("../utils/findRecommendedCourses");
const Course = require("../api/course-model");
const User = require("../api/user-model");

const userId = 1;
const otherUserId = 4;
const OTHER_USER_SCORE = 14;
const SHOPPING_CART_MULTIPLIER = 1;
const COMPUTER_SECURITY_CODE = "ECE568H1";
const TOTAL_SCORE_BOOST = 115;
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
    true,
    false,
    []
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
    true,
    false,
    []
  );
  expect(recommendedCourses.length).toBeGreaterThanOrEqual(
    coursesNotInCart.length >= NUM_COURSES_ROLLING_AVERAGE * 2
      ? NUM_COURSES_ROLLING_AVERAGE
      : coursesNotInCart.length
  );
});

/**
 * user of focus is a user with the following traits:
 * ECE Areas: Energy & Electromagnetics, Photonics & Semiconductor Physics
 * Interests: Data Science, Dentistry, Digital Communication, Digital Marketing, Dance Studies
 * Skills: Data Analysis, Data Literacy, Debate, Design Thinking, Developing a Hypothesis
 * Minors: Global Leadership
 * Certificates: Forensic Engineering
 * Designation: Electrical Engineering
 * Learning Goals (done to test word matches with frequency of each word match considered): d, d, d
 *
 * otherUser is a user with the following traits:
 * ECE Areas: Software, Computer Hardware & Computer Networks
 * Interests: Data Science, Cybersecurity, Artificial Intelligence, Robotics, Quantum Physics
 * Skills: Technology, Research, Analysis, Academic Writing, Studying & Learning
 * Minors: Artificial Intelligence Engineering
 * Certificates: Engineering Leadership
 * Designation: Computer Engineering
 * Learning Goals (done to test word matches with frequency of each word match considered): d d, d, d
 */
// otherUser is a user with the following traits:
test("the user similarity scoring function returns expected score when comparing a user with set attributes to another user with set attributes", async () => {
  const user = await User.findUserById(userId);
  const courses = await Course.findCourses(userId);

  const similarUsers = await findMatchesToRelatedUsersCourses(
    user,
    [],
    [],
    courses
  );

  expect(
    similarUsers.find((similarUser) => similarUser.id === otherUserId)?.score
  ).toEqual(OTHER_USER_SCORE);
});

/**
 * User has the following courses in their shopping cart:
 * ECE368H1: Probabilistic Reasoning
 * ECE344H1: Operating Systems
 * ECE461H1: Internetworking
 * ECE345H1: Algorithms and Data Structures
 * ECE454H1: Computer Systems Programming
 * ECE361H1: Computer Networks I
 * ECE466H1: Computer Networks II
 *
 * Course chosen is highly related: ECE568: Computer Security
 */
test("the score boost from similarities between a course & the user's shopping cart course is as expected", async () => {
  const shoppingCart = await Course.findCoursesInCart(userId);
  const computerSecurityCourse = (await Course.findCourses(userId)).filter(
    (course) => course.code === COMPUTER_SECURITY_CODE
  )[0];
  let totalScoreBoost = 0;

  shoppingCart.forEach((userActivityCourse) => {
    let userActivityCourseDescription = CONSIDER_WORD_MATCH_FREQUENCY
      ? cleanseText(userActivityCourse.description)
      : new Set(cleanseText(userActivityCourse.description));
    let userActivityCourseRequirementsAndPrep = [
      ...userActivityCourse.prerequisites,
      ...userActivityCourse.corequisites,
      ...userActivityCourse.recommendedPrep,
    ];

    totalScoreBoost += calculateScoreFromSimilarity(
      computerSecurityCourse,
      userActivityCourse,
      userActivityCourseDescription,
      userActivityCourseRequirementsAndPrep,
      CART_WORD_MATCH,
      CART_DESIGNATION_MATCH,
      CART_AREA_MATCH,
      CART_MINOR_MATCH,
      CART_CERTIFICATE_MATCH,
      CART_SPECIFIC_SKILL_INTEREST_MATCH,
      CART_GENERIC_SKILL_INTEREST_MATCH,
      CART_PREREQ_COREQ_PREP_FROM_CART,
      CART_PREREQ_COREQ_PREP_FROM_COURSE,
      CART_EXCLUSION,
      SHOPPING_CART_MULTIPLIER,
      EXACT_MATCH_BASE_PENALTY_PERCENTAGE
    );
  });

  expect(totalScoreBoost).toEqual(TOTAL_SCORE_BOOST);
});
