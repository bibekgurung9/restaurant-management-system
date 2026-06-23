import * as express from "express";
import * as dashboardController from "./dashboard.controller";

const router = express.Router();

// Dashboard Routes
router.get("/", dashboardController.getDashboardData);

export default router;
