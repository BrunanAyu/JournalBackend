const router  = require("express").Router();
const protect = require("../middleware/auth");
const {
  createTrade, getTrades, getStats, getReview, deleteTrade,
} = require("../controllers/tradeController");

// All routes require JWT
router.use(protect);

router.post("/",        createTrade);
router.get("/",         getTrades);
router.get("/stats",    getStats);
router.get("/review",   getReview);
router.delete("/:id",   deleteTrade);

module.exports = router;
