const mongoose = require("mongoose");

const tradeSchema = new mongoose.Schema({
  user:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Backtest or real-time
  type:      { type: String, enum: ["backtest", "realtime"], required: true },

  // Basic
  pair:      { type: String, required: true },
  direction: { type: String, enum: ["Buy", "Sell"], required: true },
  entry:     { type: Number, required: true },
  exit:      { type: Number, required: true },
  entryTime: { type: String },
  exitTime:  { type: String },
  lot:       { type: Number, required: true },
  sl:        { type: Number },
  tp:        { type: Number },
  pnl:       { type: Number },

  // Detailed
  setup:     { type: String },
  timeframe: { type: String },
  emotion:   { type: String },
  result:    { type: String, enum: ["Win", "Loss", "Break even"], required: true },
  pic:       { type: String },   // TradingView screenshot URL
  notes:     { type: String },

  // Session tag (London / New York / Tokyo / Sydney)
  session:   { type: String, enum: ["London", "New York", "Tokyo", "Sydney", "Other"] },

  date:      { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model("Trade", tradeSchema);
