import express from "express";
import cors from "cors";
import morgan from "morgan";
import routes from "./routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));
app.use("/api", routes);

app.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "restaurant-pos-api"
  });
});

export default app;