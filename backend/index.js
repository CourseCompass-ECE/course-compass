// Entry point into program
require("dotenv").config();

const server = require("./api/server");

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running at port ${PORT}`);
});