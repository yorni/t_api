const express = require("express");
const router = express.Router();
const depth = require("../models/depth");

//Get One
router.get("/:ticker/:starttime", getDepth, (req, res) => {
  res.json(res.depth);
});
//Get One
router.get("/so/:ticker/:starttime", getDepthSingleObject, (req, res) => {
  res.json(res.depth);
});

//Get One to percent
router.get(
  "/sop/:ticker/:starttime/:percent",
  getDepthSingleObjectToPercent,
  (req, res) => {
    res.json(res.depth);
  }
);

async function getDepth(req, res, next) {
  let depthObject;
  // console.log(req.params);
  try {
    depthObject = await depth
      .find({
        ticker: req.params.ticker,
        time: { $lte: Number(req.params.starttime) },
      })
      .sort({ time: -1 })
      .limit(1);
    if (!depthObject[0]) {
      return res.status(404).json({ message: "Cannot find depthObject" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  ////////////////
  depthRes = {
    asks: [],
    bids: [],
  };

  ////////////////
  let minBid = Number(Object.keys(depthObject[0].bids)[0]) / 1.05;
  let maxAsk = Number(Object.keys(depthObject[0].asks)[0]) * 1.05;
  var BreakException = {};
  try {
    Object.keys(depthObject[0].bids).forEach((bid) => {
      if (Number(bid) >= minBid) {
        depthRes.bids.push([bid, depthObject[0].bids[bid]]);
      } else {
        throw BreakException;
      }
    });
  } catch (e) {
    if (e !== BreakException) throw e;
  }

  try {
    Object.keys(depthObject[0].asks).forEach((ask) => {
      if (Number(ask) <= maxAsk) {
        depthRes.asks.push([ask, depthObject[0].asks[ask]]);
      } else {
        throw BreakException;
      }
    });
  } catch (e) {
    if (e !== BreakException) throw e;
  }

  res.depth = depthRes;
  next();
}

async function getDepthSingleObjectToPercent(req, res, next) {
  let depthObject;
  // console.log(req.params);
  try {
    depthObject = await depth
      .find({
        ticker: req.params.ticker,
        time: { $lte: Number(req.params.starttime) },
      })
      .sort({ time: -1 })
      .limit(1);
    if (!depthObject[0]) {
      return res.status(404).json({ message: "Cannot find depthObject" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  ////////////////
  depthRes = [];

  ////////////////
  let percent = req.params.percent;
  let minBid =
    Number(Object.keys(depthObject[0].bids)[0]) / (1 + percent / 100);
  let maxAsk =
    Number(Object.keys(depthObject[0].asks)[0]) * (1 + percent / 100);
  var BreakException = {};
  try {
    Object.keys(depthObject[0].bids).forEach((bid) => {
      if (Number(bid) >= minBid) {
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
      if (Number(ask) <= maxAsk) {
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

  res.depth = depthRes.sort(function (a, b) {
    return Number(a[0]) - Number(b[0]);
  });

  next();
}

async function getDepthSingleObject(req, res, next) {
  let depthObject;
  // console.log(req.params);
  try {
    depthObject = await depth
      .find({
        ticker: req.params.ticker,
        time: { $lte: Number(req.params.starttime) },
      })
      .sort({ time: -1 })
      .limit(1);
    if (!depthObject[0]) {
      return res.status(404).json({ message: "Cannot find depthObject" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  ////////////////
  depthRes = [];

  ////////////////
  let minBid = Number(Object.keys(depthObject[0].bids)[0]) / 1.05;
  let maxAsk = Number(Object.keys(depthObject[0].asks)[0]) * 1.05;
  var BreakException = {};
  try {
    Object.keys(depthObject[0].bids).forEach((bid) => {
      if (Number(bid) >= minBid) {
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
      if (Number(ask) <= maxAsk) {
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

  res.depth = depthRes.sort(function (a, b) {
    return Number(a[0]) - Number(b[0]);
  });

  next();
}

module.exports = router;
