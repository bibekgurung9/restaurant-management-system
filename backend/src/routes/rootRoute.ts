import * as express from "express";
import { prisma } from "../config/database";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Check the database connection status
    const databaseConnected = await dbStatus();

    // Create a JSON response with server status details
    const statusResponse = {
      status: "Server & database are both up and running",
      databaseConnected: databaseConnected,
      requestIp: req.ip,
    };

    // Send the JSON response
    res.json(statusResponse);
  } catch (error) {
    // Handle any errors here and send an appropriate response
    console.error("Error checking database connection:", error);
    res.status(500).json({ error: "Server error" });
  }
});

async function dbStatus(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return true;
  } catch (err) {
    console.error("Database connection failed:", err);

    return false;
  }
}

export default router;
