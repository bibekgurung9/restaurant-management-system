import dotenv from "dotenv";
dotenv.config();

import express, { Application } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";

import prisma from "./config/database";
import * as errorHandlingController from "./modules/errorHandlingController";
import { checkLowStockAndNotify } from "./helpers/checkLowStockAndNotify";
import routes from "./routes";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";
 
const app: Application = express();

// CORS
const isDevelopment = process.env.NODE_ENV === "development";

if (isDevelopment) {
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    })
  );
}

// Body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Swagger docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use("/", routes);

// Error handling
app.use(errorHandlingController.handle404Error);
app.use(errorHandlingController.handleGeneralError);

// Server startup
const PORT = parseInt(process.env.PORT || "9000", 10);
let io: SocketIOServer;

async function startServer() {
  try {
    // Connect Prisma
    await prisma.$connect();

    console.log("✅ Database connected successfully");

    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log(
        `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
      );
    });

    // Initialize Socket.IO
    io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN,
        methods: ["GET", "POST"],
      },
    });

    // Socket.IO events
    io.on("connection", (socket) => {
      console.log("🔌 Client connected:", socket.id);

      checkLowStockAndNotify();

      socket.on("disconnect", () => {
        console.log(" Client disconnected:", socket.id);
      });
    });

  } catch (error) {
    console.error("Database connection failed");
    console.error(error);

    process.exit(1);
  }
}

startServer();

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("🛑 Shutting down server...");

  await prisma.$disconnect();

  process.exit(0);
});

export { io };