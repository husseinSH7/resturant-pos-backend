import "dotenv/config";
import { createServer } from "http";
import app from "./app.js";
import { initializeWebSocket } from "./websocket/index.js";

const PORT = Number(process.env.PORT) || 4000;

const server = createServer(app);
const io = initializeWebSocket(server);

server.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(`WebSocket server initialized`);
});
