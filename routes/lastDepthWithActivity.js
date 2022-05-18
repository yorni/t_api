const express = require("express");
const router = express.Router();
const depth = require("../models/depth");
const trade = require("../models/trade");

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
    depthObject = await depth
      .find(conditionsToFind)
      .sort({ time: -1 })
      .limit(1);
    //.lean();
    if (!depthObject[0]) {
      return res.status(404).json({ message: "Cannot find depthObject" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  let tradesTime = depthObject[0].time;
  conditionsToFind = {
    ticker: req.params.ticker,
    time: {
      $gte: tradesTime - 60000,
      $lte: tradesTime,
    },
  };

  ////////////////
  depthRes = [];
  ////////////////
  let percent = req.params.percent;
  let multiplier = 1 + percent / 100;
  let divider = 1 - percent / 100;
  let marketBid = Number(Object.keys(depthObject[0].bids)[0]);
  let marketAsk = Number(Object.keys(depthObject[0].asks)[0]);
  var BreakException = {};
  try {
    Object.keys(depthObject[0].bids).forEach((bid) => {
      if (Number(bid) >= marketBid * divider) {
        lBid = depthObject[0].bids[bid];
        lAsk = 0;
        if (depthObject[0].asks[bid]) {
          lAsk = depthObject[0].asks[bid];
          delete depthObject[0].asks[bid];
        }
        depthRes.push([bid, lBid, lAsk]);
      } else {
        throw BreakException;
      }
    });
  } catch (e) {
    if (e !== BreakException) throw e;
  }

  try {
    Object.keys(depthObject[0].asks).forEach((ask) => {
      if (Number(ask) <= marketAsk * multiplier) {
        lBid = 0;
        lAsk = depthObject[0].asks[ask];
        depthRes.push([ask, lBid, lAsk]);
      } else {
        throw BreakException;
      }
    });
  } catch (e) {
    if (e !== BreakException) throw e;
  }

  let objectWithPercents = {};
  for (let i = -(percent * 10); i < percent * 10; i = i + 1) {
    objectWithPercents[String(i)] = { bid: 0, ask: 0 };
    if (i < 0) {
      minVal = marketBid * 100 + i / 10;
      maxVal = marketBid * 100 + (i + 1) / 10;
    } else {
      {
        minVal = marketAsk * 100 + i / 10;
        maxVal = marketAsk * 100 + (i + 1) / 10;
      }
    }

    depthRes.forEach((element) => {
      if (element[0] >= minVal && element[0] < maxVal) {
        objectWithPercents[String(i)].bid =
          objectWithPercents[String(i)].bid + element[1];
        objectWithPercents[String(i)].ask =
          objectWithPercents[String(i)].ask + element[2];
      }
    });
  }

  depthRes = [];
  Object.keys(objectWithPercents).forEach((key) => {
    depthRes.push([
      key,
      objectWithPercents[key].bid,
      objectWithPercents[key].ask,
    ]);
  });

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
