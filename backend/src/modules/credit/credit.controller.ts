import { Request, Response } from "express";
import { successResponse, failureResponse } from "../../helpers/responseHelpers";
import { AuditService } from "../../services/audit.service"; // ✅ ADD THIS
import prisma from "../../config/database";

// GET /credits/orders?page&limit - ❌ NO LOGGING (Read-only)
export const creditOrderList = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    const orders = await prisma.order.findMany({
      where: { status: "credit" },
      select: {
        id: true,
        total_amount: true,
        payment_mode: true,
        status: true,
        guests: true,
        createdAt: true,
        table: { select: { name: true, id: true } },
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const totalOrders = await prisma.order.count({ where: { status: "credit" } });
    const totalPages = Math.ceil(totalOrders / limit);

    const paginatedOrders = orders.map((order) => ({
      id: order.id,
      table: order.table ? { name: order.table.name, id: order.table.id } : null,
      totalAmount: order.total_amount,
      paymentMode: order.payment_mode,
      status: order.status,
      guests: order.guests,
    }));

    const meta = { page, limit, totalOrders, totalPages };
    return successResponse(res, "Credit order list retrieved successfully", paginatedOrders, meta);
  } catch (error) {
    console.error("Error fetching credit orders:", error);
    return failureResponse(res, "Failed to fetch credit orders", 500);
  }
};

// GET /credits/customers?page&limit - ❌ NO LOGGING (Read-only)
export const getCustomersWithCredit = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  try {
    const customers = await prisma.customer.findMany({
      where: { availableCredit: { gt: 0 } },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    const totalCustomers = await prisma.customer.count({
      where: { availableCredit: { gt: 0 } },
    });
    const totalPages = Math.ceil(totalCustomers / limit);

    const paginatedCustomers = customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      availableCredit: customer.availableCredit,
      currentCredit: customer.currentCredit,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
    }));

    const meta = { page, limit, totalCustomers, totalPages };
    return successResponse(res, "Customers with existing credit fetched successfully", paginatedCustomers, meta);
  } catch (error) {
    console.error("Error fetching customers with credit:", error);
    return failureResponse(res, "Failed to fetch customers with credit", 500);
  }
};

// PATCH /credits/customers/:id - ✅ YES, LOG THIS (Financial change)
export const setOrUpdateCreditBalance = async (req: Request, res: Response): Promise<void> => {
  const customerId = parseInt(req.params.id);
  if (isNaN(customerId)) return failureResponse(res, "Invalid customer ID", 400);

  const { availableCredit } = req.body;
  const parsedAvailableCredit = parseFloat(availableCredit);
  if (isNaN(parsedAvailableCredit) || parsedAvailableCredit < 0) {
    return failureResponse(res, "availableCredit must be a number >= 0", 400);
  }

  try {
    // Get old data before update
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return failureResponse(res, "Customer not found", 404);

    const oldAvailableCredit = customer.availableCredit || 0;

    const updated = await prisma.customer.update({
      where: { id: customerId },
      data: { availableCredit: parsedAvailableCredit },
    });

    // ✅ LOG - Credit limit update (financial change)
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "UPDATE",
      entity: "CUSTOMER_CREDIT",
      entityId: customerId,
      changes: {
        customerName: customer.name,
        customerPhone: customer.phone,
        oldCreditLimit: oldAvailableCredit,
        newCreditLimit: parsedAvailableCredit,
        difference: parsedAvailableCredit - oldAvailableCredit,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return successResponse(res, "Credit limit updated successfully", {
      customerId: updated.id,
      availableCredit: updated.availableCredit,
    });
  } catch (error) {
    console.error("Error updating credit limit:", error);
    return failureResponse(res, "Failed to update credit limit", 500);
  }
};