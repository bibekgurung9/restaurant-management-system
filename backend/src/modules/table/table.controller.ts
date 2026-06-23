import { Request, Response } from "express";
import { successResponse, failureResponse } from "../../helpers/responseHelpers";
import { AuditService } from "../../services/audit.service";
import prisma from "../../config/database";

// ❌ NO LOGGING - Read-only
export const tableList = async (req: Request, res: Response): Promise<void> => {
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const status = req.query.status as string;

  try {
    const tableId: string | undefined = req.query.tableId as string;

    if (tableId) {
      const table = await prisma.table.findFirst({
        where: { id: parseInt(tableId), hide: false },
      });

      if (!table) {
        return failureResponse(res, "Table not found", 404);
      }

      const resTable = {
        id: table.id,
        name: table.name,
        code: table.code,
        capacity: table.capacity,
        status: table.status,
      };
      return successResponse(res, "Table found successfully", resTable);
    }

    const whereClause: any = { hide: false };
    if (status) {
      whereClause.status = status;
    }

    const tables = await prisma.table.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        capacity: true,
        code: true,
        status: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalTables = await prisma.table.count({
      where: whereClause,
    });
    const totalPages = Math.ceil(totalTables / limit);

    const paginatedTables = tables.map((table) => {
      return {
        id: table.id,
        name: table.name,
        code: table.code,
        capacity: table.capacity,
        status: table.status,
      };
    });

    const meta = {
      page: page,
      limit: limit,
      totalTables: totalTables,
      totalPages: totalPages,
    };

    return successResponse(
      res,
      "Table list retrieved successfully",
      paginatedTables,
      meta
    );
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Server error", 500);
  }
};

// ✅ YES - LOG THIS (New table created)
export const addTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, code, status, hide, capacity } = req.body;
    const parsedCapacity = capacity ? parseInt(capacity) : 0;
    const isHidden = hide === "true" || hide === true;

    if (!name || !code || !capacity) {
      return failureResponse(res, "Please enter valid data", 400);
    }

    const existingTable = await prisma.table.findFirst({
      where: {
        OR: [{ name }, { code }],
      },
    });

    if (existingTable) {
      return failureResponse(res, "Table name or code already exists", 409);
    }

    const table = await prisma.table.create({
      data: {
        name,
        code,
        status: status || "available",
        hide: isHidden,
        capacity: parsedCapacity || 0,
      },
    });

    // ✅ LOG - Table created
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "CREATE",
      entity: "TABLE",
      entityId: table.id,
      changes: {
        name: table.name,
        code: table.code,
        capacity: table.capacity,
        status: table.status,
        hide: table.hide,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    const resTable = {
      id: table.id,
      name: table.name,
      code: table.code,
      capacity: table.capacity,
      status: table.status,
    };

    return successResponse(res, "Table added successfully", resTable, 201);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Server error", 500);
  }
};

// ✅ YES - LOG THIS (Table updated)
export const updateTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const tableId = parseInt(req.params.id);
    const { name, code, status, hide, capacity } = req.body;

    if (!tableId) {
      return failureResponse(res, "TableId not found", 404);
    }

    const table = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      return failureResponse(res, "Table not found", 404);
    }

    // Store old values for audit
    const oldValues = {
      name: table.name,
      code: table.code,
      status: table.status,
      hide: table.hide,
      capacity: table.capacity,
    };

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (status !== undefined) updateData.status = status;
    if (hide !== undefined) updateData.hide = hide === "true" || hide === true;
    if (capacity !== undefined) updateData.capacity = parseInt(String(capacity)) || 0;

    if ((name !== undefined || code !== undefined) && updateData.name && updateData.code) {
      const existingTable = await prisma.table.findFirst({
        where: {
          OR: [
            ...(name !== undefined ? [{ name: updateData.name }] : []),
            ...(code !== undefined ? [{ code: updateData.code }] : []),
          ],
          id: { not: tableId },
        },
      });
      if (existingTable) {
        return failureResponse(res, "Table name or code already exists", 409);
      }
    } else if (name !== undefined) {
      const existingTable = await prisma.table.findFirst({
        where: { name: updateData.name, id: { not: tableId } },
      });
      if (existingTable) {
        return failureResponse(res, "Table name already exists", 409);
      }
    } else if (code !== undefined) {
      const existingTable = await prisma.table.findFirst({
        where: { code: updateData.code, id: { not: tableId } },
      });
      if (existingTable) {
        return failureResponse(res, "Table code already exists", 409);
      }
    }

    const updated = await prisma.table.update({
      where: { id: table.id },
      data: updateData,
    });

    // ✅ LOG - Table updated
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "UPDATE",
      entity: "TABLE",
      entityId: tableId,
      changes: {
        before: oldValues,
        after: {
          name: updated.name,
          code: updated.code,
          status: updated.status,
          hide: updated.hide,
          capacity: updated.capacity,
        },
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    const resTable = {
      id: updated.id,
      name: updated.name,
      code: updated.code,
      capacity: updated.capacity,
      status: updated.status,
    };

    return successResponse(res, "Table updated successfully", resTable);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to update table", 500);
  }
};

// ✅ YES - LOG THIS (Table deleted - with ongoing order check)
export const destroyTable = async (req: Request, res: Response) => {
  try {
    const tableId = parseInt(req.params.id);

    const table = await prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!table) {
      return failureResponse(res, "Table not found", 404);
    }

    const ongoingOrder = await prisma.order.findFirst({
      where: {
        tableId: tableId,
        status: {
          notIn: ["completed", "cancelled"],
        },
      },
    });

    if (ongoingOrder) {
      return failureResponse(
        res,
        "Cannot delete table because it has an ongoing order. Please complete or cancel the order first.",
        409
      );
    }

    // Store table data for audit
    const tableData = {
      name: table.name,
      code: table.code,
      capacity: table.capacity,
      status: table.status,
      hide: table.hide,
    };

    await prisma.table.delete({
      where: { id: table.id },
    });

    // ✅ LOG - Table deleted
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "DELETE",
      entity: "TABLE",
      entityId: tableId,
      changes: {
        deleted: tableData,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return successResponse(res, "Table deleted successfully");
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Server error", 500);
  }
};

// ❌ NO LOGGING - Read-only
export const searchTable = async (req: Request, res: Response): Promise<void> => {
  try {
    const keyword: string | undefined = req.query.keyword as string;

    if (!keyword) {
      return failureResponse(res, "Keyword not provided", 400);
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const tables = await prisma.table.findMany({
      where: {
        OR: [
          { name: { contains: keyword } },
          { code: { contains: keyword } },
          { status: { contains: keyword } },
        ],
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
      skip,
      take: limit,
    });

    const count = await prisma.table.count({
      where: {
        OR: [
          { name: { contains: keyword } },
          { code: { contains: keyword } },
          { status: { contains: keyword } },
        ],
      },
    });

    const response = {
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
      data: tables,
    };

    return successResponse(res, "Tables found successfully", response);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Server error", 500);
  }
};