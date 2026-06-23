import { Request, Response } from "express";
import prisma from "../../config/database";
import { failureResponse, successResponse } from "../../helpers/responseHelpers";
import { AuditService } from "../../services/audit.service"; // ✅ ADD THIS

// GET /customers?page&limit   OR   ?id=123 - ❌ NO LOGGING (Read-only)
export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const customerId = req.query.id as string | undefined;

  try {
    // ---- Single customer (full details + orders + payment summary) ----
    if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: parseInt(customerId) },
        include: {
          orders: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              total_amount: true,
              status: true,
              createdAt: true,
            },
          },
          payments: {
            orderBy: { createdAt: "desc" },
            select: {
              id: true,
              paidAmount: true,
              paymentMethod: true,
              paymentStatus: true,
              paymentDate: true,
              discountAmount: true,
              vatAmount: true,
              serviceChargeAmount: true,
              tipAmount: true,
            },
          },
        },
      });

      if (!customer) return failureResponse(res, "Customer not found", 404);

      // Calculate lifetime spend (from orders)
      const totalLifetimeSpend = customer.orders.reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );

      const fullCustomer = {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        availableCredit: customer.availableCredit,
        currentCredit: customer.currentCredit,
        totalOrders: customer.totalOrders || customer.orders.length,
        totalOrderAmount: customer.totalOrderAmount || totalLifetimeSpend,
        totalLifetimeSpend,
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        orderHistory: customer.orders.map(order => ({
          orderId: order.id,
          totalAmount: order.total_amount,
          status: order.status,
          date: order.createdAt,
        })),
        paymentHistory: customer.payments.map(payment => ({
          paymentId: payment.id,
          amount: payment.paidAmount,
          method: payment.paymentMethod,
          status: payment.paymentStatus,
          date: payment.paymentDate,
          discount: payment.discountAmount,
          vat: payment.vatAmount,
          serviceCharge: payment.serviceChargeAmount,
          tip: payment.tipAmount,
        })),
      };

      return successResponse(res, "Customer fetched successfully", fullCustomer);
    }

    // ---- Paginated list (no histories) ----
    const customers = await prisma.customer.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        availableCredit: true,
        currentCredit: true,
        totalOrders: true,
        totalOrderAmount: true,
        createdAt: true,
        updatedAt: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCustomers = await prisma.customer.count();
    const totalPages = Math.ceil(totalCustomers / limit);
    const meta = { page, limit, totalCustomers, totalPages };
    return successResponse(res, "Customer list retrieved", customers, meta);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to fetch customers", 500);
  }
};

// GET /customers/search?phone - ❌ NO LOGGING (Read-only)
export const getCustomerByPhone = async (req: Request, res: Response): Promise<void> => {
  const phone = req.query.phone as string;
  if (!phone) return failureResponse(res, "Phone number required", 400);

  try {
    const customer = await prisma.customer.findFirst({
      where: { phone },
      select: { id: true, name: true, phone: true, email: true },
    });
    if (!customer) return failureResponse(res, "Customer not found", 404);
    return successResponse(res, "Customer found", customer);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to fetch customer", 500);
  }
};

// POST /customers - ✅ YES, LOG THIS (New customer created)
export const createCustomer = async (req: Request, res: Response): Promise<void> => {
  const { name, phone, email } = req.body;
  if (!name || !phone) return failureResponse(res, "Name and phone required", 400);

  try {
    const existing = await prisma.customer.findFirst({ where: { phone } });
    if (existing) return failureResponse(res, "Phone already exists", 400);
    if (email) {
      const existingEmail = await prisma.customer.findFirst({ where: { email } });
      if (existingEmail) return failureResponse(res, "Email already exists", 400);
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name,
        phone,
        email: email || null,
        availableCredit: 10000,
        currentCredit: 0,
      },
    });

    // ✅ LOG - Customer created
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "CREATE",
      entity: "CUSTOMER",
      entityId: newCustomer.id,
      changes: {
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        availableCredit: newCustomer.availableCredit,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return successResponse(res, "Customer created", newCustomer, 201);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to create customer", 500);
  }
};

// PATCH /customers/:id - ✅ YES, LOG THIS (Customer data changed)
export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return failureResponse(res, "Invalid customer ID", 400);

  const { name, phone, email, availableCredit } = req.body;
  if (!name && !phone && email === undefined && availableCredit === undefined) {
    return failureResponse(res, "At least one field required", 400);
  }

  try {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return failureResponse(res, "Customer not found", 404);

    // Store old values for audit
    const oldValues = {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      availableCredit: customer.availableCredit,
    };

    const updateData: any = {};
    if (name) updateData.name = name;
    if (phone) {
      const existing = await prisma.customer.findFirst({ where: { phone, id: { not: id } } });
      if (existing) return failureResponse(res, "Phone already in use", 400);
      updateData.phone = phone;
    }
    if (email !== undefined) {
      if (email) {
        const existing = await prisma.customer.findFirst({ where: { email, id: { not: id } } });
        if (existing) return failureResponse(res, "Email already in use", 400);
      }
      updateData.email = email || null;
    }
    if (availableCredit !== undefined) {
      const credit = parseFloat(availableCredit);
      if (isNaN(credit) || credit <= (customer.currentCredit || 0)) {
        return failureResponse(res, "Credit limit must be > current credit", 400);
      }
      updateData.availableCredit = credit;
    }

    const updated = await prisma.customer.update({ where: { id }, data: updateData });

    // ✅ LOG - Customer updated
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "UPDATE",
      entity: "CUSTOMER",
      entityId: id,
      changes: {
        before: oldValues,
        after: {
          name: updated.name,
          phone: updated.phone,
          email: updated.email,
          availableCredit: updated.availableCredit,
        },
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return successResponse(res, "Customer updated", updated);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to update customer", 500);
  }
};

// DELETE /customers/:id - ✅ YES, LOG THIS (Customer removed)
export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) return failureResponse(res, "Invalid customer ID", 400);

  try {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) return failureResponse(res, "Customer not found", 404);

    // Store customer data before deletion for audit
    const customerData = {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      availableCredit: customer.availableCredit,
      currentCredit: customer.currentCredit,
      totalOrders: customer.totalOrders,
      totalOrderAmount: customer.totalOrderAmount,
    };

    await prisma.customer.delete({ where: { id } });

    // ✅ LOG - Customer deleted
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "DELETE",
      entity: "CUSTOMER",
      entityId: id,
      changes: {
        deleted: customerData,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return successResponse(res, "Customer deleted");
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to delete customer", 500);
  }
};