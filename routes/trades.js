const express = require("express");
const router = express.Router();
const trade = require("../models/trade");

//Get One
router.get("/:ticker/:starttime/:endtime", getTrades, (req, res) => {
  res.json({ arrayOfTrades: res.trades });
});
async function getTrades(req, res, next) {
  let tradesObject;
  try {
    tradesObject = await trade.find({
      ticker: req.params.ticker,
      time: {
        $gte: Number(req.params.starttime),
        $lte: Number(req.params.endtime),
      },
    });

    if (tradesObject == null) {
      return res.status(404).json({ message: "Cannot find tradesObject" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.trades = tradesObject;
  next();
}

module.exports = router;
