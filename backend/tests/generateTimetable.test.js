const {
  generateTimetable,
  isCoursePlacedInTimetable,
  generateCoursesWithScores,
  filterOutCoursesNotMeetingRequirements,
  isThereValidCombination,
  isTopTimetableDifferent,
} = require("../utils/generateTimetable");
const { ECE_AREAS } = require("../../frontend/src/utils/constants");
const {
  initializeAreaCoursesList,
  updateAreaCoursesList,
} = require("../../frontend/src/utils/requirementsCheck");
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

const COURSE_CODES_TO_INCLUDE = new Set([
  "ECE318H1",
  "ECE335H1",
  "ECE437H1",
  "ECE424H1",
  "ECE520H1",
  "ECE526H1",
  "ECE313H1",
  "ECE568H1",
  "ECE466H1",
  "ECE342H1",
  "ECE361H1",
]);
const FIRST_KERNEL = [
  "HARDWARE_NETWORKS",
  "ENERGY_ELECTROMAGNETICS",
  "SOFTWARE",
  "PHOTONICS_SEMICONDUCTOR",
];
const FIRST_DEPTH = ["HARDWARE_NETWORKS", "ENERGY_ELECTROMAGNETICS"];
const SECOND_KERNEL = [
  "HARDWARE_NETWORKS",
  "ANALOG_DIGITAL",
  "SOFTWARE",
  "PHOTONICS_SEMICONDUCTOR",
];
const SECOND_DEPTH = ["HARDWARE_NETWORKS", "SOFTWARE"];

const SCORE_77_TIMETABLE = {
  courses: [
    3, 11, 19, 22, 5, 27, 9, 46, 50, 16, 31, 7, 41, 35, 2, 53, 38, 24, 13, 44,
  ],
  score: 77,
};
const SCORE_75_TIMETABLE = {
  courses: [
    3, 11, 19, 22, 5, 27, 9, 49, 50, 16, 31, 17, 41, 35, 2, 53, 38, 24, 13, 21,
  ],
  score: 75,
};
const SCORE_70_TIMETABLE = {
  courses: [
    39, 1, 19, 22, 5, 27, 9, 46, 50, 16, 31, 7, 41, 35, 2, 53, 38, 24, 13, 40,
  ],
  score: 70,
};
const ORIGINAL_TIMETABLE = [
  SCORE_77_TIMETABLE,
  SCORE_75_TIMETABLE,
  SCORE_70_TIMETABLE,
];
const NEW_TIMETABLE_WITH_NEW_TOP = [];
const NEW_TIMETABLE_WITH_NO_NEW_TOP = [];

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

  expect(timetableCourses).toEqual(expect.arrayContaining(TIMETABLE_OUTPUT));
});

/**
 * While courses are identical in both function calls, the kernel/depth areas considered in each modify if the courses are valid or not
 * The breakdown of courses among each area are summarized below:
 * "Photonics & Semiconductor Physics": 3 (ECE318H1, ECE335H1, ECE437H1)
 * "Electromagnetics & Energy Systems": 4 (ECE424H1, ECE520H1, ECE526H1, ECE313H1)
 * "Analog & Digital Electronics": 2 (ECE424H1, ECE437H1)
 * "Control, Communications & Signal Processing": 0
 * "Computer Hardware & Computer Networks": 4 (ECE568H1, ECE466H1, ECE342H1, ECE361H1)
 * "Software": 1 (ECE568H1)
 *
 * This combination of courses will be valid in the following scenario:
 * Kernel: Computer Hardware & Computer Networks, Electromagnetics & Energy Systems, Software, Photonics & Semiconductor Physics
 * Depth: Computer Hardware & Computer Networks, Electromagnetics & Energy Systems
 *
 * It will not be valid in the following scenario:
 * Kernel: Computer Hardware & Computer Networks, Analog & Digital Electronics, Software, Photonics & Semiconductor Physics
 * Depth: Software, Computer Hardware & Computer Networks
 *
 * Note that some courses are found across several areas (ECE437H1), but in a valid combination, each course can contribute to only a single area
 *
 * A valid combination has 1 course in each non-depth kernel area & 3 courses in each depth kernel areas; there are 2 non-depth & 2 depth areas, for a
 * total of 4 areas & 8 courses
 */
test("the check for at least 1 valid kernel/depth course combination returns true for a valid set of courses & false for an invalid one", async () => {
  let areaCourseLists = [];
  initializeAreaCoursesList(areaCourseLists, Object.keys(ECE_AREAS));
  const allCourses = await Course.findCourses();
  allCourses
    .filter((course) => COURSE_CODES_TO_INCLUDE.has(course.code))
    .forEach((course) => {
      updateAreaCoursesList({ course }, areaCourseLists);
    });

  let usedCourseIds = structuredClone(areaCourseLists);
  usedCourseIds.forEach((areaObject) => {
    areaObject.courses = new Set([]);
  });
  let isValidCombinationPossible1 = isThereValidCombination(
    areaCourseLists.filter((areaCourseList) =>
      FIRST_KERNEL.includes(areaCourseList.area)
    ),
    { kernel: FIRST_KERNEL, depth: FIRST_DEPTH },
    usedCourseIds
  );

  usedCourseIds.forEach((areaObject) => {
    areaObject.courses = new Set([]);
  });
  let isValidCombinationPossible2 = isThereValidCombination(
    areaCourseLists.filter((areaCourseList) =>
      SECOND_KERNEL.includes(areaCourseList.area)
    ),
    { kernel: SECOND_KERNEL, depth: SECOND_DEPTH },
    usedCourseIds
  );

  expect([isValidCombinationPossible1, isValidCombinationPossible2]).toEqual([
    true,
    false,
  ]);
});

/**
 * Given an original timetable array, test two different timetable arrays against it:
 * 1. A timetable array where the top option changes with different courses & a higher score
 * 2. A timetable array where the second & third timetables change with different scores/courses, but the top remains the same
 */
test("the check for if two timetable arrays have a different top option correctly identifies when the top timetable remains identical & when it changes", () => {
  const isFirstTopTimetableDifferent = isTopTimetableDifferent(
    ORIGINAL_TIMETABLE,
    NEW_TIMETABLE_WITH_NEW_TOP
  );
  const isSecondTopTimetableDifferent = isTopTimetableDifferent(
    originalTopTimetables,
    NEW_TIMETABLE_WITH_NO_NEW_TOP
  );

  expect([isFirstTopTimetableDifferent, isSecondTopTimetableDifferent]).toEqual(
    [true, false]
  );
});
