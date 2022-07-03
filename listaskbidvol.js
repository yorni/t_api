const fs = require("fs");
require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env["DATABASE_URL"], { useNewUrlParser: true });

const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.once("open", () => console.log("connection to db established"));

const candleM = require("./models/candle");

candleM
  .find({
    ticker: "GMTUSDT",
    ask1: { $gt: 0 },
  })
  .sort({ time: 1 })
  .then((candlesObject) => {
    candlesObject.forEach((candle) => {
      console.log(
        candle.time,
        candle.ask1,
        candle.ask05,
        candle.bid1,
        candle.bid05,
        candle.o,
        candle.h,
        candle.l,
        candle.c,
        candle.v
      );
    });
  });
