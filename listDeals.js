const fs = require("fs");
require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env["DATABASE_URL"], { useNewUrlParser: true });

const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.once("open", () => console.log("connection to db established"));

const dealM = require("./models/deal");

dealM
  .find({
    ticker: "GMTUSDT",
  })
  .sort({ timeOpen: 1 })
  .then((dealsObject) => {
    dealsObject.forEach((deal) => {
      console.log(deal.timeOpen, deal.profit);
    });
  });
