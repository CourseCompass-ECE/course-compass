import Course from "../api/course-model.js";
import User from "../api/user-model.js";
import { createIdListFromObjectList } from "./findRecommendedCourses.js";
import {
  initializeAreaCoursesList,
  updateAreaCoursesList,
} from "../../frontend/src/utils/requirementsCheck.js";

const MINIMUM_COURSES = 20;
const MINIMUM_KERNEL_COURSES = 1;
const MINIMUM_DEPTH_COURSES = 3;
const BOOST_FROM_SUPPORTING_COURSE_REQ = 0.5;
const MINIMUM_DIFFERENCES_FOR_MAJOR_PERMUTATIONS = 3;
const MAXIMUM_DIFFERENCES_FOR_MINOR_PERMUTATIONS = 2;
const MAXIMUM_FAILED_ATTEMPTS_WITH_RANDOM_OFFSETS_EXPONENT = 2;
const MINIMUM_MAJOR_PERMUTATIONS_MULTIPLIER = 0.6;
const MAX_OFFSET_DIFFERENCE = 5;
const KERNEL_DEPTH_COURSES_NEEDED = 8;
const AREA1_INDEX = 0;
const AREA2_INDEX = 1;
const AREA3_INDEX = 2;
const AREA4_INDEX = 3;

const NOT_ENOUGH_COURSES_ERROR =
  "A minimum of 20 courses are required in the shopping cart to generate a timetable";
const NOT_ENOUGH_COURSES_AFTER_REFINING_ERROR =
  "A minimum of 20 courses are required in the shopping cart, with all course requirements met by other shopping cart courses, to generate a timetable";
const MINIMUM_KERNEL_DEPTH_COURSES_ERROR =
  "A minimum of 1 unique course is needed per non-depth kernel area & 3 unique courses per depth/kernel area";
const NO_TIMETABLE_POSSIBLE =
  "With the given shopping cart courses, no conflict-free combination is possible";

// Given a corequisite or prerequisite course list, determine if the number of courses from this list that is also found in the shopping cart
// meets or exceeds the minimum prerequisites/corequisites met amount
const isPrereqOrCoreqMet = (
  prereqOrCoreqList,
  prereqOrCoreqAmount,
  shoppingCartIdList
) => {
  if (prereqOrCoreqAmount === 0) return true;
  let requirementsMet = 0;
  for (const requirementCourse of prereqOrCoreqList) {
    if (shoppingCartIdList.has(requirementCourse.id)) {
      requirementsMet++;
      if (requirementsMet === prereqOrCoreqAmount) return true;
    }
  }
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

// If another area only has enough courses to meet the non-depth kernel or depth/kernel course requirements, 1 or 3 courses respectively,
// must ensure those courses are not being taken by some other area
const checkIfOtherAreaNeedsCourse = (
  courseId,
  area,
  areaCourseLists,
  timetableDepths
) => {
  const matchingAreaCourseList = areaCourseLists.find(
    (areaCourseList) => areaCourseList.area === area
  );
  const minimumCoursesForOtherArea = timetableDepths.includes(
    matchingAreaCourseList?.area
  )
    ? MINIMUM_DEPTH_COURSES
    : MINIMUM_KERNEL_COURSES;

  if (
    matchingAreaCourseList &&
    matchingAreaCourseList.courses.some((course) => course.id === courseId) &&
    matchingAreaCourseList.courses.length === minimumCoursesForOtherArea
  )
    return true;

  return false;
};

const numberOfKernelAreaMatches = (areaList, kernelList) => {
  let matchCount = 0;

  areaList.forEach((area) => {
    if (kernelList.includes(area)) matchCount++;
  });

  return matchCount;
};

const remainingCoursesNeeded = (timetableDepths, area, usedCourseIds) => {
  let minimumCoursesNeededForArea = timetableDepths.includes(area)
    ? MINIMUM_DEPTH_COURSES
    : MINIMUM_KERNEL_COURSES;
  return (
    minimumCoursesNeededForArea -
    usedCourseIds.find((areaObject) => areaObject.area === area)?.courses?.size
  );
};

// Checking if adding a course under a specific kernel/depth area does not make it impossible to meet minimum requirements for other areas
const checkActionIsLegal = (
  courseId,
  areaAddingCourseTo,
  areaCourseLists,
  usedCourseIds,
  timetableDepths
) => {
  let uniqueCourseIdsUsed = new Set([]);
  usedCourseIds.forEach((areaObject) => {
    areaObject.courses.forEach((usedCourseId) => {
      uniqueCourseIdsUsed.add(usedCourseId);
    });
  });

  if (uniqueCourseIdsUsed.has(courseId)) return false;

  let currentAreaAddingTo = usedCourseIds.find(
    (areaObject) => areaObject.area === areaAddingCourseTo
  );
  currentAreaAddingTo?.courses?.add(courseId);
  uniqueCourseIdsUsed.add(courseId);
  let totalMinimumCoursesNeeded = 0;
  let uniqueCourseIdsRemaining = new Set([]);

  for (const areaCourseList of areaCourseLists) {
    let uniqueCourseIdsRemainingForArea = 0;
    let remainingCourses = remainingCoursesNeeded(
      timetableDepths,
      areaCourseList.area,
      usedCourseIds
    );

    let coursesAvailable = areaCourseList.courses.filter(
      (courseId) => !uniqueCourseIdsUsed.has(courseId)
    );

    // If remaining courses needed for given area matches courses that are available (so it needs all the courses available), then ensure another
    // area does not also rely on those courses to meet its requirements (otherwise, it is invalid)
    if (coursesAvailable.length === remainingCourses) {
      for (const otherAreaCourseList of areaCourseLists.filter(
        (otherAreaCourseList) => otherAreaCourseList.area != areaCourseList.area
      )) {
        let remainingCoursesNeededOtherArea = remainingCoursesNeeded(
          timetableDepths,
          otherAreaCourseList.area,
          usedCourseIds
        );

        if (
          remainingCoursesNeededOtherArea.length !== 0 &&
          otherAreaCourseList.courses.filter(
            (courseId) =>
              !uniqueCourseIdsUsed.has(courseId) &&
              !coursesAvailable.includes(courseId)
          ).length < remainingCoursesNeededOtherArea
        ) {
          currentAreaAddingTo?.courses?.delete(courseId);
          return false;
        }
      }
    }

    coursesAvailable.forEach((courseId) => {
      uniqueCourseIdsRemaining.add(courseId);
      uniqueCourseIdsRemainingForArea++;
    });

    if (remainingCourses > uniqueCourseIdsRemainingForArea) {
      currentAreaAddingTo?.courses?.delete(courseId);
      return false;
    }

    totalMinimumCoursesNeeded += remainingCourses;
  }

  if (totalMinimumCoursesNeeded > uniqueCourseIdsRemaining.size) {
    currentAreaAddingTo?.courses?.delete(courseId);
    return false;
  }

  return true;
};

const numberExtraCourses = (areaCourseList, depthAreas) => {
  let minimumCoursesNeeded = depthAreas.includes(areaCourseList.area)
    ? MINIMUM_DEPTH_COURSES
    : MINIMUM_KERNEL_COURSES;

  return areaCourseList.courses.length - minimumCoursesNeeded;
};

// Number of courses in shopping cart that a given course meets at least 1 requirement (prerequisite or corequisite) for
const calculateRequirementSupportScore = (courseId, refinedShoppingCart) => {
  let helpsOtherCourseReqCount = 0;
  refinedShoppingCart.forEach((course) => {
    if (
      course.prerequisites.some((prereq) => prereq.id === courseId) ||
      course.corequisites.some((coreq) => coreq.id === courseId)
    )
      helpsOtherCourseReqCount++;
  });

  return helpsOtherCourseReqCount;
};

// Use a combination of minimizing other kernel areas a course could contribute to (limited flexibility) and maximizing its requirement support score
// to determine an order indicating which courses are best for a given kernel area
const calculateBestCourseOrder = (
  crsA,
  crsB,
  kernelAreas,
  requirementSupportScoreMap
) => {
  const courseAAreaMatches = numberOfKernelAreaMatches(crsA.area, kernelAreas);
  const courseBAreaMatches = numberOfKernelAreaMatches(crsB.area, kernelAreas);

  if (courseAAreaMatches === 1 && courseBAreaMatches !== 1) return -1;
  else if (courseAAreaMatches !== 1 && courseBAreaMatches === 1) return 1;
  else {
    const crsASupportScore =
      requirementSupportScoreMap.get(crsA.id) *
      BOOST_FROM_SUPPORTING_COURSE_REQ;
    const crsBSupportScore =
      requirementSupportScoreMap.get(crsB.id) *
      BOOST_FROM_SUPPORTING_COURSE_REQ;
    return (
      courseAAreaMatches -
      crsASupportScore -
      (courseBAreaMatches - crsBSupportScore)
    );
  }
};

// Logic to determine the top 1 (non-depth kernel area) or 3 (depth/kernel area) courses, if possible, to assign to the given area
const determineValidCoursesForArea = (
  minimumCoursesNeeded,
  currentAreaCourseList,
  currentArea,
  areaCourseLists,
  usedCourseIds,
  kernelAreas,
  depthAreas
) => {
  let courseCount = 0;
  for (const course of currentAreaCourseList) {
    if (
      numberOfKernelAreaMatches(course.area, kernelAreas) === 1 ||
      (!course.area.some((area) =>
        checkIfOtherAreaNeedsCourse(
          course.id,
          area,
          areaCourseLists,
          depthAreas
        )
      ) &&
        checkActionIsLegal(
          course.id,
          currentArea,
          areaCourseLists,
          usedCourseIds,
          depthAreas
        ))
    ) {
      courseCount++;
      usedCourseIds
        .find((areaObject) => areaObject.area === currentArea)
        ?.courses?.add(course.id);
      if (courseCount === minimumCoursesNeeded) break;
    }
  }
  return courseCount;
};

// If there is any existing combination such that the difference in courses between it & the new combination is under 3 (for major permutations) or over 2
// (for minor permutations) relative to current top combination or they are identical, conclude the combination is invalid
const isCombinationValid = (
  combination,
  existingCombinations,
  isExploringMajorPermutations,
  topCombinationIndex
) => {
  for (const [
    combinationIndex,
    existingCombination,
  ] of existingCombinations.entries()) {
    let differentCoursesCount = 0;

    combination.forEach((courseId) => {
      if (!existingCombination.includes(courseId)) differentCoursesCount++;
    });

    if (differentCoursesCount === 0) return false;
    else if (
      combinationIndex === topCombinationIndex &&
      !isExploringMajorPermutations &&
      differentCoursesCount > MAXIMUM_DIFFERENCES_FOR_MINOR_PERMUTATIONS
    )
      return false;
    else if (
      isExploringMajorPermutations &&
      differentCoursesCount < MINIMUM_DIFFERENCES_FOR_MAJOR_PERMUTATIONS
    )
      return false;
  }
  return true;
};

// Increment offsets from area 4 (most extra courses) to area 1, continuing until all offsets reach 3rd last (for depth/kernel areas) or last (for non-depth kernel
// areas) course in their respective areas; then randomize offsets until a streak of failed attempts occur and/or switch to minor permutations for the top valid timetable
const incrementNextOffset = (
  areaOffsets,
  areaOffsetMaximums,
  haveRandomizingOffsetsBegun,
  uniqueKernelCourseCount,
  currentCombinationsFound
) => {
  if (haveRandomizingOffsetsBegun) {
    let randomizeThreshold =
      (uniqueKernelCourseCount - KERNEL_DEPTH_COURSES_NEEDED) *
      MINIMUM_MAJOR_PERMUTATIONS_MULTIPLIER;
    if (currentCombinationsFound < randomizeThreshold)
      randomizeOffsets(areaOffsets, areaOffsetMaximums);
    else return false;
  } else if (
    areaOffsets[AREA3_INDEX] < areaOffsets[AREA4_INDEX] &&
    areaOffsets[AREA3_INDEX] < areaOffsetMaximums[AREA3_INDEX]
  ) {
    areaOffsets[AREA3_INDEX]++;
  } else if (
    areaOffsets[AREA2_INDEX] < areaOffsets[AREA4_INDEX] &&
    areaOffsets[AREA2_INDEX] < areaOffsetMaximums[AREA2_INDEX]
  ) {
    areaOffsets[AREA2_INDEX]++;
  } else if (
    areaOffsets[AREA1_INDEX] < areaOffsets[AREA4_INDEX] &&
    areaOffsets[AREA1_INDEX] < areaOffsetMaximums[AREA1_INDEX]
  ) {
    areaOffsets[AREA1_INDEX]++;
  } else if (areaOffsets[AREA4_INDEX] < areaOffsetMaximums[AREA4_INDEX]) {
    areaOffsets[AREA4_INDEX]++;
  }
  return true;
};

// Randomize the offsets to be between 0 & their maximum offset
const randomizeOffsets = (areaOffsets, areaOffsetMaximums) => {
  areaOffsets.forEach(
    (_, index) =>
      (areaOffsets[index] = Math.floor(
        Math.random() * (areaOffsetMaximums[index] + 1)
      ))
  );
};

const calculateLastOffset = (areaCourseList, timetableDepths) => {
  const lastOffsetCourse = timetableDepths.includes(areaCourseList.area)
    ? MINIMUM_DEPTH_COURSES
    : MINIMUM_KERNEL_COURSES;

  return areaCourseList.courses.length - lastOffsetCourse;
};

// Randomize offsets such that each is within a MAX_OFFSET_DIFFERENCE distance from its respective offset in "topOffsets"
const randomizeMinorChangeOffsets = (
  areaOffsets,
  areaOffsetMaximums,
  topOffsets,
  removeLimitsOnOffsetRandomization
) => {
  areaOffsets.forEach((_, index) => {
    const maxOffset = removeLimitsOnOffsetRandomization
      ? areaOffsetMaximums[index]
      : Math.min(
          topOffsets[index] + MAX_OFFSET_DIFFERENCE,
          areaOffsetMaximums[index]
        );
    const minOffset = removeLimitsOnOffsetRandomization
      ? 0
      : Math.max(topOffsets[index] - MAX_OFFSET_DIFFERENCE, 0);

    areaOffsets[index] = Math.floor(
      Math.random() * (maxOffset - minOffset + 1) + minOffset
    );
  });
};

// Dynamically determine streak of failed attempts to switch from limited randomization to unrestricted randomization for offsets of minor permutations
const calculateMaxFailedAttempts = (topOffsets, areaOffsetMaximums) => {
  let totalOffsetsConsideredInInitialRandomization = 0;
  topOffsets.forEach((offset, index) => {
    let maximumOffset = Math.min(
      offset + MAX_OFFSET_DIFFERENCE,
      areaOffsetMaximums[index]
    );
    let minimumOffset = Math.max(topOffsets[index] - MAX_OFFSET_DIFFERENCE, 0);
    totalOffsetsConsideredInInitialRandomization +=
      maximumOffset - minimumOffset;
  });

  return Math.pow(
    totalOffsetsConsideredInInitialRandomization,
    MAXIMUM_FAILED_ATTEMPTS_WITH_RANDOM_OFFSETS_EXPONENT
  );
};

// Order from greatest to least prerequisites, then corequisites, as prerequisites are more complex to address (unlike corequisites limited to max. 1 coreq/course)
const sortByNumberOfReq = (courseIdA, courseIdB, refinedShoppingCart) => {
  let courseA = refinedShoppingCart.find((course) => course.id === courseIdA);
  let courseB = refinedShoppingCart.find((course) => course.id === courseIdB);

  if (courseA.prerequisiteAmount > courseB.prerequisiteAmount) return -1;
  else if (courseB.prerequisiteAmount > courseA.prerequisiteAmount) return 1;
  else if (courseA.corequisiteAmount > courseB.corequisiteAmount) return -1;
  else if (courseB.corequisiteAmount > courseA.corequisiteAmount) return 1;
  return 0;
};

const countPrereqCoreqMet = (
  requirementList,
  requirementsMet,
  requirementsNotMet,
  timetableCourses,
  kernelDepthCourses
) => {
  let requirementsMetCount = 0;
  requirementList.forEach((req) => {
    if (
      timetableCourses.some(
        (timetableCourse) => timetableCourse.id === req.id
      ) ||
      kernelDepthCourses.some(
        (kernelDepthCourseId) => kernelDepthCourseId === req.id
      )
    ) {
      requirementsMet.push(req);
      requirementsMetCount++;
    } else requirementsNotMet.push(req);
  });
  return requirementsMetCount;
};

// Consider number of requirements left to meet for a course, 2 layers deep (its prerequisites/corequisites, then the minimum requirements from those prereq/coreq)
const calculateEasyToEnrollScore = (
  course,
  timetableCourses,
  kernelDepthCourses
) => {
  let easyToEnrollScore = 0;
  let prerequisitesMetCount = 0;
  let prerequisitesMet = [];
  let prerequisitesNotMet = [];
  let corequisitesMetCount = 0;
  let corequisitesMet = [];
  let corequisitesNotMet = [];

  prerequisitesMetCount = countPrereqCoreqMet(
    course.prerequisites,
    prerequisitesMet,
    prerequisitesNotMet,
    timetableCourses,
    kernelDepthCourses
  );
  corequisitesMetCount = countPrereqCoreqMet(
    course.corequisites,
    corequisitesMet,
    corequisitesNotMet,
    timetableCourses,
    kernelDepthCourses
  );

  easyToEnrollScore +=
    prerequisitesMetCount > course.prerequisiteAmount
      ? 0
      : course.prerequisiteAmount - prerequisitesMetCount;
  easyToEnrollScore +=
    corequisitesMetCount > course.corequisiteAmount
      ? 0
      : course.corequisiteAmount - corequisitesMetCount;

  return easyToEnrollScore;
};

// Given a course ID, place it in timetable along with all of its prerequisites/corequisites, and its prerequisites/corequisites, and so on
const placeCourseAndRequirementsInTimetable = (
  kernelDepthCourseId,
  refinedShoppingCart,
  timetableCourses,
  kernelDepthCourses
) => {
  const kernelDepthCourse = refinedShoppingCart.find(
    (course) => course.id === kernelDepthCourseId
  );

  const orderedPrereq = kernelDepthCourse.prerequisites.toSorted(
    (prereqA, prereqB) =>
      calculateEasyToEnrollScore(
        prereqA,
        timetableCourses,
        kernelDepthCourses
      ) -
      calculateEasyToEnrollScore(prereqB, timetableCourses, kernelDepthCourses)
  );
  const orderedCoreq = kernelDepthCourse.corequisites.toSorted(
    (coreqA, coreqB) =>
      calculateEasyToEnrollScore(coreqA) - calculateEasyToEnrollScore(coreqB)
  );

  // After identifying/filtering for easiest-to-fulfill prerequisites/corequisites, reverse ordering to focus on hardest requirements that must be addressed first
  orderedPrereq
    .filter((_, index) => index < kernelDepthCourse.prerequisiteAmount)
    .reverse();
  orderedCoreq
    .filter((_, index) => index < kernelDepthCourse.corequisiteAmount)
    .reverse();
};

const updateOffsets = (
  isExploringMajorPermutations,
  uniqueKernelCourseCount,
  areaOffsets,
  areaOffsetMaximums,
  haveRandomizingOffsetsBegun,
  topOffsets,
  removeLimitsOnOffsetRandomization,
  kernelDepthCrsCombinationsCount
) => {
  if (isExploringMajorPermutations)
    return uniqueKernelCourseCount === KERNEL_DEPTH_COURSES_NEEDED
      ? false
      : incrementNextOffset(
          areaOffsets,
          areaOffsetMaximums,
          haveRandomizingOffsetsBegun,
          uniqueKernelCourseCount,
          kernelDepthCrsCombinationsCount
        );
  else {
    randomizeMinorChangeOffsets(
      areaOffsets,
      areaOffsetMaximums,
      topOffsets,
      removeLimitsOnOffsetRandomization
    );
    return isExploringMajorPermutations;
  }
};

const checkForValidCombination = (
  areaCourseLists,
  timetable,
  usedCourseIds
) => {
  areaCourseLists.forEach((areaCourseList) => {
    let sortedCourseList = areaCourseList.courses.toSorted(
      (crsA, crsB) =>
        numberOfKernelAreaMatches(crsA.area, timetable.kernel) -
        numberOfKernelAreaMatches(crsB.area, timetable.kernel)
    );

    let minimumCoursesNeeded = timetable.depth.includes(areaCourseList.area)
      ? MINIMUM_DEPTH_COURSES
      : MINIMUM_KERNEL_COURSES;
    const courseCount = determineValidCoursesForArea(
      minimumCoursesNeeded,
      sortedCourseList,
      areaCourseList.area,
      areaCourseLists,
      usedCourseIds,
      timetable.kernel,
      timetable.depth
    );

    if (courseCount < minimumCoursesNeeded)
      throw new Error(MINIMUM_KERNEL_DEPTH_COURSES_ERROR);
  });
};

const prepareCourseListsAndConstants = (
  refinedShoppingCart,
  areaCourseLists,
  timetable,
  requirementSupportScoreMap,
  areaOffsetMaximums
) => {
  refinedShoppingCart.forEach((course) => {
    if (course.area.some((area) => timetable.kernel.includes(area))) {
      const requirementSupportScore = calculateRequirementSupportScore(
        course.id,
        refinedShoppingCart
      );
      requirementSupportScoreMap.set(course.id, requirementSupportScore);
    }
  });
  areaCourseLists.forEach((areaCourseList, index) => {
    areaCourseList.courses.sort((crsA, crsB) =>
      calculateBestCourseOrder(
        crsA,
        crsB,
        timetable.kernel,
        requirementSupportScoreMap
      )
    );
    areaOffsetMaximums.push(
      calculateLastOffset(areaCourseLists[index], timetable.depth)
    );
  });
};

// Choosing a valid combinations of 20 courses out of a maximum of 62 courses in the shopping cart, which equates to
// 7,168,066,508,321,614 (~7.17 quadrillion) possible 20-course timetable combinations
export const generateTimetable = async (userId, timetableId) => {
  const computationStartTime = new Date();

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

  // Store object array containing area name & set of IDs containing courses belonging to the area (for each kernel area)
  const timetable = await User.findUserTimetableByIds(timetableId, userId);
  let areaCourseLists = [];
  initializeAreaCoursesList(areaCourseLists, timetable.kernel);
  refinedShoppingCart.forEach((course) => {
    updateAreaCoursesList({ course }, areaCourseLists);
  });

  // Store IDs of the 1 (non-depth kernel area) or 3 (depth/kernel area) courses being assigned to each kernel area
  let usedCourseIds = structuredClone(areaCourseLists);
  usedCourseIds.forEach((areaObject) => {
    areaObject.courses = new Set([]);
  });

  areaCourseLists.sort(
    (areaA, areaB) =>
      numberExtraCourses(areaA, timetable.depth) -
      numberExtraCourses(areaB, timetable.depth)
  );

  // Check for at least 1 valid combination of 8 courses across the 4 kernel areas before continuing to evaluate timetable combinations
  checkForValidCombination(areaCourseLists, timetable, usedCourseIds);

  // After complete with initial check, initialize various helper variables to explore timetable combinations
  let requirementSupportScoreMap = new Map();
  let areaOffsetMaximums = [];
  prepareCourseListsAndConstants(
    refinedShoppingCart,
    areaCourseLists,
    timetable,
    requirementSupportScoreMap,
    areaOffsetMaximums
  );
  let areaOffsets = Array(4).fill(0);
  let isExploringMajorPermutations = true;
  let kernelDepthCrsCombinations = [];
  let kernelAreasSet = new Set(timetable.kernel);
  let uniqueKernelCourseCount = refinedShoppingCart.filter((cartCourse) =>
    cartCourse.area.some((area) => kernelAreasSet.has(area))
  ).length;
  // Determine the maximum streak of failed attempts using randomizing offsets before moving onto minor permutations; exponential growth
  // for this constant as number of valid courses to be used as a kernel/depth course increases, due to factorial relationship found in "x choose y"
  let maximumFailedAttemptsWithRandomOffset = Math.pow(
    uniqueKernelCourseCount - KERNEL_DEPTH_COURSES_NEEDED,
    MAXIMUM_FAILED_ATTEMPTS_WITH_RANDOM_OFFSETS_EXPONENT
  );
  let currentFailedAttempts = 0;
  let haveRandomizingOffsetsBegun = false;
  let topCombinationIndex = null;
  let topOffsets = [];
  let removeLimitsOnOffsetRandomization = false;
  let minorPermutationsFailedAttempts = 0;
  let maximumFailedMinorPermutationAttempts;
  let timetableCourses = [];

  // Try different timetable combinations until reach 5-second time limit, proceeding with the highest ranked option or none if all attempts were invalid. Choose 8 kernel/depth courses
  // from each area, incrementing offset index in each area list in order of area with the most extra courses to that with the least (& randomized if insufficient course combos found)
  while ((new Date() - computationStartTime) / 1000 < 5) {
    if (topCombinationIndex !== null) {
      maximumFailedMinorPermutationAttempts = calculateMaxFailedAttempts(
        topOffsets,
        areaOffsetMaximums
      );
    }

    usedCourseIds.forEach((areaObject) => {
      areaObject.courses = new Set([]);
    });
    let courseCombinationNotFound = false;

    for (const [
      areaCourseListIndex,
      areaCourseList,
    ] of areaCourseLists.entries()) {
      let shiftedCourseList = areaCourseList.courses.filter(
        (_, index) => index >= areaOffsets[areaCourseListIndex]
      );
      let minimumCoursesNeeded = timetable.depth.includes(areaCourseList.area)
        ? MINIMUM_DEPTH_COURSES
        : MINIMUM_KERNEL_COURSES;

      const courseCount = determineValidCoursesForArea(
        minimumCoursesNeeded,
        shiftedCourseList,
        areaCourseList.area,
        areaCourseLists,
        usedCourseIds,
        timetable.kernel,
        timetable.depth
      );

      if (courseCount < minimumCoursesNeeded) {
        courseCombinationNotFound = true;
        break;
      }
    }

    let currentCombinationOffsets = areaOffsets;
    let kernelDepthCourses = usedCourseIds.flatMap((areaObject) => [
      ...areaObject.courses,
    ]);

    // Check if discovered kernel/depth course combination is not a duplicate & with major (3+ different courses) or minor (2 or less different courses)
    // differences; flag randomizing to begin if reach end of incremental offset change strategy
    if (
      courseCombinationNotFound ||
      !isCombinationValid(
        kernelDepthCourses,
        kernelDepthCrsCombinations,
        isExploringMajorPermutations,
        topCombinationIndex
      )
    ) {
      if (isExploringMajorPermutations && haveRandomizingOffsetsBegun) {
        currentFailedAttempts++;
        if (currentFailedAttempts === maximumFailedAttemptsWithRandomOffset)
          isExploringMajorPermutations = false;
      } else if (isExploringMajorPermutations)
        haveRandomizingOffsetsBegun = !areaOffsets.some(
          (offset, index) => offset !== areaOffsetMaximums[index]
        );
      else {
        minorPermutationsFailedAttempts++;
        if (
          minorPermutationsFailedAttempts ===
          maximumFailedMinorPermutationAttempts
        )
          removeLimitsOnOffsetRandomization = true;
      }

      if (!isExploringMajorPermutations && topCombinationIndex === null) break;

      // Determine next set of offsets, either incremental/randomized for major permutations or randomized within a limited range/fully randomized
      // for minor permutations
      isExploringMajorPermutations = updateOffsets(
        isExploringMajorPermutations,
        uniqueKernelCourseCount,
        areaOffsets,
        areaOffsetMaximums,
        haveRandomizingOffsetsBegun,
        topOffsets,
        removeLimitsOnOffsetRandomization,
        kernelDepthCrsCombinations.length
      );
      continue;
    }

    isExploringMajorPermutations = updateOffsets(
      isExploringMajorPermutations,
      uniqueKernelCourseCount,
      areaOffsets,
      areaOffsetMaximums,
      haveRandomizingOffsetsBegun,
      topOffsets,
      removeLimitsOnOffsetRandomization,
      kernelDepthCrsCombinations.length
    );
    currentFailedAttempts = 0;
    minorPermutationsFailedAttempts = 0;
    kernelDepthCrsCombinations.push(kernelDepthCourses);

    topCombinationIndex = 0; // placeholder; adjusted after finding valid timetable
    // placeholder - assuming first combination leads to the top combination, keep its offsets for minor permutations
    if (kernelDepthCrsCombinations.length === 1) {
      topOffsets = [...currentCombinationOffsets];
    }

    kernelDepthCourses.sort((courseIdA, courseIdB) =>
      sortByNumberOfReq(courseIdA, courseIdB, refinedShoppingCart)
    );

    kernelDepthCourses.forEach((kernelDepthCourseId) => {
      placeCourseAndRequirementsInTimetable(
        kernelDepthCourseId,
        refinedShoppingCart,
        timetableCourses,
        kernelDepthCourses
      );
    });
  }

  throw new Error(NO_TIMETABLE_POSSIBLE);
};
