import {
  ECE472_CODE,
  initialErrors,
  OVERLOADED_POSITION,
  KERNEL_DEPTH_COURSES_NEEDED,
} from "../../frontend/src/utils/constants.js";
import {
  initializeAreaCoursesList,
  updateAreaCoursesList,
} from "./areaCoursesListHelpers.js";

const PREREQ_INDEX = 0;
const COREQ_INDEX = 1;
const EXCLUSIONS_INDEX = 2;

const generateCourseString = (course) => {
  return `${course.code}, ${course.title}`;
};

const addToKernelDepthCourses = (
  kernelCourses,
  depthCourses,
  kernelCourse,
  depthCourse1,
  depthCourse2
) => {
  kernelCourses.push(kernelCourse);
  depthCourses.push(depthCourse1);
  depthCourses.push(depthCourse2);
};

const createCourseObject = (currentCourseObject, newCourse) => {
  return {
    ...currentCourseObject,
    course: generateCourseString(newCourse),
  };
};

export const findNonOverloadedCourses = (courses) => {
  return courses.filter(
    (courseObject) => courseObject.position !== OVERLOADED_POSITION
  );
};

export const checkForPrereqErrors = (errorsObject, courses) => {
  courses
    .filter((courseObject) => courseObject.course.prerequisiteAmount > 0)
    .forEach((courseObject) => {
      let prereqNotMetList = courseObject.course.prerequisites.filter(
        (prereq) => {
          let foundPrereq = courses.find(
            (courseObject) => courseObject.courseId === prereq.id
          );
          if (!foundPrereq || foundPrereq?.term >= courseObject.term)
            return true;
        }
      );
      const prereqMetCount =
        courseObject.course.prerequisites.length - prereqNotMetList.length;

      if (prereqMetCount < courseObject.course.prerequisiteAmount) {
        errorsObject[PREREQ_INDEX].errors.push(
          `${courseObject.course.code} has ${prereqMetCount} / ${
            courseObject.course.prerequisiteAmount
          } prerequisites met. Options: ${prereqNotMetList
            .map((preReq, index) => {
              return `${preReq.code}${
                index !== prereqNotMetList.length - 1 ? ", " : ""
              }`;
            })
            .join("")}`
        );
      }
    });
};

export const checkForCoreqErrors = (errorsObject, courses) => {
  courses
    .filter((courseObject) => courseObject.course.corequisiteAmount > 0)
    .forEach((courseObject) => {
      let coreqNotMetList = courseObject.course.corequisites.filter((coreq) => {
        let foundCoreq = courses.find(
          (courseObject) => courseObject.courseId === coreq.id
        );
        if (!foundCoreq || foundCoreq?.term !== courseObject.term) return true;
      });
      const coreqMetCount =
        courseObject.course.corequisites.length - coreqNotMetList.length;

      if (coreqMetCount < courseObject.course.corequisiteAmount) {
        errorsObject[COREQ_INDEX].errors.push(
          `${courseObject.course.code} has ${coreqMetCount} / ${
            courseObject.course.corequisiteAmount
          } corequisites met. Options: ${coreqNotMetList
            .map((coReq, index) => {
              return `${coReq.code}${
                index !== coreqNotMetList.length - 1 ? ", " : ""
              }`;
            })
            .join("")}`
        );
      }
    });
};

export const checkForExclusionErrors = (errorsObject, courses) => {
  courses
    .filter((courseObject) => courseObject.course.exclusions.length > 0)
    .forEach((courseObject) => {
      let violatedExclusions = courseObject.course.exclusions.filter(
        (exclusion) =>
          courses.find((courseObject) => courseObject.courseId === exclusion.id)
      );

      if (violatedExclusions.length > 0) {
        errorsObject[EXCLUSIONS_INDEX].errors.push(
          `${courseObject.course.code} has ${violatedExclusions.length} / ${
            courseObject.course.exclusions.length
          } exclusions violated. Violations: ${violatedExclusions
            .map((exclusion, index) => {
              return `${exclusion.code}${
                index !== violatedExclusions.length - 1 ? ", " : ""
              }`;
            })
            .join("")}`
        );
      }
    });
};

export const isValidIgnoringOverloaded = (timetable) => {
  let nonOverloadedCourses = findNonOverloadedCourses(timetable.courses);

  let errorObjectList = structuredClone(initialErrors);
  checkForPrereqErrors(errorObjectList, nonOverloadedCourses);
  checkForCoreqErrors(errorObjectList, nonOverloadedCourses);
  checkForExclusionErrors(errorObjectList, nonOverloadedCourses);

  let areaCoursesList = [];
  initializeAreaCoursesList(areaCoursesList, timetable.kernel);
  nonOverloadedCourses.forEach((courseObject) => {
    updateAreaCoursesList(courseObject, areaCoursesList);
  });
  let kernelCourses = findNonDepthKernelAreaCourses(timetable, areaCoursesList);
  let depthCourses = findDepthKernelAreaCourses(
    timetable,
    areaCoursesList,
    kernelCourses
  );

  return (
    !errorObjectList.some((errorObject) => errorObject.errors.length > 0) &&
    nonOverloadedCourses.length === 20 &&
    nonOverloadedCourses.some(
      (courseObject) => courseObject.course.code === ECE472_CODE
    ) &&
    kernelCourses.length + depthCourses.length === KERNEL_DEPTH_COURSES_NEEDED
  );
};

// Look at kernel areas that are not also depth areas and find courses to meet its requirements
export const findNonDepthKernelAreaCourses = (timetable, areaCoursesList) => {
  let kernelCourses = [];

  timetable?.kernel
    .filter((area) => !timetable?.depth.includes(area))
    .forEach((nonDepthArea) => {
      // ensure not already in kernelCourses
      let allCourses = areaCoursesList
        .find((areaCourse) => areaCourse.area === nonDepthArea)
        .courses.filter(
          (course) =>
            !kernelCourses.some(
              (kernelCourseObject) =>
                kernelCourseObject.course === generateCourseString(course)
            )
        );

      // Ensuring do not prioritize courses that are also found in depth areas
      if (allCourses.length !== 0) {
        let coursesNotInDepthArea = allCourses.filter(
          (course) =>
            !course.area.some((area) => timetable?.depth.includes(area))
        );
        if (coursesNotInDepthArea.length !== 0)
          allCourses = coursesNotInDepthArea;
      }

      // Also, prioritize courses where it only has 1 area matching the kernel/depth areas (so more flexible courses are still left available to fill another area), and ensure not already in kernelCourses
      if (allCourses.length !== 0) {
        let coursesOnlyInCurrentArea = allCourses.filter(
          (course) =>
            course.area.filter((area) => timetable?.kernel?.includes(area))
              .length === 1 &&
            course.area.filter((area) =>
              timetable?.kernel?.includes(area)
            )[0] === nonDepthArea
        );

        if (coursesOnlyInCurrentArea.length !== 0)
          allCourses = coursesOnlyInCurrentArea;
      }

      kernelCourses.push({
        area: nonDepthArea,
        course:
          allCourses.length === 0 ? null : generateCourseString(allCourses[0]),
      });
    });

  return kernelCourses;
};

// Look at kernel areas that are also depth areas & find courses to meet its requirements
export const findDepthKernelAreaCourses = (
  timetable,
  areaCoursesList,
  kernelCourses
) => {
  let depthCourses = [];

  timetable?.kernel
    .filter((area) => timetable?.depth.includes(area))
    .forEach((kernelAndDepthArea) => {
      let allCourses = areaCoursesList.find(
        (areaCourse) => areaCourse.area === kernelAndDepthArea
      ).courses;

      let coursesNotUsedInOtherAreas = allCourses.filter(
        (course) =>
          !kernelCourses.some(
            (kernelCourseObject) =>
              kernelCourseObject.course === generateCourseString(course)
          ) &&
          !depthCourses.some(
            (depthCourseObject) =>
              depthCourseObject.course === generateCourseString(course)
          )
      );

      // Also, prioritize courses where it only has 1 area matching the depth areas (so more flexible courses are still left available to fill another area)
      if (coursesNotUsedInOtherAreas.length !== 0) {
        let coursesOnlyInCurrentArea = coursesNotUsedInOtherAreas.filter(
          (course) =>
            course.area.filter((area) => timetable?.depth?.includes(area))
              .length === 1 &&
            course.area.filter((area) =>
              timetable?.depth?.includes(area)
            )[0] === kernelAndDepthArea
        );

        if (coursesOnlyInCurrentArea.length >= 3)
          coursesNotUsedInOtherAreas = coursesOnlyInCurrentArea;
      }

      let kernelCourse = { area: kernelAndDepthArea, course: null };
      let depthCourse1 = { area: kernelAndDepthArea, course: null };
      let depthCourse2 = { area: kernelAndDepthArea, course: null };

      switch (coursesNotUsedInOtherAreas.length) {
        case 0:
          addToKernelDepthCourses(
            kernelCourses,
            depthCourses,
            kernelCourse,
            depthCourse1,
            depthCourse2
          );
          break;
        case 1:
          kernelCourse = createCourseObject(
            kernelCourse,
            coursesNotUsedInOtherAreas[0]
          );
          addToKernelDepthCourses(
            kernelCourses,
            depthCourses,
            kernelCourse,
            depthCourse1,
            depthCourse2
          );
          break;
        case 2:
          kernelCourse = createCourseObject(
            kernelCourse,
            coursesNotUsedInOtherAreas[0]
          );
          depthCourse1 = createCourseObject(
            depthCourse1,
            coursesNotUsedInOtherAreas[1]
          );
          addToKernelDepthCourses(
            kernelCourses,
            depthCourses,
            kernelCourse,
            depthCourse1,
            depthCourse2
          );
          break;
        default: //3 or more
          kernelCourse = createCourseObject(
            kernelCourse,
            coursesNotUsedInOtherAreas[0]
          );
          depthCourse1 = createCourseObject(
            depthCourse1,
            coursesNotUsedInOtherAreas[1]
          );
          depthCourse2 = createCourseObject(
            depthCourse2,
            coursesNotUsedInOtherAreas[2]
          );
          addToKernelDepthCourses(
            kernelCourses,
            depthCourses,
            kernelCourse,
            depthCourse1,
            depthCourse2
          );
          break;
      }
    });

  return depthCourses;
};
