const {
  ONE_OR_MORE_WHITESPACE_REGEX,
  EMAIL_REGEX,
  ALPHANUMERIC_REGEX,
  UPPERCASE_LETTER,
  LOWERCASE_LETTER,
  NUMBER,
  ONLY_NUMBERS,
} = require("../../frontend/src/utils/regex");
const {
  DUPLICATE_EMAIL_ERROR,
  INVALID_LOGIN_ERROR,
  LOGGED_IN,
  TO,
  CC,
  CART_PATH,
  FAVORITES_PATH,
  TITLE_PATH,
  DESCRIPTION_PATH,
  AMOUNT_OF_KERNEL_AREAS,
  AMOUNT_OF_DEPTH_AREAS,
  ECE_AREAS,
  DESIGNATION_PATH,
  ELECTRICAL,
  COMPUTER,
  CONFLICT_STATUS_PATH,
  RECOMMENDATIONS_PATH,
  REJECT_PATH,
  GENERATE_PATH,
  SELECT_PATH,
  UPDATE_AREAS_PATH,
} = require("../../frontend/src/utils/constants");
const { Path } = require("../../frontend/src/utils/enums");

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const session = require("express-session");
const argon2 = require("argon2");
const Course = require("./course-model");
const MinorCertificate = require("./minorcertificate-model");
const Timetable = require("./timetable-model");
const TimetableCourse = require("./timetablecourse-model");
const User = require("./user-model");
const Email = require("./email-model");
const sendGrid = require("@sendgrid/mail");
sendGrid.setApiKey(process.env.SENDGRID_API_KEY);
const { findRecommendedCourses } = require("../utils/findRecommendedCourses");
const {
  generateTimetable,
  addTimetable,
} = require("../utils/generateTimetable");

const INVALID_USER_DETAILS_ERROR = "Invalid details provided";
const INVALID_EMAIL_DETAILS_ERROR = "Invalid email details provided";
const INVALID_TIMETABLE_DETAILS_ERROR = "Invalid timetable details provided";
const INVALID_TIMETABLE_COURSE_DETAILS_ERROR =
  "Invalid timetable course details provided";
const INVALID_COURSE_ID = "Invalid course id provided";
const INVALID_TIMETABLE_ID = "Invalid timetable id provided";
const INVALID_DURATION = "Invalid timetable duration provided";
const INVALID_KERNEL_DEPTH = "Invalid checkbox values provided";
const INVALID_COURSES_PROVIDED = "Invalid timetable courses provided";
const SESSION_COOKIE_NAME = "sessionId";
const NO_USER_FOUND = "No user found";
const SKILLS_INTERESTS_MIN_LENGTH = 5;
const MINORS_CERTIFICATES_MIN_LENGTH = 1;
const ECE_AREAS_MIN_LENGTH = 2;
const LEARNING_GOAL_MIN_LENGTH = 3;
const COURSECOMPASS_EMAIL_SERVICE = "CourseCompass Email Service";
const validKernelDepthValues = new Set([0, 1]);

const fullNameValid = (fullName) => {
  return (
    fullName && fullName.trim().split(ONE_OR_MORE_WHITESPACE_REGEX).length >= 2
  );
};
const emailValid = (email) => {
  return email && EMAIL_REGEX.test(email);
};
const passwordValid = (password) => {
  return (
    password &&
    password.length >= 8 &&
    UPPERCASE_LETTER.test(password) &&
    LOWERCASE_LETTER.test(password) &&
    NUMBER.test(password) &&
    !ALPHANUMERIC_REGEX.test(password)
  );
};
const arrayValid = (array, minLength) => {
  return Array.isArray(array) && array.length >= minLength;
};
const numberValid = (num) => {
  return num && ONLY_NUMBERS.test(num);
};
const isEceAreaArrayValid = (array, desiredLength) => {
  return (
    array?.length === desiredLength &&
    !array.some((area) => !Object.keys(ECE_AREAS).includes(area))
  );
};

const server = express();
server.use(helmet());
server.use(express.json());
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};
server.use(cors(corsOptions));
server.options('/', cors(corsOptions));
server.use(
  session({
    name: SESSION_COOKIE_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.PRODUCTION ? true : false,
      sameSite: process.env.PRODUCTION ? "none" : false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 2,
    },
  })
);

server.get(Path.CHECK_CREDENTIALS, async (req, res, next) => {
  if (req.session.user) {
    res.status(200).json({ message: LOGGED_IN });
  } else {
    next(new Error(NO_USER_FOUND));
  }
});

server.use("/", (req, res, next) => {
  if (
    (req.path.includes("user") && !req.session.user) ||
    (!req.path.includes("user") && req.session.user)
  ) {
    next({ status: 401, message: "Unauthorized" });
  }

  next("route");
});

server.post(Path.CREATE_ACCOUNT, async (req, res, next) => {
  let newUser = req.body;

  try {
    if (
      !newUser?.email ||
      !fullNameValid(newUser?.fullName) ||
      !emailValid(newUser?.email.trim()) ||
      !passwordValid(newUser?.password) ||
      !newUser?.pfpUrl ||
      !arrayValid(newUser?.interests, SKILLS_INTERESTS_MIN_LENGTH) ||
      !arrayValid(newUser?.skills, SKILLS_INTERESTS_MIN_LENGTH) ||
      !arrayValid(newUser?.eceAreas, ECE_AREAS_MIN_LENGTH) ||
      !newUser?.desiredDesignation ||
      !arrayValid(newUser?.desiredMinors, MINORS_CERTIFICATES_MIN_LENGTH) ||
      !arrayValid(
        newUser?.desiredCertificates,
        MINORS_CERTIFICATES_MIN_LENGTH
      ) ||
      !arrayValid(newUser?.learningGoal, LEARNING_GOAL_MIN_LENGTH)
    ) {
      throw new Error(INVALID_USER_DETAILS_ERROR);
    }

    const hash = await argon2.hash(newUser.password);
    newUser = {
      ...newUser,
      email: newUser?.email.trim(),
      password: hash,
    };

    const created = await User.create(newUser);
    req.session.user = created;
    res.status(201).end();
  } catch (err) {
    if (err?.code === "P2002") err.message = DUPLICATE_EMAIL_ERROR;
    next(err);
  }
});

server.post(Path.LOGIN, async (req, res, next) => {
  const userCredentials = req.body;

  try {
    const user = await User.findUserByEmail(userCredentials?.email);
    if (!user) {
      throw new Error(INVALID_LOGIN_ERROR);
    }

    const isPasswordValid = await argon2.verify(
      user.password,
      userCredentials?.password
    );
    if (!isPasswordValid) {
      throw new Error(INVALID_LOGIN_ERROR);
    }

    req.session.user = user;
    res.status(201).json({ id: user.id });
  } catch (err) {
    next(err);
  }
});

server.delete(Path.LOGOUT, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      next(err);
    }
    res.clearCookie(SESSION_COOKIE_NAME);
    res.status(204).end();
  });
});

server.post(Path.CREATE_EMAIL, async (req, res, next) => {
  const emailData = req.body;
  const userEmail = req.session?.user?.email;
  const userFullName = req.session?.user?.fullName;
  const userId = Number(req.session?.user?.id);

  try {
    const recipientEmails = emailData.recipientEmails.map((email) => {
      return {
        ...email,
        emailAddress: email.emailAddress
          ? email.emailAddress.trim()
          : email.emailAddress,
      };
    });
    const newSubjectLine = emailData.subjectLine
      ? emailData.subjectLine.trim()
      : emailData.subjectLine;
    const newBody = emailData.body ? emailData.body.trim() : emailData.body;

    const emailAddresses = recipientEmails.map((email) => email.emailAddress);
    const duplicateAddresses = emailAddresses.filter(
      (emailAddress, index) => emailAddresses.indexOf(emailAddress) !== index
    );

    const toEmails = recipientEmails
      .filter((email) => email.toOrCC === TO)
      .map((email) => email.emailAddress);

    const ccEmails = recipientEmails
      .filter((email) => email.toOrCC === CC)
      .map((email) => email.emailAddress);

    if (
      !emailData.topic ||
      !newSubjectLine ||
      recipientEmails.length === 0 ||
      recipientEmails.some(
        (email) =>
          (email.toOrCC !== TO && email.toOrCC !== CC) ||
          !email.emailAddress ||
          !EMAIL_REGEX.test(email.emailAddress)
      ) ||
      duplicateAddresses.length > 0 ||
      !newBody ||
      !userEmail ||
      !userFullName ||
      !userId ||
      toEmails.length === 0
    ) {
      throw new Error(INVALID_EMAIL_DETAILS_ERROR);
    }

    const email = {
      to: toEmails,
      cc: ccEmails,
      from: {
        name: COURSECOMPASS_EMAIL_SERVICE,
        email: process.env.SENDGRID_VERIFIED_SENDER,
      },
      replyTo: {
        name: userFullName,
        email: userEmail,
      },
      subject: newSubjectLine,
      text: newBody,
    };

    await sendGrid.send(email);

    const newEmail = {
      to: toEmails,
      cc: ccEmails,
      body: newBody,
      subjectLine: newSubjectLine,
      topic: emailData.topic,
    };
    await Email.create(newEmail, userId);

    res.status(201).end();
  } catch (err) {
    next(err);
  }
});

server.get(Path.EMAIL, async (req, res, next) => {
  try {
    const userId = Number(req.session?.user?.id);
    const emails = await User.findUserEmailsById(userId);
    res.status(200).json({ emails });
  } catch (err) {
    next(err);
  }
});

server.get(Path.EXPLORE, async (req, res, next) => {
  try {
    const userId = Number(req.session?.user?.id);
    const courses = await Course.findCourses(userId);
    res.status(200).json({ courses });
  } catch (err) {
    next(err);
  }
});

server.patch(`${Path.EXPLORE}${CART_PATH}`, async (req, res, next) => {
  const courseId = req.query?.id;
  try {
    if (!courseId || !ONLY_NUMBERS.test(courseId))
      throw new Error(INVALID_COURSE_ID);

    const userId = Number(req.session?.user?.id);
    const updatedCourse = await User.toggleCourseInShoppingCart(
      userId,
      Number(courseId)
    );
    res.status(200).json({ course: updatedCourse });
  } catch (err) {
    next(err);
  }
});

server.patch(`${Path.EXPLORE}${FAVORITES_PATH}`, async (req, res, next) => {
  const courseId = req.query?.id;
  try {
    if (!courseId || !ONLY_NUMBERS.test(courseId))
      throw new Error(INVALID_COURSE_ID);

    const userId = Number(req.session?.user?.id);
    const updatedCourse = await User.toggleCourseInFavorites(
      userId,
      Number(courseId)
    );
    res.status(200).json({ course: updatedCourse });
  } catch (err) {
    next(err);
  }
});

server.patch(`${Path.EXPLORE}${REJECT_PATH}`, async (req, res, next) => {
  const courseId = req.query?.id;
  try {
    if (!courseId || !ONLY_NUMBERS.test(courseId))
      throw new Error(INVALID_COURSE_ID);

    const userId = Number(req.session?.user?.id);
    const updatedCourse = await User.rejectRecommendation(
      userId,
      Number(courseId)
    );
    res.status(200).json({ course: updatedCourse });
  } catch (err) {
    next(err);
  }
});

server.get(Path.SHOPPING_CART, async (req, res, next) => {
  try {
    const userId = Number(req.session?.user?.id);
    const courses = await Course.findCoursesInCart(userId);
    res.status(200).json({ courses });
  } catch (err) {
    next(err);
  }
});

server.get(Path.TIMETABLES, async (req, res, next) => {
  try {
    const userId = Number(req.session?.user?.id);
    const timetables = await User.findUserTimetablesById(userId);
    res.status(200).json({ timetables });
  } catch (err) {
    next(err);
  }
});

server.post(Path.CREATE_TIMETABLE, async (req, res, next) => {
  const timetableData = req.body;
  const userId = Number(req.session?.user?.id);

  try {
    if (
      !timetableData?.title ||
      typeof timetableData?.description !== "string" ||
      typeof timetableData?.isRecommendationWanted !== "boolean" ||
      !isEceAreaArrayValid(timetableData?.kernel, AMOUNT_OF_KERNEL_AREAS) ||
      !isEceAreaArrayValid(timetableData?.depth, AMOUNT_OF_DEPTH_AREAS) ||
      timetableData?.depth?.some(
        (depthArea) => !timetableData?.kernel.includes(depthArea)
      )
    ) {
      throw new Error(INVALID_TIMETABLE_DETAILS_ERROR);
    }

    const timetable = {
      title: timetableData?.title,
      description: timetableData?.description,
      kernel: timetableData?.kernel,
      depth: timetableData?.depth,
    };
    const newTimetableId = await Timetable.create(timetable, userId);

    res.status(201).json({ id: newTimetableId });
  } catch (err) {
    next(err);
  }
});

server.get(Path.TIMETABLE, async (req, res, next) => {
  const timetableId = req.query?.id;

  try {
    if (!numberValid(timetableId)) throw new Error(INVALID_TIMETABLE_ID);

    const userId = Number(req.session?.user?.id);
    const timetable = await User.findUserTimetableByIds(
      Number(timetableId),
      userId
    );

    if (timetable) {
      res.status(200).json({ timetable });
    } else {
      throw new Error(INVALID_TIMETABLE_ID);
    }
  } catch (err) {
    next(err);
  }
});

server.patch(`${Path.TIMETABLE}${TITLE_PATH}`, async (req, res, next) => {
  const timetableId = req.query?.id;
  const title = req.body?.title;
  try {
    if (!title || !timetableId || !ONLY_NUMBERS.test(timetableId))
      throw new Error(INVALID_TIMETABLE_DETAILS_ERROR);

    const userId = Number(req.session?.user?.id);
    await User.updateTimetableTitle(userId, Number(timetableId), title);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

server.patch(`${Path.TIMETABLE}${DESCRIPTION_PATH}`, async (req, res, next) => {
  const timetableId = req.query?.id;
  const description = req.body?.description;
  try {
    if (!numberValid(timetableId))
      throw new Error(INVALID_TIMETABLE_DETAILS_ERROR);

    const userId = Number(req.session?.user?.id);
    await User.updateTimetableDescription(
      userId,
      Number(timetableId),
      description
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

server.patch(`${Path.TIMETABLE}${DESIGNATION_PATH}`, async (req, res, next) => {
  const timetableId = req.query?.id;
  const designation = req.body?.newDesignation;
  try {
    if (
      designation !== null &&
      designation !== ELECTRICAL &&
      designation !== COMPUTER
    )
      throw new Error(INVALID_TIMETABLE_DETAILS_ERROR);

    const userId = Number(req.session?.user?.id);
    await User.updateTimetableDesignation(
      userId,
      Number(timetableId),
      designation
    );
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

server.patch(
  `${Path.TIMETABLE}${CONFLICT_STATUS_PATH}`,
  async (req, res, next) => {
    const timetableId = req.query?.id;
    const isConflictFree = req.body?.newStatus;

    try {
      if (typeof isConflictFree !== "boolean")
        throw new Error(INVALID_TIMETABLE_DETAILS_ERROR);

      const userId = Number(req.session?.user?.id);
      await User.updateTimetableConflictStatus(
        userId,
        Number(timetableId),
        isConflictFree
      );
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }
);

server.post(Path.TIMETABLE, async (req, res, next) => {
  const timetableCourseData = req.body;
  const userId = Number(req.session?.user?.id);

  try {
    if (
      !numberValid(timetableCourseData?.courseId) ||
      !numberValid(timetableCourseData?.term) ||
      !numberValid(timetableCourseData?.position) ||
      !numberValid(timetableCourseData?.timetableId) ||
      timetableCourseData?.term < 1 ||
      timetableCourseData?.term > 4 ||
      timetableCourseData?.position < 1 ||
      timetableCourseData?.position > 5
    ) {
      throw new Error(INVALID_TIMETABLE_COURSE_DETAILS_ERROR);
    }

    await Timetable.addTimetableCourse(
      timetableCourseData?.term,
      timetableCourseData?.position,
      timetableCourseData?.courseId,
      timetableCourseData?.timetableId,
      userId
    );

    res.status(201).end();
  } catch (err) {
    next(err);
  }
});

server.delete(Path.TIMETABLE, async (req, res, next) => {
  const timetableCourseData = req.body;
  const userId = Number(req.session?.user?.id);

  try {
    if (
      !numberValid(timetableCourseData?.courseId) ||
      !numberValid(timetableCourseData?.timetableId)
    ) {
      throw new Error(INVALID_TIMETABLE_COURSE_DETAILS_ERROR);
    }

    await Timetable.deleteTimetableCourse(
      timetableCourseData?.courseId,
      timetableCourseData?.timetableId,
      userId
    );

    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

server.get(`${Path.EXPLORE}${RECOMMENDATIONS_PATH}`, async (req, res, next) => {
  try {
    const userId = Number(req.session?.user?.id);
    const courses = await Course.findCourses(userId);
    const recommendedCourses = await findRecommendedCourses(
      courses,
      userId,
      true,
      false,
      []
    );
    res.status(200).json({ recommendedCourses });
  } catch (err) {
    next(err);
  }
});

server.get(`${Path.TIMETABLE}${GENERATE_PATH}`, async (req, res, next) => {
  const timetableId = req.query?.id;
  const duration = req.query?.duration;
  const anyKernelDepth = Number(req.query?.anyKernelDepth);
  const anyDepth = Number(req.query?.anyDepth);

  try {
    if (!numberValid(timetableId)) throw new Error(INVALID_TIMETABLE_ID);
    else if (!numberValid(duration)) throw new Error(INVALID_DURATION);
    else if (
      !validKernelDepthValues.has(anyKernelDepth) ||
      !validKernelDepthValues.has(anyDepth)
    )
      throw new Error(INVALID_KERNEL_DEPTH);

    const userId = Number(req.session?.user?.id);
    const timetableOptions = await generateTimetable(
      userId,
      Number(timetableId),
      Number(duration),
      anyKernelDepth ? true : false,
      anyDepth ? true : false
    );
    res.status(200).json({ timetableOptions });
  } catch (err) {
    next(err);
  }
});

server.post(`${Path.TIMETABLE}${SELECT_PATH}`, async (req, res, next) => {
  const timetableId = req.query?.id;
  const courses = req.body?.courses;

  try {
    if (!numberValid(timetableId)) throw new Error(INVALID_TIMETABLE_ID);
    else if (
      courses.some(
        (course) =>
          !ONLY_NUMBERS.test(course.id) ||
          !ONLY_NUMBERS.test(course.term) ||
          !ONLY_NUMBERS.test(course.position)
      )
    )
      throw new Error(INVALID_COURSES_PROVIDED);

    const userId = Number(req.session?.user?.id);
    const timetable = await User.findUserTimetableByIds(
      Number(timetableId),
      userId
    );
    await addTimetable(courses, timetable, userId);
    res.status(201).end();
  } catch (err) {
    next(err);
  }
});

server.post(`${Path.TIMETABLE}${UPDATE_AREAS_PATH}`, async (req, res, next) => {
  const timetableId = req.query?.id;
  const kernelAreas = req.body?.kernel;
  const depthAreas = req.body?.depth;

  try {
    if (!numberValid(timetableId)) throw new Error(INVALID_TIMETABLE_ID);
    else if (
      !isEceAreaArrayValid(kernelAreas, AMOUNT_OF_KERNEL_AREAS) ||
      !isEceAreaArrayValid(depthAreas, AMOUNT_OF_DEPTH_AREAS)
    )
      throw new Error(INVALID_TIMETABLE_DETAILS_ERROR);

    const userId = Number(req.session?.user?.id);
    await User.updateTimetableAreas(userId, Number(timetableId), kernelAreas, depthAreas);
    res.status(201).end();
  } catch (err) {
    next(err);
  }
});

server.use("/", (req, res, next) => {
  next({ status: 404, message: "Endpoint not found" });
});

server.use((err, req, res, next) => {
  const { message, status = 500 } = err;
  res.status(status).json({ message });
});

module.exports = server;
