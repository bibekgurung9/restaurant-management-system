import { Request, Response, NextFunction } from "express";
import { AdminRole } from "@prisma/client";

const authorize = (...roles: AdminRole[]) => {
  return (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.admin) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!roles.includes(req.admin.role)) {
        return res.status(403).json({
          success: false,
          message: "Forbidden: You don't have permission to access this resource",
        });
      }

      next();

    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Authorization failed",
      });
    }
  };
};

export default authorize;