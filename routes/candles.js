const express = require("express");
const router = express.Router();
const candle = require("../models/candle");

//Get One
router.get("/:ticker/:starttime/:endtime", getTrades, (req, res) => {
  res.json(res.trades);
});
async function getTrades(req, res, next) {
  let candlesObject;
  try {
    candlesObject = await candle.find({
      ticker: req.params.ticker,
      time: {
        $gte: Number(req.params.starttime),
        $lte: Number(req.params.endtime),
      },
    });

    if (candlesObject == null) {
      return res.status(404).json({ message: "Cannot find tradesObject" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  let tradesArray = candlesObject.map(function (candle) {
    return [
      candle.time,
      candle.o,
      candle.h,
      candle.l,
      candle.c,
      candle.v,
      candle.q - candle.mq,
      candle.mq,
      candle.v - candle.mv, //taker volume/market buy
      candle.mv, //maker volume/market sell
    ];
  });

  res.trades = tradesArray.filter((candle) => candle[1] > 0);
  next();
}

module.exports = router;
