const express = require("express");
const router = express.Router();
const candle = require("../models/candle");
const dealM = require("./models/deal");
//Get One
router.get("/:ticker/:starttime/:endtime", getTrades, (req, res) => {
  res.json({ trades: res.trades, deals: res.deals });
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

  let dealsObject;
  try {
    dealsObject = await dealM.find({
      ticker: req.params.ticker,
      timeOpen: {
        $gte: Number(req.params.starttime),
        $lte: Number(req.params.endtime),
      },
    });

    if (dealsObject == null) {
      return res.status(404).json({ message: "Cannot find dealsObject" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  if (dealsObject == null) {
    dealsArray = [];
  } else {
    dealsArray = dealsObject.map(function (deal) {
      return [
        deal.timeOpen,
        deal.timeClose,
        deal.direction,
        deal.priceOpen,
        deal.priceClose,
        deal.profit,
      ];
    });
  }

  res.trades = tradesArray.filter((candle) => candle[1] > 0);
  res.deals = dealsArray;
  next();
}

module.exports = router;
