const jwt = require("jsonwebtoken");

// Attach user to req if token is valid
const protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer "))
    return res.status(401).json({ message: "Not authorised — no token" });

  const token = auth.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id }
    next();
  } catch {
    res.status(401).json({ message: "Token invalid or expired" });
  }
};

module.exports = protect;
