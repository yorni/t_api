const express = require("express");
const router = express.Router();
const trade = require("../models/trade");

//Get One
router.get("/:ticker/:starttime/:endtime", getTrades, (req, res) => {
  res.json(res.trades);
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
  let tradesArray = tradesObject.map(function (trade) {
    return [
      trade.time,
      trade.price,
      trade.volume,
      1, // All deals quantity
      trade.buyerMaker ? 1 : 0, // BuyerMaker deals quantity
      trade.buyerMaker ? 0 : 1, // ! BuyerMaker deals quantity
      trade.buyerMaker ? trade.volume : 0, // BuyerMaker deals vol
      trade.buyerMaker ? 0 : trade.volume, // ! BuyerMaker deals vol
    ];
  });
  res.trades = tradesArray;
  next();
}

module.exports = router;
