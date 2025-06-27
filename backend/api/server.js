const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const session = require("express-session");
const Course = require("./course-model");
const MinorCertificate = require("./minorcertificate-model");
const Timetable = require("./timetable-model");
const TimetableCourse = require("./timetablecourse-model");
const User = require("./user-model");
//todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?usp=sharing

const DUPLICATE_EMAIL_ERROR = "Email is already in use";

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
  const newUser = req.body;

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
