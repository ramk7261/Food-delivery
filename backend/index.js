import express from "express";
import dotenv from "dotenv";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server } from "socket.io";

import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import userRouter from "./routes/user.routes.js";
import itemRouter from "./routes/item.routes.js";
import shopRouter from "./routes/shop.routes.js";
import orderRouter from "./routes/order.routes.js";
import { socketHandler } from "./socket.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

/* =======================
   FRONTEND URL (ENV)
   ======================= */
const FRONTEND_URL =
  process.env.FRONTEND_URL || "http://localhost:5173";

/* =======================
   SOCKET.IO SETUP
   ======================= */
const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  }
});

// make io available in routes
app.set("io", io);

/* =======================
   MIDDLEWARES
   ======================= */
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// Preflight request fix
app.options("*", cors());

app.use(express.json());
app.use(cookieParser());

/* =======================
   ROUTES
   ======================= */
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/order", orderRouter);

/* =======================
   SOCKET HANDLER
   ======================= */
socketHandler(io);

/* =======================
   SERVER START
   ======================= */
const PORT = process.env.PORT || 5000;

server.listen(PORT, async () => {
  try {
    await connectDb();
    console.log(`✅ Server started on port ${PORT}`);
    console.log(`✅ Allowed frontend: ${FRONTEND_URL}`);
  } catch (error) {
    console.error("❌ DB connection failed:", error.message);
  }
});
