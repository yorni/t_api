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
        time: { $lt: Number(req.params.starttime) },
      })
      .sort({ time: -1 })
      .limit(1);
    if (depthObject == null) {
      return res.status(404).json({ message: "Cannot find depthObject" });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
  res.depth = depthObject;
  next();
}

module.exports = router;
