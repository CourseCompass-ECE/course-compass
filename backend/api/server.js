const {
  ONE_OR_MORE_WHITESPACE_REGEX,
  EMAIL_REGEX,
  ALPHANUMERIC_REGEX,
  UPPERCASE_LETTER,
  LOWERCASE_LETTER,
  NUMBER,
  ONLY_NUMBERS
} = require("../../frontend/src/utils/regex");
const {
  DUPLICATE_EMAIL_ERROR,
  INVALID_LOGIN_ERROR,
  LOGGED_IN,
  TO,
  CC,
  CART_PATH,
  FAVORITES_PATH
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
//todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?usp=sharing

const INVALID_USER_DETAILS_ERROR = "Invalid details provided";
const INVALID_EMAIL_DETAILS_ERROR = "Invalid email details provided";
const INVALID_COURSE_ID = "Invalid course id provided";
const SESSION_COOKIE_NAME = "sessionId";
const NO_USER_FOUND = "No user found";
const SKILLS_INTERESTS_MIN_LENGTH = 5;
const MINORS_CERTIFICATES_MIN_LENGTH = 1;
const ECE_AREAS_MIN_LENGTH = 2;
const LEARNING_GOAL_MIN_LENGTH = 3;
const COURSECOMPASS_EMAIL_SERVICE = "CourseCompass Email Service";

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

const server = express();
server.use(helmet());
server.use(express.json());
//todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?usp=sharing
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
};
server.use(cors(corsOptions));
//todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?usp=sharing
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
    newUser = { ...newUser, email: newUser?.email.trim(), password: hash };

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
    const emails = emailData.emails.map((email) => {
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

    const emailAddresses = emails.map((email) => email.emailAddress);
    const duplicateAddresses = emailAddresses.filter(
      (emailAddress, index) => emailAddresses.indexOf(emailAddress) !== index
    );

    const toEmails = emails
      .filter((email) => email.toOrCC === TO)
      .map((email) => email.emailAddress);

    const ccEmails = emails
      .filter((email) => email.toOrCC === CC)
      .map((email) => email.emailAddress);

    if (
      !emailData.topic ||
      !newSubjectLine ||
      emails.length === 0 ||
      emails.some(
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
    if (!courseId || !ONLY_NUMBERS.test(courseId)) throw new Error(INVALID_COURSE_ID);

    const userId = Number(req.session?.user?.id);
    await User.toggleCourseInShoppingCart(userId, Number(courseId));
    res.status(204).end();
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
