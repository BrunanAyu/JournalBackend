const router  = require("express").Router();
const protect = require("../middleware/auth");
const {
  getAccount, setupBalance, deposit, withdrawal
} = require("../controllers/accountController");

router.use(protect);

router.get("/",           getAccount);
router.post("/setup",     setupBalance);
router.post("/deposit",   deposit);
router.post("/withdrawal", withdrawal);

module.exports = router;