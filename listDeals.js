const fs = require("fs");
require("dotenv").config();
const mongoose = require("mongoose");

mongoose.connect(process.env["DATABASE_URL"], { useNewUrlParser: true });

const db = mongoose.connection;
db.on("error", (error) => console.log(error));
db.once("open", () => console.log("connection to db established"));

const dealM = require("./models/deal");

try {
  dealsObject = await dealM
    .find({
      ticker: req.params.ticker,
      timeOpen: {
        $gte: Number(req.params.starttime),
        $lte: Number(req.params.endtime),
      },
    })
    .sort({ timeOpen: 1 });

  if (dealsObject == null) {
    return res.status(404).json({ message: "Cannot find dealsObject" });
  }
} catch (err) {
  return res.status(500).json({ message: err.message });
}
dealsObject.forEach((deal) => {
  console.log(deal.timeOpen, deal.profit);
});
