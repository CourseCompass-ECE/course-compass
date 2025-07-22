const {
  generateTimetable,
  isCoursePlacedInTimetable,
  generateCoursesWithScores,
  filterOutCoursesNotMeetingRequirements,
} = require("../utils/generateTimetable");
const Course = require("../api/course-model");

const userId = 9; // Possesses approximately 40 courses in their shopping cart
// User #9's first timetable with no courses added & the following kernel/depth areas: Photonics & Semiconductor Physics (depth), Electromagnetics & Energy Systems (depth),
// Analog & Digital Electronics (non-depth), Control, Communications & Signal Processing (non-depth)
const timetableId = 12;
const DURATION = 5;
const ANY_KERNEL_DEPTH = true;
const ANY_DEPTH = true;
const COURSE_CODE_TO_ADD = "ECE461H1";
// Arbitrarily chosen due to being used to avoid placing duplicate courses in timetable (ids do not overlap with courses to add in the test) & to rank prerequisites (test focuses on valid placement)
const ARBITRARY_KERNEL_DEPTH_COURSES = [1, 2, 3, 4, 5, 6, 7, 8];
const TIMETABLE_OUTPUT = [
  { id: 29, term: "1", position: 1 }, // ECE302H1
  { id: 44, term: "1", position: 2 }, // ECE361H1
  { id: 45, term: "2", position: 1 }, // ECE461H1
];

const expectedCourseFields = {
  id: expect.any(Number),
  code: expect.any(String),
  title: expect.any(String),
};
const expectedCourseObjectFields = {
  id: expect.any(Number),
  term: expect.any(Number),
  position: expect.any(Number),
  course: expect.objectContaining(expectedCourseFields),
};
const expectedTimetableFields = {
  score: expect.any(Number),
  kernel: expect.arrayContaining([expect.any(String)]),
  depth: expect.arrayContaining([expect.any(String)]),
  courses: expect.arrayContaining([
    expect.objectContaining(expectedCourseObjectFields),
  ]),
};

test("the timetable generation function returns 3 valid timetable options with no restriction on kernel/depth areas used", async () => {
  const timetableOptions = await generateTimetable(
    userId,
    timetableId,
    DURATION,
    ANY_KERNEL_DEPTH,
    ANY_DEPTH
  );
  expect(timetableOptions).toEqual(
    expect.arrayContaining([expect.objectContaining(expectedTimetableFields)])
  );
});

/**
 * Course being used is: ECE461H1
 * Prerequisites: Need 1 from ["ECE361H1"]
 * Corequisites: 0
 * Exclusions: 0
 *
 * This leaves us with needing to add ECE361H1:
 *
 * ECE361H1
 * Prerequisites: ["ECE286H1"] (ignored in seeding, so 0 prereq)
 * Corequisites: Need 1 from ["ECE302H1"]
 * Exclusions: 0
 *
 * This leads us to add ECE302H1:
 * Prerequisites: ["MAT290H1", "MAT291H1", "ECE216H1"] (ignored in seeding, so 0 prereq)
 * Corequisites: 0
 * Exclusions: ["ECE286H1"] (ignored in seeding, so 0 exclusions)
 *
 * In total, to add ECE461H1, 2 other courses (ECE361H1 & ECE302H1) must be added, where ECE361H1/ECE302H1 are in the same term, while ECE461H1 is in a later term
 *
 * This will be using user #9's shopping cart data - with all 3 courses in the shopping cart
 */
test("the add course to timetable function updates timetable with a valid course & all of its nested requirements", async () => {
  let timetableCourses = [];
  let coursesAddedToTimetableToRecall = [];

  const allCourses = await Course.findCourses();
  const refinedShoppingCart = filterOutCoursesNotMeetingRequirements(
    await Course.findCoursesInCart(userId)
  );
  let coursesWithScores = await generateCoursesWithScores(
    allCourses,
    userId,
    refinedShoppingCart
  );

  isCoursePlacedInTimetable(
    allCourses.find((course) => course.code === COURSE_CODE_TO_ADD).id,
    refinedShoppingCart,
    timetableCourses,
    ARBITRARY_KERNEL_DEPTH_COURSES,
    [],
    coursesAddedToTimetableToRecall,
    coursesWithScores
  );

  expect(timetableCourses).toEqual(
    expect.arrayContaining(TIMETABLE_OUTPUT)
  );
});