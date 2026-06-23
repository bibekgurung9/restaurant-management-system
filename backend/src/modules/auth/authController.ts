import { Request, Response } from "express";
// @ts-ignore
import jwt from "jsonwebtoken";
// @ts-ignore
import bcrypt from "bcryptjs";
import mimeTypes from "mime-types";
import prisma from "../../config/database";

import {
  successResponse,
  failureResponse,
} from "../../helpers/responseHelpers";
import { deleteImage, getImageUrl, uploadImage } from "../../services/image.service";
import { AuditService } from "../../services/audit.service";

const validImageTypes = ["jpg", "jpeg", "png", "webp"];

// Controller for Admin login
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return failureResponse(res, "Email and password are required.", 400);
    }

    const admin = await prisma.admin.findUnique({ where: { email } });

    if (!admin) {
      return failureResponse(res,
        "The email that you provided is not registered in our system.",
        401
      );
    }

    if (!admin) {
      // Log failed login attempt (user not found)
      await AuditService.logLogin(
        0,
        email,
        "UNKNOWN",
        false,
        req.ip,
        req.get("user-agent")
      );
      return failureResponse(res, "The email that you provided is not registered in our system.", 401);
    }

    const isValidPassword = await bcrypt.compare(password, admin.password);

    if (!isValidPassword) {
      return failureResponse(
        res,
        "Provided credentials do not match our records.",
        401
      );
    }

    if (!isValidPassword) {
      // Log failed login attempt (invalid password)
      await AuditService.logLogin(
        admin.id,
        admin.email,
        admin.role,
        false,
        req.ip,
        req.get("user-agent")
      );
      return failureResponse(res, "Provided credentials do not match our records.", 401);
    }

    const accessSecretKey = process.env.ADMIN_JWT_SECRET as string;
    const refreshSecretKey = process.env.ADMIN_REFRESH_JWT_SECRET as string;

    const accessToken = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      },
      accessSecretKey,
      {
        expiresIn: (process.env.ADMIN_JWT_TOKEN_EXPIRE || "7d") as any,
      }
    );

    const refreshToken = jwt.sign(
      {
        id: admin.id,
        role: admin.role,
      },
      refreshSecretKey,
      {
        expiresIn: (process.env.ADMIN_REFRESH_TOKEN_EXPIRE || "7d") as any,
      }
    );

    // Calculate refresh token expiration
    const refreshExpiresInSeconds = parseInt(process.env.ADMIN_REFRESH_TOKEN_EXPIRE || "604800"); // Default to 7 days
    const refreshTokenExpiresAt = new Date(Date.now() + refreshExpiresInSeconds * 1000);

    // Save the refresh token
    await prisma.adminRefreshToken.create({
      data: {
        adminId: admin.id,
        token: refreshToken,
        expires_at: refreshTokenExpiresAt,
      },
    });

    const response: {
      name: string;
      email: string;
      userType: string;
      phone?: string;
      image?: string;
      phoneVerified: boolean;
      emailVerified: boolean;
      accessToken: string;
      refreshToken: string
    } = {
      name: admin.name,
      email: admin.email,
      userType: "admin",
      phone: admin.phone || "",
      image: admin.image ? getImageUrl(admin.image) : "",
      phoneVerified: admin.phone_verified,
      emailVerified: admin.email_verified,
      accessToken,
      refreshToken
    };

    if (admin.image) {
      response.image = await getImageUrl(admin.image);
    }

    // Set tokens as cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      maxAge: 36000, // 1hr
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    await AuditService.logLogin(
      admin.id,
      admin.email,
      admin.role,
      true,
      req.ip,
      req.get("user-agent")
    );

    return successResponse(res, "Login successful", response);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Server error", 500);
  }
};

// Controller for the protected route
export const protectedRoute = async (
  req: Request,
  res: Response
): Promise<void> => {
  const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });

  if (!admin) {
    return failureResponse(res, "Admin not found", 404);
  }

  const response: {
    name: string;
    email: string;
    userType: string;
    role: string;
    image: any;
    phone?: string;
    phoneVerified: boolean;
    emailVerified: boolean;
  } = {
    name: admin.name,
    email: admin.email,
    userType: "admin",
    role: admin.role,
    phone: admin.phone || "",
    image: admin.image ? getImageUrl(admin.image) : "",
    phoneVerified: admin.phone_verified,
    emailVerified: admin.email_verified,
  };

  return successResponse(res, "Success", response);
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        status: false,
        message: "Refresh token missing.",
      });
    }

    const secretKey = process.env.ADMIN_REFRESH_JWT_SECRET as string;

    // Verify the refresh token
    const decoded = jwt.verify(refreshToken, secretKey) as { id: number };

    // Check if the refresh token exists in the database
    const validRefreshToken = await prisma.adminRefreshToken.findFirst({
      where: { token: refreshToken },
    });

    if (!validRefreshToken) {
      return res.status(401).json({
        status: false,
        message: "Invalid refresh token.",
      });
    }

    // Generate a new access token
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
    });

    const newAccessToken = jwt.sign(
      { id: admin?.id, email: admin?.email },
      process.env.ADMIN_JWT_SECRET!,
      { expiresIn: process.env.ADMIN_JWT_TOKEN_EXPIRE || "7d" } as any
    );

    return res.status(200).json({
      status: true,
      message: "Access token refreshed successfully.",
      data: { accessToken: newAccessToken },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error.",
    });
  }
};

// Controller for Admin logout
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return failureResponse(res, "Refresh token is missing.", 400);
    }

    const tokenRecord = await prisma.adminRefreshToken.findFirst({
      where: { token: refreshToken },
    });

    // After deleting the refresh token and before returning response
    if (tokenRecord) {
      await prisma.adminRefreshToken.delete({
        where: { id: tokenRecord.id },
      });

      // Log logout
      await AuditService.logLogout(
        req.admin.id,
        req.admin.email,
        req.admin.role,
        req.ip,
        req.get("user-agent")
      );

      return successResponse(res, "Logout successful");
    } else {
      return failureResponse(res, "Refresh token not found.", 404);
    }
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Server error", 500);
  }
};

// Controller for updating the current user's info
export const updateInfo = async (req: Request, res: Response) => {
  const { name } = req.body;

  if (!name) {
    return failureResponse(res, "Name field is required.", 400);
  }

  const admin = await prisma.admin.findUnique({ where: { id: req.admin.id } });

  if (!admin) {
    return failureResponse(res, "Admin not found", 404);
  }

  try {
    let imageURL = admin.image;
    // Check if a file was uploaded
    if (req.file) {
      // Check if it's a valid image file based on its MIME type
      const extension = mimeTypes.extension(req.file.mimetype);

      if (extension) {
        const isValidImage = validImageTypes.includes(extension);
        if (!isValidImage) {
          return failureResponse(res, "Invalid image file", 400);
        }
      } else {
        return failureResponse(res, "Invalid image file", 400);
      }

      // Upload the image to S3 and get the image URL
      try {
        const result = await uploadImage(req.file.buffer, "admins");
        imageURL = result.public_id;
        if (admin.image) {
          await deleteImage(admin.image);
        }
      } catch (error) {
        imageURL = admin.image;
      }
    }

    // After updating admin info
    const updated = await prisma.admin.update({
      where: { id: admin.id },
      data: {
        name,
        image: imageURL,
      },
    });

    // Log profile update
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "UPDATE",
      entity: "STAFF",
      entityId: admin.id,
      changes: {
        before: {
          name: admin.name,
          image: admin.image,
        },
        after: {
          name: updated.name,
          image: updated.image,
        },
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    const response: {
      name: string;
      email: string;
      image: any;
      phone?: string;
      phoneVerified: boolean;
      emailVerified: boolean;
    } = {
      name: updated.name,
      email: updated.email,
      phone: updated.phone || "",
      image: await getImageUrl(updated.image || ""),
      phoneVerified: updated.phone_verified,
      emailVerified: updated.email_verified,
    };

    return successResponse(res, "Information updated successfully.", response);
  } catch (error) {
    return failureResponse(res, "Failed to upload the image to Cloudinary.", 500);
  }
};
