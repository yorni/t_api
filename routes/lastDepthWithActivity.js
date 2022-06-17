const express = require("express");
const router = express.Router();
const depth = require("../models/depth");
const trade = require("../models/trade");
const candle = require("../models/candle");

router.get("/activity/:ticker/:endtime", getActivity, (req, res) => {
  res.json(res.result);
});
//Get One to percent
router.get("/:ticker/:percent/:endtime", getDepthWithActivity, (req, res) => {
  res.json(res.result);
});

async function getDepthWithActivity(req, res, next) {
  let depthObject;
  let conditionsToFind = {
    ticker: req.params.ticker,
  };

  if (req.params.endtime != "0") {
    conditionsToFind.time = {
      $lte: Number(req.params.endtime),
    };
  }

  try {
    lastCandle = await candle
      .find(conditionsToFind)
      .sort({ time: -1 })
      .limit(1);
    //.lean();
    if (!lastCandle[0]) {
      return res.status(404).json({ message: "Cannot find candle" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  // console.log(req.params.ticker);
  // console.log(lastCandle[0].ticker);
  let percent = req.params.percent;
  let multiplier = 1 + percent / 100;
  let divider = 1 - percent / 100;
  let marketBid = lastCandle[0].lastBid;
  let marketAsk = lastCandle[0].lastAsk;

  ////////////////
  depthRes = [];
  ////////////////

  var BreakException = {};
  try {
    Object.keys(lastCandle[0].bids)
      .sort(function (a, b) {
        if (Number(a) <= Number(b)) {
          return 1;
        } else {
          return -1;
        }
      })
      .forEach((bid) => {
        if (Number(bid) >= marketBid * divider) {
          lBid = lastCandle[0].bids[bid];
          lAsk = 0;
          if (lastCandle[0].asks[bid]) {
            lAsk = lastCandle[0].asks[bid];
            delete lastCandle[0].asks[bid];
          }
          depthRes.push([bid, lBid, lAsk + 0.001]);
        } else {
          throw BreakException;
        }
      });
  } catch (e) {
    if (e !== BreakException) throw e;
  }

  try {
    Object.keys(lastCandle[0].asks)
      .sort(function (a, b) {
        if (Number(a) <= Number(b)) {
          return -1;
        } else {
          return 1;
        }
      })
      .forEach((ask) => {
        if (Number(ask) <= marketAsk * multiplier) {
          lBid = 0;
          lAsk = lastCandle[0].asks[ask];
          depthRes.push([ask, lBid, lAsk + 0.001]);
        } else {
          throw BreakException;
        }
      });
  } catch (e) {
    if (e !== BreakException) throw e;
  }

  let tradesTime = lastCandle[0].time;
  conditionsToFind = {
    ticker: req.params.ticker,
    time: {
      $gte: tradesTime - 360000,
      $lte: tradesTime,
    },
  };

  try {
    candlesPerPeriod = await candle.find(conditionsToFind);
    if (!candlesPerPeriod[0]) {
      return res
        .status(404)
        .json({ message: "Cannot find candles per period" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  tradesResArr = [];
  candlesPerPeriod.forEach((candle) => {
    // if (candle.ticker != req.params.ticker) {
    //   console.log(ticker);
    //   console.log(req.params.ticker);
    // }
    if (candle.o) {
      tradesResArr.push([
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
      ]);
    }
  });

  res.result = {
    depth: depthRes.sort(function (a, b) {
      return Number(a[0]) - Number(b[0]);
    }),
    trades: tradesResArr.sort(function (a, b) {
      return Number(a[0]) - Number(b[0]);
    }),
  };

  next();
}

async function getActivity(req, res, next) {
  let tradesTime = Number(req.params.endtime);
  let conditionsToFind = {
    ticker: req.params.ticker,
    time: {
      $gte: tradesTime - 60000,
      $lte: tradesTime,
    },
  };

  let tradesRes = {};
  try {
    tradesPerPeriod = await trade.find(conditionsToFind);
    if (!tradesPerPeriod[0]) {
      return res.status(404).json({ message: "Cannot find tradesPerPeriod" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  tradesPerPeriodCumulative = {};
  tradesPerPeriod.forEach((trade) => {
    keyTime = String(trade.creationTime);
    if (!(keyTime in tradesPerPeriodCumulative)) {
      tradesPerPeriodCumulative[keyTime] = {
        volumeBuy: 0,
        volumeSell: 0,
      };

      if (trade.buyerMaker) {
        tradesPerPeriodCumulative[keyTime].volumeSell =
          tradesPerPeriodCumulative[keyTime].volumeSell + trade.volume;
      } else {
        tradesPerPeriodCumulative[keyTime].volumeBuy =
          tradesPerPeriodCumulative[keyTime].volumeBuy + trade.volume;
      }
    }
  });

  Object.keys(tradesPerPeriodCumulative).forEach((creationTimeKey) => {
    keyTime = creationTimeKey.slice(0, -3);
    qtyMarketBuy = 0;
    qtyMarketSell = 0;
    volMarketBuy = tradesPerPeriodCumulative[creationTimeKey].volumeBuy;
    volMarketSell = tradesPerPeriodCumulative[creationTimeKey].volumeSell;

    if (volMarketBuy != 0) {
      qtyMarketBuy = 1;
    }
    if (volMarketSell != 0) {
      qtyMarketSell = 1;
    }

    if (!(keyTime in tradesRes)) {
      tradesRes[keyTime] = {
        qtyMarketBuy: 0,
        qtyMarketSell: 0,
        volMarketBuy: 0,
        volMarketSell: 0,
      };
    }

    tradesRes[keyTime].qtyMarketBuy =
      tradesRes[keyTime].qtyMarketBuy + qtyMarketBuy;
    tradesRes[keyTime].qtyMarketSell =
      tradesRes[keyTime].qtyMarketSell + qtyMarketSell;
    tradesRes[keyTime].volMarketBuy =
      tradesRes[keyTime].volMarketBuy + volMarketBuy;
    tradesRes[keyTime].volMarketSell =
      tradesRes[keyTime].volMarketSell + volMarketSell;
  });

  tradesResArr = [];
  Object.keys(tradesRes).forEach((time) => {
    tradesResArr.push([
      time,
      tradesRes[time].qtyMarketBuy,
      tradesRes[time].qtyMarketSell,
      tradesRes[time].volMarketBuy,
      tradesRes[time].volMarketSell,
    ]);
  });

  res.result = tradesResArr.sort(function (a, b) {
    return Number(a[0]) - Number(b[0]);
  });

  next();
}

module.exports = router;
