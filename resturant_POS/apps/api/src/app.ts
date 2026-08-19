import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.js";

const app = express();

// ---------- CORS configuration ----------
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      "http://localhost:3000",
      "http://localhost:19006",
      "http://localhost:8081",           // Expo web Metro
      "exp://*",                          // Expo Go (any host)
      "http://192.168.*:*",
      "http://localhost:5173",             // any local IP (development)
    ];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      // Test each allowed pattern (converting * wildcards to regex)
      const isAllowed = allowedOrigins.some((pattern) => {
        const regex = new RegExp(
          "^" + pattern.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$"
        );
        return regex.test(origin);
      });

      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ---------- Security headers ----------
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// ---------- Rate limiting ----------
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Too many login attempts, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/v1/auth/login", loginLimiter);
app.use("/api/v1", apiLimiter);

// ---------- Body parsing & logging ----------
app.use(express.json());
app.use(morgan("dev"));

// ---------- API routes ----------
app.use("/api/v1", routes);

// ---------- Health check ----------
app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "restaurant-pos-api",
  });
});

export default app;