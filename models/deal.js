const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dealSchema = new Schema({
  ticker: {
    type: String,
    required: true,
  },
  timeSignal: {
    type: Number,
    required: true,
  },
  timeOpen: {
    type: Number,
    required: true,
  },
  timeClose: {
    type: Number,
    required: true,
  },
  direction: {
    type: String,
    required: true,
  },
  level: {
    type: String,
    required: true,
  },
  priceOpen: {
    type: Number,
    required: true,
  },
  priceClose: {
    type: Number,
    required: true,
  },
  profit: {
    type: Number,
    required: true,
  },
});
const deal = mongoose.model("deal", dealSchema);
module.exports = deal;
