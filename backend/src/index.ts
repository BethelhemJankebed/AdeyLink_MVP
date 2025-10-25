import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server as IOServer } from "socket.io";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new IOServer(httpServer, { cors: { origin: "*" } });

app.use(cors());
app.use(express.json());

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/adeylink";

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error", err));

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.get("/api/test", (_req, res) => res.json({ message: "API working" }));

io.on("connection", (socket) => {
  console.log("socket connected", socket.id);
  socket.on("disconnect", () => console.log("socket disconnected", socket.id));
});

const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => console.log(`Server listening on ${PORT}`));
