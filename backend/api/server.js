const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const session = require('express-session')
const Course = require("./course-model");
const MinorCertificate = require("./minorcertificate-model");
const Timetable = require("./timetable-model");
const TimetableCourse = require("./timetablecourse-model");
const User = require("./user-model");
//todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?usp=sharing

const server = express();
server.use(helmet());
server.use(express.json());
//todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?usp=sharing
server.use(cors({
  origin: '',
  credentials: true
}))
//todo: https://docs.google.com/document/d/1RS1UnB0mB0aRISJQ50sOUNsElgAoAFGHbdJiBJf_I90/edit?usp=sharing
server.use(session({
  secret: '', 
  resave: false,
  saveUninitialized: false,
  cookie: { secure: true, sameSite: true, httpOnly: true, maxAge: 1000 * 60 * 60 * 2 }
}))

server.use("/", (req, res, next) => {
  next({ status: 404, message: "Endpoint not found" });
});

server.use((err, req, res, next) => {
  const { message, status = 500 } = err;
  res.status(status).json({ message });
});

module.exports = server;