import Course from "../api/course-model.js";
import User from "../api/user-model.js";

const SPECIFIC_SKILL_INTEREST_MATCH = 2;
const GENERIC_SKILL_INTEREST_MATCH = 1;
const LEARNING_GOAL_WORD_MATCH = 1;

export const findRecommendedCourses = async (courses, userId) => {
  let coursesWithScores = structuredClone(courses);
  let user = await User.findUserById(userId);

  coursesWithScores.forEach((course) => {
    let score = 0;
    let cleanedTitle = course.title.trim().toLowerCase();
    let cleanedDescription = course.description.trim().toLowerCase();

    course.skillsInterests.forEach((skillInterest) => {
      if (
        user.skillsInterests.some(
          (userSkillInterest) => userSkillInterest.id === skillInterest.id
        )
      ) {
        score += skillInterest.isSpecific
          ? SPECIFIC_SKILL_INTEREST_MATCH
          : GENERIC_SKILL_INTEREST_MATCH;
      }
    });

    user.learningGoal.forEach(goal => {

        goal.trim().toLowerCase().split(" ").forEach(word => {
            cleanedDescription.split(" ").forEach(descriptionWord => {
                if (word === descriptionWord) score += LEARNING_GOAL_WORD_MATCH;
            })

            cleanedTitle.split(" ").forEach(titleWord => {
                if (word === titleWord) score += LEARNING_GOAL_WORD_MATCH;
            })
        })
    })

    course.score = score;
  });

  let shoppingCartCourses = await Course.findCoursesInCart(userId);
};
