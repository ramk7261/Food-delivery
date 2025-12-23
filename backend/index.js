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
   ALLOWED FRONTEND ORIGINS
   ======================= */
const allowedOrigins = [
  "https://food-delivery-sepia-two.vercel.app",
  "https://food-delivery-theta-puce-46.vercel.app",
  "http://localhost:5173"
];

/* =======================
   SOCKET.IO SETUP
   ======================= */
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.set("io", io);

/* =======================
   MIDDLEWARES
   ======================= */
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Postman / server calls

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Preflight fix
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
  } catch (error) {
    console.error("❌ DB connection failed:", error.message);
  }
});
