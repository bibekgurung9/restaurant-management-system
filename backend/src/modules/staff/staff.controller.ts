import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { successResponse, failureResponse } from "../../helpers/responseHelpers";
import { getImageUrl } from "../../services/image.service";
import { AuditService } from "../../services/audit.service";
import prisma from "../../config/database";

// ========== HELPERS ==========

/**
 * Format staff member for response (exclude password)
 */
const formatStaffMember = (admin: any) => {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    phone: admin.phone || null,
    image: admin.image ? getImageUrl(admin.image) : "",
    role: admin.role,
    verified: admin.verified,
    phone_verified: admin.phone_verified,
    email_verified: admin.email_verified,
    last_active_at: admin.last_active_at,
    type: admin.type || null,
    remarks: admin.remarks || null,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  };
};

/**
 * Check if a user can modify another user based on roles
 */
const canModifyUser = (
  currentUserRole: string,
  targetUserRole: string,
  currentUserId: number,
  targetUserId: number
): { allowed: boolean; reason?: string } => {
  if (currentUserId === targetUserId) {
    return { allowed: true };
  }

  if (currentUserRole === "SUPER_ADMIN") {
    return { allowed: true };
  }

  if (currentUserRole === "ADMIN") {
    if (targetUserRole === "SUPER_ADMIN" || targetUserRole === "ADMIN") {
      return { allowed: false, reason: "Cannot modify Super Admin or Admin accounts" };
    }
    return { allowed: true };
  }

  return { allowed: false, reason: "Insufficient permissions" };
};

// ========== GET ALL STAFF (PAGINATED) ==========
// ❌ NO LOGGING - Read-only
export const getStaffList = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  const roleFilter = req.query.role as string;
  const search = req.query.search as string;

  try {
    const where: any = {};

    if (roleFilter) {
      where.role = roleFilter;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const currentUser = req.admin;
    if (currentUser?.role !== "SUPER_ADMIN") {
      where.role = { not: "SUPER_ADMIN" };
    }

    const [staff, totalStaff] = await Promise.all([
      prisma.admin.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
          role: true,
          verified: true,
          phone_verified: true,
          email_verified: true,
          last_active_at: true,
          type: true,
          remarks: true,
          createdAt: true,
          updatedAt: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.admin.count({ where }),
    ]);

    const formattedStaff = staff.map(formatStaffMember);
    const totalPages = Math.ceil(totalStaff / limit);

    const meta = {
      page,
      limit,
      totalStaff,
      totalPages,
    };

    return successResponse(res, "Staff list retrieved successfully", formattedStaff, meta);
  } catch (error) {
    console.error("Error fetching staff list:", error);
    return failureResponse(res, "Failed to fetch staff list", 500);
  }
};

// ========== GET STAFF BY ID ==========
// ❌ NO LOGGING - Read-only
export const getStaffById = async (req: Request, res: Response): Promise<void> => {
  const staffId = parseInt(req.params.id);

  if (isNaN(staffId)) {
    return failureResponse(res, "Invalid staff ID", 400);
  }

  try {
    const staff = await prisma.admin.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        verified: true,
        phone_verified: true,
        email_verified: true,
        last_active_at: true,
        type: true,
        remarks: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!staff) {
      return failureResponse(res, "Staff member not found", 404);
    }

    const currentUser = req.admin;
    if (currentUser?.role !== "SUPER_ADMIN" && staff.role === "SUPER_ADMIN") {
      return failureResponse(res, "Access denied", 403);
    }

    const formatted = formatStaffMember(staff);
    return successResponse(res, "Staff member retrieved successfully", formatted);
  } catch (error) {
    console.error("Error fetching staff member:", error);
    return failureResponse(res, "Failed to fetch staff member", 500);
  }
};

// ========== GET MY PROFILE ==========
// ❌ NO LOGGING - Read-only
export const getMyProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const staffId = req.admin.id;

    const staff = await prisma.admin.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        verified: true,
        phone_verified: true,
        email_verified: true,
        last_active_at: true,
        type: true,
        remarks: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!staff) {
      return failureResponse(res, "Staff member not found", 404);
    }

    const formatted = formatStaffMember(staff);
    return successResponse(res, "Profile retrieved successfully", formatted);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return failureResponse(res, "Failed to fetch profile", 500);
  }
};

// ========== CREATE STAFF ==========
// ✅ YES - LOG THIS (Security critical - new user created)
export const createStaff = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, phone, role, type, remarks } = req.body;

  if (!name || !email || !password || !role) {
    return failureResponse(res, "Name, email, password, and role are required", 400);
  }

  const validRoles = ["SUPER_ADMIN", "ADMIN", "STAFF", "CASHIER"];
  if (!validRoles.includes(role)) {
    return failureResponse(res, "Invalid role. Must be one of: SUPER_ADMIN, ADMIN, STAFF, CASHIER", 400);
  }

  const currentUser = req.admin;
  if (role === "SUPER_ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
    return failureResponse(res, "Only SUPER_ADMIN can create another SUPER_ADMIN", 403);
  }

  try {
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      return failureResponse(res, "Email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || null,
        role: role as any,
        type: type || null,
        remarks: remarks || null,
        verified: false,
        phone_verified: false,
        email_verified: false,
      },
    });

    // ✅ LOG - Staff created
    await AuditService.log({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "CREATE",
      entity: "STAFF",
      entityId: newStaff.id,
      changes: {
        name: newStaff.name,
        email: newStaff.email,
        role: newStaff.role,
        phone: newStaff.phone,
        type: newStaff.type,
        remarks: newStaff.remarks,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    const { password: _, ...staffWithoutPassword } = newStaff;
    const formatted = formatStaffMember(staffWithoutPassword);

    return successResponse(res, "Staff member created successfully", formatted, 201);
  } catch (error) {
    console.error("Error creating staff member:", error);
    return failureResponse(res, "Failed to create staff member", 500);
  }
};

// ========== UPDATE STAFF ==========
// ✅ YES - LOG THIS (Security critical - user modified)
export const updateStaff = async (req: Request, res: Response): Promise<void> => {
  const staffId = parseInt(req.params.id);

  if (isNaN(staffId)) {
    return failureResponse(res, "Invalid staff ID", 400);
  }

  const { name, phone, role, type, remarks, verified } = req.body;

  if (Object.keys(req.body).length === 0) {
    return failureResponse(res, "At least one field must be provided to update", 400);
  }

  try {
    const currentUser = req.admin;
    const targetStaff = await prisma.admin.findUnique({
      where: { id: staffId },
    });

    if (!targetStaff) {
      return failureResponse(res, "Staff member not found", 404);
    }

    const permission = canModifyUser(
      currentUser.role,
      targetStaff.role,
      currentUser.id,
      staffId
    );

    if (!permission.allowed) {
      return failureResponse(res, permission.reason || "Access denied", 403);
    }

    // Store old values for audit
    const oldValues = {
      name: targetStaff.name,
      phone: targetStaff.phone,
      role: targetStaff.role,
      type: targetStaff.type,
      remarks: targetStaff.remarks,
      verified: targetStaff.verified,
    };

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone || null;
    if (type !== undefined) updateData.type = type || null;
    if (remarks !== undefined) updateData.remarks = remarks || null;
    if (verified !== undefined) updateData.verified = verified;

    if (role !== undefined) {
      if (currentUser.role !== "SUPER_ADMIN") {
        return failureResponse(res, "Only SUPER_ADMIN can change roles", 403);
      }

      const validRoles = ["SUPER_ADMIN", "ADMIN", "STAFF", "CASHIER"];
      if (!validRoles.includes(role)) {
        return failureResponse(res, "Invalid role. Must be one of: SUPER_ADMIN, ADMIN, STAFF, CASHIER", 400);
      }

      if (targetStaff.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
        const superAdminCount = await prisma.admin.count({
          where: { role: "SUPER_ADMIN" },
        });
        if (superAdminCount <= 1) {
          return failureResponse(res, "Cannot demote the last SUPER_ADMIN", 400);
        }
      }

      updateData.role = role;
    }

    const updatedStaff = await prisma.admin.update({
      where: { id: staffId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        verified: true,
        phone_verified: true,
        email_verified: true,
        last_active_at: true,
        type: true,
        remarks: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // ✅ LOG - Staff updated
    await AuditService.log({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "UPDATE",
      entity: "STAFF",
      entityId: staffId,
      changes: {
        before: oldValues,
        after: {
          name: updatedStaff.name,
          phone: updatedStaff.phone,
          role: updatedStaff.role,
          type: updatedStaff.type,
          remarks: updatedStaff.remarks,
          verified: updatedStaff.verified,
        },
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    const formatted = formatStaffMember(updatedStaff);
    return successResponse(res, "Staff member updated successfully", formatted);
  } catch (error) {
    console.error("Error updating staff member:", error);
    return failureResponse(res, "Failed to update staff member", 500);
  }
};

// ========== DELETE STAFF ==========
// ✅ YES - LOG THIS (Security critical - user removed)
export const deleteStaff = async (req: Request, res: Response): Promise<void> => {
  const staffId = parseInt(req.params.id);

  if (isNaN(staffId)) {
    return failureResponse(res, "Invalid staff ID", 400);
  }

  try {
    const currentUser = req.admin;

    if (currentUser.id === staffId) {
      return failureResponse(res, "You cannot delete your own account", 400);
    }

    const targetStaff = await prisma.admin.findUnique({
      where: { id: staffId },
    });

    if (!targetStaff) {
      return failureResponse(res, "Staff member not found", 404);
    }

    if (currentUser.role !== "SUPER_ADMIN") {
      return failureResponse(res, "Only SUPER_ADMIN can delete staff members", 403);
    }

    if (targetStaff.role === "SUPER_ADMIN") {
      const superAdminCount = await prisma.admin.count({
        where: { role: "SUPER_ADMIN" },
      });
      if (superAdminCount <= 1) {
        return failureResponse(res, "Cannot delete the last SUPER_ADMIN", 400);
      }
    }

    // Store staff data for audit
    const staffData = {
      name: targetStaff.name,
      email: targetStaff.email,
      role: targetStaff.role,
      phone: targetStaff.phone,
      type: targetStaff.type,
      remarks: targetStaff.remarks,
    };

    await prisma.admin.delete({
      where: { id: staffId },
    });

    // ✅ LOG - Staff deleted
    await AuditService.log({
      userId: currentUser.id,
      userEmail: currentUser.email,
      userRole: currentUser.role,
      action: "DELETE",
      entity: "STAFF",
      entityId: staffId,
      changes: {
        deleted: staffData,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return successResponse(res, "Staff member deleted successfully");
  } catch (error) {
    console.error("Error deleting staff member:", error);
    return failureResponse(res, "Failed to delete staff member", 500);
  }
};