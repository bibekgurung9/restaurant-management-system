import { Request, Response, NextFunction } from "express";
import jwt, { Secret } from "jsonwebtoken";
import { config } from "dotenv";
import { failureResponse } from "../helpers/responseHelpers";
import prisma from "../config/database";
import { Admin, AdminRole } from "@prisma/client";

config(); // Load environment variables from .env file

const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return failureResponse(res, "Unauthorized!", 401);
  }

  const token = authHeader.split(" ")[1];

  // Check if the token is in the token blacklist
  const isBlacklisted = await prisma.tokenBlacklist.findFirst({ where: { token } });

  if (isBlacklisted) {
    return failureResponse(
      res,
      "Token has been invalidated. Please log in again.",
      401
    );
  }

  const secretKey = process.env.ADMIN_JWT_SECRET as Secret | undefined;

  jwt.verify(token, secretKey!, async (err, decoded) => {
    if (err) {
      return failureResponse(res, "Unauthorized", 401);
    }

    // Type assertion to specify the shape of the decoded object
    const decodedUser = decoded as { id: number; email: string, role: AdminRole; };

    // Attach the decoded user information to the request object
    req.admin = {
      id: decodedUser.id /* add other user attributes here */,
      email: decodedUser.email,
      role: decodedUser.role,
    } as Admin;

    // Update the last_active_at field with the current timestamp
    if (req.admin && req.admin.id) {
      await prisma.admin.update({
        where: { id: req.admin.id },
        data: { last_active_at: new Date() },
      });
    }

    next();
  });
};

export default verifyToken;
