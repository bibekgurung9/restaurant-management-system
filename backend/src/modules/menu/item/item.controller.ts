import { Request, Response } from "express";
import mimeTypes from "mime-types";
import prisma from "../../../config/database";
import { failureResponse, successResponse } from "../../../helpers/responseHelpers";
import { getImageUrl, uploadImage, deleteImage } from "../../../services/image.service";
import { AuditService } from "../../../services/audit.service";

const validImageTypes = ["jpeg", "png", "webp"];

const formatItem = async (item: any) => {
  let inventory = null;
  let available = true;

  if (item.isLimited) {
    if (item.inventory) {
      inventory = {
        quantity: item.inventory.quantity,
        threshold: item.inventory.threshold,
      };
      available = item.inventory.quantity > 0;
    } else {
      available = false;
    }
  }

  return {
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image ? getImageUrl(item.image) : "",
    categoryId: item.categoryId,
    categoryName: item.category?.name,
    status: item.status,
    isLimited: item.isLimited,
    unit: item.unit || null,
    inventory,
    available,
  };
};

// ❌ NO LOGGING - Read-only
export const itemList = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const itemId = req.query.itemId as string;
  const categoryId = req.query.categoryId as string;

  try {
    if (itemId) {
      const item = await prisma.item.findUnique({
        where: { id: parseInt(itemId), hide: false },
        include: {
          category: { select: { name: true } },
          inventory: true,
        },
      });
      if (!item) return failureResponse(res, "Item not found", 404);
      const formatted = await formatItem(item);
      return successResponse(res, "Success", formatted);
    }

    const whereClause: any = { hide: false };
    if (categoryId) whereClause.categoryId = parseInt(categoryId);

    const items = await prisma.item.findMany({
      where: whereClause,
      include: {
        category: { select: { name: true } },
        inventory: true,
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalItems = await prisma.item.count({ where: whereClause });
    const totalPages = Math.ceil(totalItems / limit);
    const formattedItems = await Promise.all(items.map(formatItem));

    const meta = { page, limit, totalItems, totalPages };
    return successResponse(res, "Item list retrieved", formattedItems, meta);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Server error", 500);
  }
};

// ❌ NO LOGGING - Read-only
export const searchItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const keyword = req.query.keyword as string;
    if (!keyword) return failureResponse(res, "Keyword required", 400);
    const items = await prisma.item.findMany({
      where: {
        hide: false,
        name: { contains: keyword },
      },
      select: { id: true, name: true, price: true, isLimited: true },
    });
    return successResponse(res, "Search results", items);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Server error", 500);
  }
};

// ✅ YES - LOG THIS (New item created)
export const addItem = async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    price,
    categoryId,
    isLimited,
    quantity,
    threshold,
    unit,
  } = req.body;

  console.log("REQ", req.body);

  if (!name || !price || !categoryId) {
    return failureResponse(res, "Name, price and categoryId are required", 400);
  }

  const isLimitedBool = isLimited === "true" || isLimited === true;
  if (isLimitedBool && (quantity === undefined || quantity === null)) {
    return failureResponse(res, "Quantity is required when isLimited is true", 400);
  }

  try {
    let imageURL = "";
    if (req.file) {
      const ext = mimeTypes.extension(req.file.mimetype);
      const isValid = ext && validImageTypes.includes(ext);
      if (!isValid) return failureResponse(res, "Invalid image file", 400);
      const result = await uploadImage(req.file.buffer, "items");
      imageURL = result.public_id;
    }

    const item = await prisma.item.create({
      data: {
        name,
        price: parseFloat(price),
        categoryId: parseInt(categoryId),
        image: imageURL,
        isLimited: isLimitedBool,
        unit: unit || null,
      },
    });

    if (isLimitedBool) {
      await prisma.inventory.create({
        data: {
          itemId: item.id,
          quantity: parseInt(quantity) || 0,
          threshold: threshold ? parseInt(threshold) : 10,
        },
      });
    }

    // ✅ LOG - Item created
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "CREATE",
      entity: "ITEM",
      entityId: item.id,
      changes: {
        name: item.name,
        price: item.price,
        categoryId: item.categoryId,
        isLimited: item.isLimited,
        unit: item.unit,
        initialQuantity: isLimitedBool ? parseInt(quantity) || 0 : null,
        threshold: isLimitedBool ? (threshold ? parseInt(threshold) : 10) : null,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    const created = await prisma.item.findUnique({
      where: { id: item.id },
      include: { inventory: true },
    });
    const formatted = await formatItem(created!);
    return successResponse(res, "Item added", formatted, 201);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to add item", 500);
  }
};

// ✅ YES - LOG THIS (Item updated)
export const updateItem = async (req: Request, res: Response): Promise<void> => {
  const itemId = parseInt(req.params.id);
  if (isNaN(itemId)) return failureResponse(res, "Invalid item ID", 400);

  const {
    name,
    price,
    categoryId,
    status,
    isLimited,
    quantity,
    threshold,
    unit,
  } = req.body;

  const existing = await prisma.item.findUnique({
    where: { id: itemId },
    include: { inventory: true },
  });
  if (!existing) return failureResponse(res, "Item not found", 404);

  // Store old values for audit
  const oldValues = {
    name: existing.name,
    price: existing.price,
    categoryId: existing.categoryId,
    isLimited: existing.isLimited,
    unit: existing.unit,
    quantity: existing.inventory?.quantity || null,
    threshold: existing.inventory?.threshold || null,
  };

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (price !== undefined) updateData.price = parseFloat(price);
  if (categoryId !== undefined) updateData.categoryId = parseInt(categoryId);
  if (status !== undefined) updateData.status = status;
  if (unit !== undefined) updateData.unit = unit || null;

  let newIsLimited = existing.isLimited;
  if (isLimited !== undefined) {
    newIsLimited = isLimited === "true" || isLimited === true;
    updateData.isLimited = newIsLimited;
  }

  let imageURL = existing.image;
  if (req.file) {
    const ext = mimeTypes.extension(req.file.mimetype);
    const isValid = ext && validImageTypes.includes(ext);
    if (!isValid) return failureResponse(res, "Invalid image file", 400);
    const result = await uploadImage(req.file.buffer, "items");
    imageURL = result.public_id;
    if (existing.image) await deleteImage(existing.image);
    updateData.image = imageURL;
  }

  const updatedItem = await prisma.item.update({
    where: { id: itemId },
    data: updateData,
  });

  if (newIsLimited) {
    const inventory = existing.inventory;
    const quantityVal = quantity !== undefined ? parseInt(quantity) : undefined;
    const thresholdVal = threshold !== undefined ? parseInt(threshold) : undefined;

    if (inventory) {
      const invUpdate: any = {};
      if (quantityVal !== undefined) invUpdate.quantity = quantityVal;
      if (thresholdVal !== undefined) invUpdate.threshold = thresholdVal;
      if (Object.keys(invUpdate).length > 0) {
        await prisma.inventory.update({
          where: { itemId },
          data: invUpdate,
        });
      }
    } else {
      if (quantityVal === undefined) {
        return failureResponse(res, "Quantity is required when enabling isLimited without existing inventory", 400);
      }
      await prisma.inventory.create({
        data: {
          itemId,
          quantity: quantityVal || 0,
          threshold: thresholdVal !== undefined ? thresholdVal : 10,
        },
      });
    }
  } else {
    if (existing.inventory) {
      await prisma.inventory.delete({ where: { itemId } });
    }
  }

  // Fetch final item with inventory for audit after
  const finalItem = await prisma.item.findUnique({
    where: { id: itemId },
    include: { inventory: true },
  });

  // ✅ LOG - Item updated
  await AuditService.log({
    userId: req.admin.id,
    userEmail: req.admin.email,
    userRole: req.admin.role,
    action: "UPDATE",
    entity: "ITEM",
    entityId: itemId,
    changes: {
      before: oldValues,
      after: {
        name: finalItem!.name,
        price: finalItem!.price,
        categoryId: finalItem!.categoryId,
        isLimited: finalItem!.isLimited,
        unit: finalItem!.unit,
        quantity: finalItem!.inventory?.quantity || null,
        threshold: finalItem!.inventory?.threshold || null,
      },
    },
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  const formatted = await formatItem(finalItem!);
  return successResponse(res, "Item updated", formatted);
};

// ✅ YES - LOG THIS (Item deleted)
export const deleteItem = async (req: Request, res: Response) => {
  const itemId = parseInt(req.params.id);
  if (isNaN(itemId)) return failureResponse(res, "Invalid item ID", 400);

  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: { inventory: true },
  });
  if (!item) return failureResponse(res, "Item not found", 404);

  // Store item data for audit
  const itemData = {
    name: item.name,
    price: item.price,
    categoryId: item.categoryId,
    isLimited: item.isLimited,
    unit: item.unit,
    quantity: item.inventory?.quantity || null,
  };

  if (item.image) await deleteImage(item.image);
  await prisma.item.delete({ where: { id: itemId } });

  // ✅ LOG - Item deleted
  await AuditService.log({
    userId: req.admin.id,
    userEmail: req.admin.email,
    userRole: req.admin.role,
    action: "DELETE",
    entity: "ITEM",
    entityId: itemId,
    changes: {
      deleted: itemData,
    },
    ipAddress: req.ip,
    userAgent: req.get("user-agent"),
  });

  return successResponse(res, "Item deleted successfully");
};

// ❌ NO LOGGING - Read-only (already exists in inventory module)
export const getLowStockItems = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    const lowStockInventories = await prisma.inventory.findMany({
      where: {
        quantity: { lt: prisma.inventory.fields.threshold },
        item: { isLimited: true },
      },
      include: {
        item: {
          select: {
            id: true,
            name: true,
            price: true,
            unit: true,
            image: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { itemId: 'asc' },
    });

    const totalLowStock = await prisma.inventory.count({
      where: {
        quantity: { lt: prisma.inventory.fields.threshold },
        item: { isLimited: true },
      },
    });

    if (lowStockInventories.length === 0) {
      return successResponse(res, "No low stock items found.", [], {
        page,
        limit,
        lowStocks: 0,
        totalPages: 0,
      });
    }

    const formattedItems = lowStockInventories.map((inv) => {
      let status: string;
      if (inv.quantity === 0) status = "none";
      else status = "low";

      return {
        id: inv.item.id,
        name: inv.item.name,
        price: inv.item.price,
        unit: inv.item.unit,
        image: inv.item.image ? getImageUrl(inv.item.image) : "",
        inventory: {
          quantity: inv.quantity,
          threshold: inv.threshold,
        },
        status,
      };
    });

    const totalPages = Math.ceil(totalLowStock / limit);
    const meta = {
      page,
      limit,
      lowStocks: formattedItems.length,
      totalPages,
    };

    return successResponse(res, "Low stock items retrieved successfully", formattedItems, meta);
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    return failureResponse(res, "Failed to fetch low stock items", 500);
  }
};