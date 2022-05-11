require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");

mongoose.connect(process.env["DATABASE_URL"], { useNewUrlParser: true });

const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.once("open", () => console.log("connection to db established"));

const bodyParser = require("body-parser");
const app = express();
const port = process.env["PORT"];
app.use(bodyParser.json({ extended: true }));

app.use(function (req, res, next) {
  for (var key in req.query) {
    req.query[key.toLowerCase()] = req.query[key];
  }
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "origin, content-type, accept");
  next();
});

const trades = require("./routes/trades");
app.use("/trades", trades);
const depth = require("./routes/depth");
app.use("/depth", depth);

app.listen(port, () => {
  console.log("We are live on " + port);
});
