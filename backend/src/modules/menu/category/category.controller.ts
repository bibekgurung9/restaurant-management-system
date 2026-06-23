import { Request, Response } from "express";
import mimeTypes from "mime-types";
import prisma from "../../../config/database";
import {
  successResponse,
  failureResponse,
} from "../../../helpers/responseHelpers";
import { AuditService } from "../../../services/audit.service";

// ❌ NO LOGGING - Read-only
export const categoryList = async (req: Request, res: Response): Promise<void> => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const categoryId = req.query.categoryId as string;

  try {
    if (categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: parseInt(categoryId) },
        select: {
          id: true,
          name: true,
          _count: { select: { items: true } }
        }
      });
      if (!category) return failureResponse(res, "Category not found", 404);
      const resCategory = {
        id: category.id,
        name: category.name,
        itemCount: category._count.items,
      };
      return successResponse(res, "Success", resCategory);
    }

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        _count: { select: { items: true } }
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalCategories = await prisma.category.count();
    const totalPages = Math.ceil(totalCategories / limit);

    const paginatedCategories = await Promise.all(
      categories.map(async (cat) => ({
        id: cat.id,
        name: cat.name,
        itemCount: cat._count.items,
      }))
    );

    const meta = { page, limit, totalCategories, totalPages };
    return successResponse(res, "Category list retrieved successfully", paginatedCategories, meta);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Server error", 500);
  }
};

// ❌ NO LOGGING - Read-only
export const searchCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const keyword = req.query.keyword as string;
    if (!keyword) return failureResponse(res, "Keyword not provided", 400);
    const categories = await prisma.category.findMany({
      where: { name: { contains: keyword } },
      select: { id: true, name: true },
    });
    return successResponse(res, "Categories found successfully", categories);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Server error", 500);
  }
};

// ✅ YES - LOG THIS (New category created)
export const addCategory = async (req: Request, res: Response): Promise<void> => {
  const { name, hide } = req.body;
  const isHidden = hide === "true" || hide === true;

  try {
    const existing = await prisma.category.findFirst({ where: { name } });
    if (existing) return failureResponse(res, "Category with this name already exists", 400);

    const category = await prisma.category.create({
      data: { name },
    });

    // ✅ LOG - Category created
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "CREATE",
      entity: "CATEGORY",
      entityId: category.id,
      changes: {
        name: category.name,
        hide: isHidden,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    const resCategory = {
      id: category.id,
      name: category.name,
      itemCount: 0,
    };
    
    return successResponse(res, "Category added successfully", resCategory);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to add category", 500);
  }
};

// ✅ YES - LOG THIS (Category updated)
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const categoryId = parseInt(req.params.id);
  const { name, hide } = req.body;
  const isHidden = hide !== undefined ? (hide === "true" || hide === true) : undefined;

  if (isNaN(categoryId)) return failureResponse(res, "Invalid category ID", 400);

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return failureResponse(res, "Category not found", 404);

  // Store old values for audit
  const oldValues = {
    name: category.name,
  };

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (isHidden !== undefined) updateData.hide = isHidden;

  if (name !== undefined) {
    const existing = await prisma.category.findFirst({
      where: { name, id: { not: categoryId } },
    });
    if (existing) return failureResponse(res, "Category with this name already exists", 400);
  }

  const updated = await prisma.category.update({
    where: { id: categoryId },
    data: updateData,
    select: {
      id: true,
      name: true,
      _count: { select: { items: true } }
    }
  });

  // ✅ LOG - Category updated
  await AuditService.log({
    userId: req.admin.id,
    userEmail: req.admin.email,
    userRole: req.admin.role,
    action: "UPDATE",
    entity: "CATEGORY",
    entityId: categoryId,
    changes: {
      before: oldValues,
      after: {
        name: updated.name,
      },
    },
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  const resCategory = {
    id: updated.id,
    name: updated.name,
    itemCount: updated._count.items,
  };
  return successResponse(res, "Category updated successfully", resCategory);
};

// ✅ YES - LOG THIS (Category deleted)
export const destroyCategory = async (req: Request, res: Response) => {
  const categoryId = parseInt(req.params.id);
  if (isNaN(categoryId)) return failureResponse(res, "Invalid category ID", 400);

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return failureResponse(res, "Category not found", 404);

  // Store category data for audit
  const categoryData = {
    name: category.name,
    itemCount: await prisma.item.count({ where: { categoryId } }),
  };

  await prisma.category.delete({ where: { id: categoryId } });

  // ✅ LOG - Category deleted
  await AuditService.log({
    userId: req.admin.id,
    userEmail: req.admin.email,
    userRole: req.admin.role,
    action: "DELETE",
    entity: "CATEGORY",
    entityId: categoryId,
    changes: {
      deleted: categoryData,
    },
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  return successResponse(res, "Category deleted successfully");
};