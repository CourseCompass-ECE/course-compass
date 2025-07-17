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
    const crsASupportScore = requirementSupportScoreMap.get(crsA.id);
    const crsBSupportScore = requirementSupportScoreMap.get(crsB.id);
    return (
      courseAAreaMatches -
      crsASupportScore * BOOST_FROM_SUPPORTING_COURSE_REQ -
      (courseBAreaMatches - crsBSupportScore * BOOST_FROM_SUPPORTING_COURSE_REQ)
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
// (for minor permutations), conclude the combination is invalid
const isCombinationValid = (
  combination,
  existingCombinations,
  isExploringMajorPermutations
) => {
  for (const existingCombination of existingCombinations) {
    let differentCoursesCount = 0;

    combination.forEach((courseId) => {
      if (!existingCombination.includes(courseId)) differentCoursesCount++;
    });

    if (differentCoursesCount === 0) return false;
    else if (
      isExploringMajorPermutations &&
      differentCoursesCount < MINIMUM_DIFFERENCES_FOR_MAJOR_PERMUTATIONS
    )
      return false;
    else if (
      !isExploringMajorPermutations &&
      differentCoursesCount > MAXIMUM_DIFFERENCES_FOR_MINOR_PERMUTATIONS
    )
      return false;
  }
  return true;
};

// Increment offsets from area 4 (most extra courses) to area 1, continuing until all offsets reach 3rd last (for depth/kernel areas) or last (for non-depth kernel
// areas) course in their respective areas, then switch to minor permutations of the major combination with the highest valid timetable score
const incrementNextOffset = (
  areaOffsets,
  areaOffsetMaximums,
  maximumFailedAttemptsWithRandomOffset,
  currentFailedAttempts,
  haveRandomizingOffsetsBegun
) => {
  if (haveRandomizingOffsetsBegun &&
    currentFailedAttempts >= 0 &&
    currentFailedAttempts < maximumFailedAttemptsWithRandomOffset
  )
    randomizeOffsets(areaOffsets, areaOffsetMaximums);
  else if (currentFailedAttempts === maximumFailedAttemptsWithRandomOffset)
    return false;
  else if (
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
  } else {
    randomizeOffsets(areaOffsets, areaOffsetMaximums);
  }
  return true;
};

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

  let requirementSupportScoreMap = new Map();
  refinedShoppingCart.forEach((course) => {
    if (course.area.some((area) => timetable.kernel.includes(area))) {
      const requirementSupportScore = calculateRequirementSupportScore(
        course.id,
        refinedShoppingCart
      );
      requirementSupportScoreMap.set(course.id, requirementSupportScore);
    }
  });

  let areaOffsetMaximums = [];
  let areaOffsets = Array(4).fill(0);
  let isExploringMajorPermutations = true;
  let kernelDepthCrsCombinations = [];
  let kernelAreasSet = new Set(timetable.kernel);
  let uniqueKernelCourseCount = refinedShoppingCart.filter((cartCourse) =>
    cartCourse.area.some((area) => kernelAreasSet.has(area))
  ).length;
  let maximumFailedAttemptsWithRandomOffset = Math.pow(
    uniqueKernelCourseCount - KERNEL_DEPTH_COURSES_NEEDED,
    MAXIMUM_FAILED_ATTEMPTS_WITH_RANDOM_OFFSETS_EXPONENT
  );
  let currentFailedAttempts = 0;
  let haveRandomizingOffsetsBegun = false;

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

  // Try different timetable combinations until reach 5-second time limit, proceeding with the highest ranked option or none if all attempts were invalid.
  // Choose 8 kernel/depth courses from the top courses for each area to the bottom options, incrementing the offset in the order of the area with the most extra courses to that with the least
  while ((new Date() - computationStartTime) / 1000 < 5) {
    if (!isExploringMajorPermutations) break;
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

    // Try kernel/depth course combinations with major differences (3+ different courses per attempt), then once find top combination, try again with
    // smaller permutations (1-2 different courses per attempt)
    let isExploringMajorPermutationsNext =
      uniqueKernelCourseCount === KERNEL_DEPTH_COURSES_NEEDED
        ? false
        : incrementNextOffset(
            areaOffsets,
            areaOffsetMaximums,
            maximumFailedAttemptsWithRandomOffset,
            currentFailedAttempts,
            haveRandomizingOffsetsBegun
          );

    let kernelDepthCourses = usedCourseIds.flatMap((areaObject) => [
      ...areaObject.courses,
    ]);

    if (
      courseCombinationNotFound ||
      !isCombinationValid(
        kernelDepthCourses,
        kernelDepthCrsCombinations,
        isExploringMajorPermutations
      )
    ) {
      if (haveRandomizingOffsetsBegun) currentFailedAttempts++;
      else haveRandomizingOffsetsBegun = !areaOffsets.some((offset, index) => offset !== areaOffsetMaximums[index]);

      isExploringMajorPermutations = isExploringMajorPermutationsNext;
      continue;
    }

    isExploringMajorPermutations = isExploringMajorPermutationsNext;

    currentFailedAttempts = 0;

    kernelDepthCrsCombinations.push(kernelDepthCourses);
  }
  console.log(kernelDepthCrsCombinations);

  throw new Error(NO_TIMETABLE_POSSIBLE);
};
