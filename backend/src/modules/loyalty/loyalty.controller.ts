import { Request, Response } from "express";
import { successResponse, failureResponse } from "../../helpers/responseHelpers";
import { AuditService } from "../../services/audit.service";
import prisma from "../../config/database";

// ========== LIST LOYALTY PROGRAMS ==========
// ❌ NO LOGGING - Read-only
export const loyaltyProgramList = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    const loyaltyPrograms = await prisma.loyaltyProgram.findMany({
      select: {
        id: true,
        name: true,
        discount: true,
        totalOrdersRequired: true,
        totalAmountSpent: true,
        description: true,
        validFrom: true,
        validTo: true,
      },
      skip,
      take: limit,
    });

    const totalLoyaltyPrograms = await prisma.loyaltyProgram.count();
    const totalPages = Math.ceil(totalLoyaltyPrograms / limit);
    const currentDate = new Date();

    const availablePrograms: any[] = [];
    const unavailablePrograms: any[] = [];

    loyaltyPrograms.forEach((program) => {
      const isAvailable =
        new Date(program.validFrom) <= currentDate &&
        new Date(program.validTo) >= currentDate;

      const programData = {
        id: program.id,
        name: program.name,
        discount: program.discount,
        totalOrdersRequired: program.totalOrdersRequired,
        totalAmountSpent: program.totalAmountSpent,
        description: program.description,
        validFrom: program.validFrom,
        validTo: program.validTo,
        status: isAvailable ? "available" : "not available",
      };

      if (isAvailable) availablePrograms.push(programData);
      else unavailablePrograms.push(programData);
    });

    availablePrograms.sort((a, b) => new Date(a.validFrom).getTime() - new Date(b.validFrom).getTime());
    unavailablePrograms.sort((a, b) => new Date(a.validTo).getTime() - new Date(b.validTo).getTime());

    const sortedPrograms = [...availablePrograms, ...unavailablePrograms];

    const meta = { page, limit, totalLoyaltyPrograms, totalPages };
    return successResponse(res, "Loyalty programs retrieved", sortedPrograms, meta);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Server error", 500);
  }
};

// ========== CREATE LOYALTY PROGRAM ==========
// ✅ YES - LOG THIS (New loyalty program created)
export const addLoyaltyProgram = async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    discount,
    totalOrdersRequired,
    totalAmountSpent,
    description,
    validFrom,
    validTo,
  } = req.body;

  if (
    !name ||
    discount == null ||
    totalOrdersRequired == null ||
    totalAmountSpent == null
  ) {
    return failureResponse(
      res,
      "Missing required fields: name, discount, totalOrdersRequired, totalAmountSpent",
      400
    );
  }

  if (discount < 0 || discount > 100) {
    return failureResponse(res, "Discount must be between 0 and 100", 400);
  }

  try {
    const existing = await prisma.loyaltyProgram.findFirst({
      where: { discount, totalOrdersRequired, totalAmountSpent },
    });
    if (existing) {
      return failureResponse(res, "A loyalty program with these criteria already exists", 400);
    }

    const fromDate = validFrom ? new Date(validFrom) : new Date();
    const toDate = validTo ? new Date(validTo) : new Date();
    if (fromDate > toDate) {
      return failureResponse(res, "validFrom cannot be later than validTo", 400);
    }

    const newProgram = await prisma.loyaltyProgram.create({
      data: {
        name,
        discount,
        totalOrdersRequired: parseInt(totalOrdersRequired),
        totalAmountSpent: parseFloat(totalAmountSpent),
        description: description || null,
        validFrom: fromDate,
        validTo: toDate,
      },
    });

    // ✅ LOG - Loyalty program created
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "CREATE",
      entity: "LOYALTY_PROGRAM",
      entityId: newProgram.id,
      changes: {
        name: newProgram.name,
        discount: newProgram.discount,
        totalOrdersRequired: newProgram.totalOrdersRequired,
        totalAmountSpent: newProgram.totalAmountSpent,
        validFrom: newProgram.validFrom,
        validTo: newProgram.validTo,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    const responseData = {
      id: newProgram.id,
      name: newProgram.name,
      discount: newProgram.discount,
      totalOrdersRequired: newProgram.totalOrdersRequired,
      totalAmountSpent: newProgram.totalAmountSpent,
      description: newProgram.description,
      validFrom: newProgram.validFrom,
      validTo: newProgram.validTo,
    };
    return successResponse(res, "Loyalty program created", responseData, 201);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to create loyalty program", 500);
  }
};

// ========== UPDATE LOYALTY PROGRAM ==========
// ✅ YES - LOG THIS (Program configuration changed)
export const updateLoyaltyProgram = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return failureResponse(res, "Invalid program ID", 400);

  const {
    name,
    discount,
    totalOrdersRequired,
    totalAmountSpent,
    description,
    validFrom,
    validTo,
  } = req.body;

  try {
    const existing = await prisma.loyaltyProgram.findUnique({ where: { id } });
    if (!existing) return failureResponse(res, "Loyalty program not found", 404);

    // Store old values for audit
    const oldValues = {
      name: existing.name,
      discount: existing.discount,
      totalOrdersRequired: existing.totalOrdersRequired,
      totalAmountSpent: existing.totalAmountSpent,
      validFrom: existing.validFrom,
      validTo: existing.validTo,
    };

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (discount !== undefined) {
      if (discount < 0 || discount > 100) return failureResponse(res, "Discount must be between 0 and 100", 400);
      updateData.discount = discount;
    }
    if (totalOrdersRequired !== undefined) updateData.totalOrdersRequired = parseInt(totalOrdersRequired);
    if (totalAmountSpent !== undefined) updateData.totalAmountSpent = parseFloat(totalAmountSpent);
    if (description !== undefined) updateData.description = description;
    if (validFrom !== undefined) updateData.validFrom = new Date(validFrom);
    if (validTo !== undefined) updateData.validTo = new Date(validTo);

    if (discount !== undefined || totalOrdersRequired !== undefined || totalAmountSpent !== undefined) {
      const newDiscount = discount !== undefined ? discount : existing.discount;
      const newOrders = totalOrdersRequired !== undefined ? parseInt(totalOrdersRequired) : existing.totalOrdersRequired;
      const newAmount = totalAmountSpent !== undefined ? parseFloat(totalAmountSpent) : existing.totalAmountSpent;
      const conflict = await prisma.loyaltyProgram.findFirst({
        where: {
          discount: newDiscount,
          totalOrdersRequired: newOrders,
          totalAmountSpent: newAmount,
          id: { not: id },
        },
      });
      if (conflict) {
        return failureResponse(res, "Another program with the same criteria already exists", 400);
      }
    }

    const fromDate = updateData.validFrom || existing.validFrom;
    const toDate = updateData.validTo || existing.validTo;
    if (fromDate > toDate) {
      return failureResponse(res, "validFrom cannot be later than validTo", 400);
    }

    const updated = await prisma.loyaltyProgram.update({
      where: { id },
      data: updateData,
    });

    // ✅ LOG - Loyalty program updated
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "UPDATE",
      entity: "LOYALTY_PROGRAM",
      entityId: id,
      changes: {
        before: oldValues,
        after: {
          name: updated.name,
          discount: updated.discount,
          totalOrdersRequired: updated.totalOrdersRequired,
          totalAmountSpent: updated.totalAmountSpent,
          validFrom: updated.validFrom,
          validTo: updated.validTo,
        },
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    const responseData = {
      id: updated.id,
      name: updated.name,
      discount: updated.discount,
      totalOrdersRequired: updated.totalOrdersRequired,
      totalAmountSpent: updated.totalAmountSpent,
      description: updated.description,
      validFrom: updated.validFrom,
      validTo: updated.validTo,
    };
    return successResponse(res, "Loyalty program updated", responseData);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to update loyalty program", 500);
  }
};

// ========== DELETE LOYALTY PROGRAM ==========
// ✅ YES - LOG THIS (Program removed)
export const deleteLoyaltyProgram = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return failureResponse(res, "Invalid program ID", 400);

  try {
    const program = await prisma.loyaltyProgram.findUnique({ where: { id } });
    if (!program) return failureResponse(res, "Loyalty program not found", 404);

    // Store program data for audit
    const programData = {
      name: program.name,
      discount: program.discount,
      totalOrdersRequired: program.totalOrdersRequired,
      totalAmountSpent: program.totalAmountSpent,
    };

    await prisma.loyaltyProgram.delete({ where: { id } });

    // ✅ LOG - Loyalty program deleted
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "DELETE",
      entity: "LOYALTY_PROGRAM",
      entityId: id,
      changes: {
        deleted: programData,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return successResponse(res, "Loyalty program deleted successfully");
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to delete loyalty program", 500);
  }
};

// ========== CHECK ELIGIBILITY FOR A CUSTOMER ==========
// ❌ NO LOGGING - Read-only check
export const checkLoyaltyEligibility = async (req: Request, res: Response): Promise<void> => {
  const { customerId } = req.body;
  if (!customerId) return failureResponse(res, "customerId is required", 400);

  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(customerId) },
    });
    if (!customer) return failureResponse(res, "Customer not found", 404);

    const allPrograms = await prisma.loyaltyProgram.findMany();
    const currentDate = new Date();

    const eligiblePrograms: any[] = [];
    const ineligiblePrograms: any[] = [];

    allPrograms.forEach(program => {
      const isAvailable =
        program.validFrom <= currentDate && program.validTo >= currentDate;
      const meetsOrderCriteria = (customer.totalOrders || 0) >= program.totalOrdersRequired;
      const meetsMoneyCriteria = (customer.totalOrderAmount || 0) >= program.totalAmountSpent;
      const isEligible = meetsOrderCriteria && meetsMoneyCriteria && isAvailable;

      const programData = {
        id: program.id,
        name: program.name,
        discount: program.discount,
        totalOrdersRequired: program.totalOrdersRequired,
        totalAmountSpent: program.totalAmountSpent,
        description: program.description,
        validFrom: program.validFrom,
        validTo: program.validTo,
        eligibility: {
          meetsOrderCriteria,
          meetsMoneyCriteria,
          isAvailable,
          isEligible,
        },
      };

      if (isEligible) eligiblePrograms.push(programData);
      else ineligiblePrograms.push(programData);
    });

    const result = {
      customerId: customer.id,
      totalOrders: customer.totalOrders,
      totalOrderAmount: customer.totalOrderAmount,
      eligiblePrograms,
      ineligiblePrograms,
    };

    return successResponse(res, "Loyalty eligibility checked", result);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to check eligibility", 500);
  }
};