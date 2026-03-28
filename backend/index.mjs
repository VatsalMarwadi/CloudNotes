import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

import { URI, port } from "./config.mjs";
import router from "./src/routes/route.mjs";

/* ================= LOAD ENV ================= */

dotenv.config();

const app = express();

/* ================= MIDDLEWARES ================= */

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= HEALTH CHECK ================= */

app.get("/", (req, res) => {
  res.status(200).send({
    status: "Ok",
    message: "API is running successfully 🚀",
  });
});

/* ================= ROUTES ================= */

app.use("/", router);

/* ================= DATABASE CONNECTION ================= */

mongoose
  .connect(URI)
  .then(() => {
    console.log("✅ Database Connected Successfully");

    app.listen(port, () => {
      console.log(`🚀 Server Started At Port ${port}`);
    });
  })
  .catch((err) => {
    console.error("❌ Database Connection Failed");
    console.error(err.message);
    process.exit(1);
  });

/* ================= GLOBAL ERROR HANDLER ================= */

app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.message);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});