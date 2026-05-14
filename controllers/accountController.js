const Account = require("../models/Account");

// GET /api/account — get current balance + history
const getAccount = async (req, res) => {
  try {
    const account = await Account.findOne({ user: req.user.id });
    if (!account) return res.json({ balance: null, history: [] });
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/account/setup — set initial balance (only once)
const setupBalance = async (req, res) => {
  try {
    const { balance } = req.body;
    const existing = await Account.findOne({ user: req.user.id });

    // Already exists — don't overwrite
    if (existing) return res.status(400).json({ message: "Balance already set. Use deposit instead." });

    const account = await Account.create({
      user: req.user.id,
      balance,
      history: [{ type: "initial", amount: balance, balance, note: "Initial deposit" }],
    });
    res.status(201).json(account);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/account/deposit — add funds
const deposit = async (req, res) => {
  try {
    const { amount, note } = req.body;
    const account = await Account.findOne({ user: req.user.id });
    if (!account) return res.status(404).json({ message: "Set up your balance first." });

    account.balance += amount;
    account.history.push({ type: "deposit", amount, balance: account.balance, note: note || "Deposit" });
    await account.save();
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST /api/account/withdrawal — remove funds
const withdrawal = async (req, res) => {
  try {
    const { amount, note } = req.body;
    const account = await Account.findOne({ user: req.user.id });
    if (!account) return res.status(404).json({ message: "Set up your balance first." });
    if (amount > account.balance) return res.status(400).json({ message: "Insufficient balance." });

    account.balance -= amount;
    account.history.push({ type: "withdrawal", amount: -amount, balance: account.balance, note: note || "Withdrawal" });
    await account.save();
    res.json(account);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Internal — called automatically when a trade is saved
const applyTradePnL = async (userId, pnl, tradeId) => {
  const account = await Account.findOne({ user: userId });
  if (!account) return; // no account set up yet, skip silently

  account.balance = parseFloat((account.balance + pnl).toFixed(2));
  account.history.push({
    type: "trade",
    amount: pnl,
    balance: account.balance,
    note: `Trade P&L`,
    tradeId,
  });
  await account.save();
};

// Called when a trade is deleted — reverses the P&L from balance
const reverseTradePnL = async (userId, pnl, tradeId) => {
  const account = await Account.findOne({ user: userId });
  if (!account) return;

  account.balance = parseFloat((account.balance - pnl).toFixed(2));
  account.history.push({
    type: "trade",
    amount: -pnl,  // reverse the original pnl
    balance: account.balance,
    note: `Trade deleted (reversed)`,
    tradeId,
  });
  await account.save();
};

// Called when a trade is updated — adjusts balance by the difference
const adjustTradePnL = async (userId, oldPnl, newPnl, tradeId) => {
  const account = await Account.findOne({ user: userId });
  if (!account) return;

  const diff = newPnl - oldPnl; // only apply the difference
  if (diff === 0) return;       // nothing changed, skip

  account.balance = parseFloat((account.balance + diff).toFixed(2));
  account.history.push({
    type: "trade",
    amount: diff,
    balance: account.balance,
    note: `Trade updated (adjustment)`,
    tradeId,
  });
  await account.save();
};

module.exports = { getAccount, setupBalance, deposit, withdrawal, applyTradePnL,reverseTradePnL, adjustTradePnL };