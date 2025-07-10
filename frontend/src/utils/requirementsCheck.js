const ECE472_CODE = "ECE472H1";

const listAllCoursesFromAnArea = (area, courses) => {
  let areaCourses = { area, courses: [] };

  courses.forEach((courseObject) => {
    if (courseObject.course.area.includes(area))
      areaCourses.courses.push(courseObject.course);
  });
  return areaCourses;
};

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

export const areRequirementsMet = (
  timetable,
  setKernelCourses,
  setDepthCourses,
  setIsECE472Met,
  setIsOtherCoursesMet,
  setOtherCoursesAmount,
  initialErrors,
  setErrors
) => {
  setIsECE472Met(
    timetable?.courses.some(
      (courseObject) => courseObject.course.code === ECE472_CODE
    )
  );

  let areaCoursesList = [];
  let kernelCourses = [];
  let depthCourses = [];

  timetable?.kernel.forEach((area) => {
    areaCoursesList.push(listAllCoursesFromAnArea(area, timetable.courses));
  });

  // Look at kernel areas that are not also depth areas
  timetable?.kernel
    .filter((area) => !timetable?.depth.includes(area))
    .forEach((nonDepthArea) => {
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
        if (coursesNotInDepthArea !== 0) allCourses = coursesNotInDepthArea;
      }

      kernelCourses.push({
        area: nonDepthArea,
        course:
          allCourses.length === 0 ? null : generateCourseString(allCourses[0]),
      });
    });

  // Look at kernel areas that are also depth areas
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
          )
      );

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
        case 2:
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

  setKernelCourses(kernelCourses);
  setDepthCourses(depthCourses);

  const otherCoursesAmount = timetable?.courses.filter(
    (courseObject) =>
      !kernelCourses.some(
        (kernelCourseObject) =>
          kernelCourseObject.course ===
          generateCourseString(courseObject.course)
      ) &&
      !depthCourses.some(
        (depthCourseObject) =>
          depthCourseObject.course === generateCourseString(courseObject.course)
      )
  ).length;

  setIsOtherCoursesMet(otherCoursesAmount >= 11);
  setOtherCoursesAmount(otherCoursesAmount);
};
