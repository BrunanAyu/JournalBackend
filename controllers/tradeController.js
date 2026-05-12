const Trade = require("../models/Trade");
const { applyTradePnL } = require("./accountController");

// Helper: calculate P&L in USD (approximate)
const calcPnL = ({ pair, direction, entry, exit, lot }) => {
  const pip = pair.includes("JPY") ? 0.01 : 0.0001;
  const diff = direction === "Buy" ? exit - entry : entry - exit;
  return parseFloat((diff / pip * lot * 10).toFixed(2));
};

// Helper: build stats object from array of trades
const buildStats = (trades) => {
  const total = trades.length;
  const wins = trades.filter(t => t.result === "Win").length;
  const losses = trades.filter(t => t.result === "Loss").length;
  const be = trades.filter(t => t.result === "Break even").length;
  const totalPnL = trades.reduce((s, t) => s + (t.pnl || 0), 0);
  const winRate = total ? +((wins / total) * 100).toFixed(1) : 0;
  const avgPnL = total ? +(totalPnL / total).toFixed(2) : 0;
  const bestTrade = total ? Math.max(...trades.map(t => t.pnl || 0)) : 0;
  const worstTrade = total ? Math.min(...trades.map(t => t.pnl || 0)) : 0;
  return { total, wins, losses, be, totalPnL: +totalPnL.toFixed(2), winRate, avgPnL, bestTrade, worstTrade };
};

// POST /api/trades
const createTrade = async (req, res) => {
  try {
    const data = { ...req.body, user: req.user.id };
    data.pnl = calcPnL(data);
    const trade = await Trade.create(data);

    // ✅ Auto-update account balance after every trade
    // Only update real balance for realtime trades — backtest doesn't affect real money
    if (trade.type === "realtime") {
      await applyTradePnL(req.user.id, trade.pnl, trade._id);
    }

    res.status(201).json(trade);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/trades  — supports ?type=backtest|realtime
const getTrades = async (req, res) => {
  try {
    const filter = { user: req.user.id };
    if (req.query.type) filter.type = req.query.type;
    const trades = await Trade.find(filter).sort({ date: -1 });
    res.json(trades);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/trades/stats  — overall + breakdown by type
const getStats = async (req, res) => {
  try {
    const trades = await Trade.find({ user: req.user.id });
    const backtest = trades.filter(t => t.type === "backtest");
    const realtime = trades.filter(t => t.type === "realtime");
    res.json({
      all: buildStats(trades),
      backtest: buildStats(backtest),
      realtime: buildStats(realtime),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// GET /api/trades/review  — filter by year / month / session / type
const getReview = async (req, res) => {
  try {
    const { year, month, session, type } = req.query;
    const filter = { user: req.user.id };
    if (type) filter.type = type;
    if (session) filter.session = session;

    // Date range filter
    if (year) {
      const y = parseInt(year);
      const m = month ? parseInt(month) - 1 : null;
      const from = m !== null ? new Date(y, m, 1) : new Date(y, 0, 1);
      const to = m !== null ? new Date(y, m + 1, 0, 23, 59, 59) : new Date(y, 11, 31, 23, 59, 59);
      filter.date = { $gte: from, $lte: to };
    }

    const trades = await Trade.find(filter).sort({ date: -1 });
    res.json({ trades, stats: buildStats(trades) });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// DELETE /api/trades/:id
const deleteTrade = async (req, res) => {
  try {
    await Trade.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ message: "Trade deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { createTrade, getTrades, getStats, getReview, deleteTrade };
