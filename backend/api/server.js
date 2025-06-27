const {
  ONE_OR_MORE_WHITESPACE_REGEX,
  EMAIL_REGEX,
  ALPHANUMERIC_REGEX,
  UPPERCASE_LETTER,
  LOWERCASE_LETTER,
  NUMBER,
} = require("../../frontend/src/utils/regex");

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
const DUPLICATE_EMAIL_ERROR = "Email is already in use";

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
      throw new Error({ message: INVALID_USER_DETAILS_ERROR });
    }

    const hash = await argon2.hash(newUser.password);
    newUser = {...newUser, password: hash}

    const created = await User.create(newUser);
    res.status(201).json(created);
  } catch (err) {
    if (err?.code === "P2002") err.message = DUPLICATE_EMAIL_ERROR;
    next(err);
  }
});

server.post("/login", async (req, res, next) => {
  const userCredentials = req.body;

  try {
    const created = await User.create(newUser);
    res.status(201).json(created);
  } catch (err) {
    if (err?.code === "P2002") err.message = DUPLICATE_EMAIL_ERROR;
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
