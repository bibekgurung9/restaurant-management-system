import { Request, Response } from "express";
import { AuditService } from "../../services/audit.service";
import { failureResponse, successResponse } from "../../helpers/responseHelpers";

// ========== GET AUDIT LOGS ==========

/**
 * GET /audit-logs
 * Returns paginated audit logs with optional filters
 */
export const getAuditLogs = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
  const action = req.query.action as string;
  const entity = req.query.entity as string;
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  try {
    const logs = await AuditService.getLogs({
      page,
      limit,
      userId,
      action,
      entity,
      startDate,
      endDate,
    });

    return successResponse(res, "Audit logs retrieved successfully", logs.data, logs.meta);
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return failureResponse(res, "Failed to fetch audit logs", 500);
  }
};

// ========== GET RECENT LOGS ==========

/**
 * GET /audit-logs/recent
 * Returns recent logs (last 24 hours)
 */
export const getRecentLogs = async (req: Request, res: Response): Promise<void> => {
  const limit = parseInt(req.query.limit as string) || 100;

  try {
    const logs = await AuditService.getRecentLogs(limit);
    return successResponse(res, "Recent logs retrieved successfully", logs);
  } catch (error) {
    console.error("Error fetching recent logs:", error);
    return failureResponse(res, "Failed to fetch recent logs", 500);
  }
};

// ========== GET ACTIVITY SUMMARY ==========

/**
 * GET /audit-logs/summary
 * Returns activity summary (last 7 days)
 */
export const getActivitySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const summary = await AuditService.getActivitySummary();
    return successResponse(res, "Activity summary retrieved successfully", summary);
  } catch (error) {
    console.error("Error fetching activity summary:", error);
    return failureResponse(res, "Failed to fetch activity summary", 500);
  }
};