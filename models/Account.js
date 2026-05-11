const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  balance: { type: Number, required: true },   // current balance
  history: [
    {
      type:      { type: String, enum: ["initial", "deposit", "withdrawal", "trade"] },
      amount:    { type: Number },              // + deposit / - withdrawal / +- trade pnl
      balance:   { type: Number },              // balance after this event
      note:      { type: String },
      tradeId:   { type: mongoose.Schema.Types.ObjectId, ref: "Trade" },
      date:      { type: Date, default: Date.now },
    }
  ],
}, { timestamps: true });

module.exports = mongoose.model("Account", accountSchema);