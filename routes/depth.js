const express = require("express");
const router = express.Router();
const depth = require("../models/depth");

//Get One
router.get("/:ticker/:starttime", getDepth, (req, res) => {
  res.json(res.depth);
});
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
        depthRes.bids.push([bid, depthRes.bids[bid]]);
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
        depthRes.asks.push([ask, depthRes.asks[ask]]);
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

module.exports = router;
