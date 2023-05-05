const express = require("express");
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");

// connect middleware
const connectDB = require("./src/config/db");
dotenv.config({ path: "./.env" });
const PORT = 2001;

connectDB();
app.use(cors());

app.use(express.json());

//health check
app.get("/", (req, res) => {
  res.send({ status: 200, message: "Health OK !!" });
});

// route middleware

// api not found !handle 404
app.use("*", function (req, res, next) {
  res.status(404);
  return res.status(404).json({
    status: 404,
    message:
      "API NOT FOUND! Please check the endpoint and the HTTP request type! or contact at @Ayush ",
    data: {
      url: req.url,
    },
  });
});

// CREATTING SERVER_REQUEST
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

// console.log(`Worker ${process.pid} started`);
// }
