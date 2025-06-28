const {
  ONE_OR_MORE_WHITESPACE_REGEX,
  EMAIL_REGEX,
  ALPHANUMERIC_REGEX,
  UPPERCASE_LETTER,
  LOWERCASE_LETTER,
  NUMBER,
} = require("../../frontend/src/utils/regex");
const {
  DUPLICATE_EMAIL_ERROR,
  INVALID_LOGIN_ERROR,
} = require("../../frontend/src/utils/constants");

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
//todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?usp=sharing

const INVALID_USER_DETAILS_ERROR = "Invalid details provided";
const SESSION_COOKIE_NAME = "sessionId";

const fullNameValid = (fullName) => {
  return fullName.trim().split(ONE_OR_MORE_WHITESPACE_REGEX).length >= 2;
};

const emailValid = (email) => {
  return EMAIL_REGEX.test(email);
};

const passwordValid = (password) => {
  return (
    password.length >= 8 &&
    UPPERCASE_LETTER.test(password) &&
    LOWERCASE_LETTER.test(password) &&
    NUMBER.test(password) &&
    !ALPHANUMERIC_REGEX.test(password)
  );
};

const server = express();
server.use(helmet());
server.use(express.json());

//todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?usp=sharing
const corsOptions = {
  origin: "http://localhost:5173",
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

server.post("/create-account", async (req, res, next) => {
  let newUser = req.body;

  try {
    if (
      !newUser?.fullName ||
      !newUser?.email ||
      !newUser?.password ||
      !newUser?.pfpUrl ||
      !newUser?.interests ||
      !newUser?.skills ||
      !newUser?.eceAreas ||
      !newUser?.desiredDesignation ||
      !newUser?.learningGoal ||
      !fullNameValid(newUser?.fullName) ||
      !emailValid(newUser?.email) ||
      !passwordValid(newUser?.password)
    ) {
      throw new Error(INVALID_USER_DETAILS_ERROR);
    }

    const hash = await argon2.hash(newUser.password);
    newUser = { ...newUser, password: hash };

    const created = await User.create(newUser);
    req.session.user = created;
    res.status(201).json({ id: created.id });
  } catch (err) {
    if (err?.code === "P2002") err.message = DUPLICATE_EMAIL_ERROR;
    next(err);
  }
});

server.post("/login", async (req, res, next) => {
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

server.delete('/user/logout', (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err)
      next(err);
    }
    res.clearCookie(SESSION_COOKIE_NAME);
    res.status(204).end();
  });
});

server.use("/", (req, res, next) => {
  next({ status: 404, message: "Endpoint not found" });
});

server.use((err, req, res, next) => {
  const { message, status = 500 } = err;
  res.status(status).json({ message });
});

module.exports = server;
