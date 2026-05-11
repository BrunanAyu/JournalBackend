const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const dotenv   = require("dotenv");

dotenv.config();

const app = express();

// Middleware
app.use(cors({ origin: "https://journal-frontend-livid.vercel.app", credentials: true }));
app.use(express.json());

// Routes
app.use("/api/account", require("./routes/account"));
app.use("/api/auth",   require("./routes/auth"));
app.use("/api/trades", require("./routes/trades"));

// Health check
app.get("/", (req, res) => res.json({ message: "FX Journal API running" }));

// Connect DB then start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.error("DB error:", err));
