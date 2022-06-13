"use strict";

const fs = require("fs");
require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env["DATABASE_URL"], { useNewUrlParser: true });

const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.once("open", () => console.log("connection to db established"));

const dealM = require("./models/deal");

let rawdata = fs.readFileSync("dealsComplete_1.json");
let arrayOfDeals = JSON.parse(rawdata);
arrayOfDeals.forEach((deal) => {
  saveDeal(deal);
});

async function saveDeal(deal) {
  let dealObject = new dealM();
  dealObject.ticker = "GMTUSDT";
  dealObject.timeSignal = Number(deal.timeSignal);
  dealObject.timeOpen = Number(deal.timeOpen);
  dealObject.timeClose = Number(deal.timeClose);
  dealObject.direction = deal.direction;
  dealObject.level = deal.level;
  dealObject.priceOpen = Number(deal.priceOpen);
  dealObject.priceClose = Number(deal.priceClose);
  dealObject.profit = Number(deal.profit);
  try {
    const newdealObject = await dealObject.save();
    console.log(newdealObject);
  } catch (err) {
    console.log("!!!!!!!!!!!!!!", err.message);
  }
}
