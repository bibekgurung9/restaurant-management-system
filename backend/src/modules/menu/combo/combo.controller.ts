// combo.controller.ts
import { Request, Response } from "express";
import mimeTypes from "mime-types";
import prisma from "../../../config/database";
import { failureResponse, successResponse } from "../../../helpers/responseHelpers";
import { getImageUrl, uploadImage, deleteImage } from "../../../services/image.service";
import { AuditService } from "../../../services/audit.service";

const validImageTypes = ["jpeg", "png", "webp"];

type FormatComboOptions = {
  includeAvailability?: boolean;
  itemMap?: Map<number, { name: string; image: string; inventory: any }>;
};

const formatCombo = async (combo: any, options: FormatComboOptions = {}) => {
  const { includeAvailability = false, itemMap = new Map() } = options;
  let formattedItems: any[] = [];

  if (combo.items) {
    let parsedItems: any[] = [];
    if (typeof combo.items === "string") {
      try { parsedItems = JSON.parse(combo.items); } catch { parsedItems = []; }
    } else if (Array.isArray(combo.items)) {
      parsedItems = combo.items;
    }

    formattedItems = parsedItems.map((item: any) => {
      const itemInfo = itemMap.get(item.itemId);
      return {
        itemId: item.itemId,
        quantity: item.quantity,
        name: itemInfo?.name || "Unknown item",
        image: itemInfo?.image ? getImageUrl(itemInfo.image) : "",
      };
    });
  }

  let available = combo.status === true;
  if (includeAvailability && available) {
    if (combo.expirable && combo.dateFrom && combo.dateTo) {
      const now = new Date();
      available = now >= combo.dateFrom && now <= combo.dateTo;
    }
    if (available && combo.items && itemMap.size > 0) {
      let parsedItems: any[] = [];
      if (typeof combo.items === "string") {
        try { parsedItems = JSON.parse(combo.items); } catch { parsedItems = []; }
      } else if (Array.isArray(combo.items)) {
        parsedItems = combo.items;
      }
      for (const item of parsedItems) {
        const itemInfo = itemMap.get(item.itemId);
        if (itemInfo?.inventory?.isLimited) {
          const reqQty = item.quantity;
          const stock = itemInfo.inventory.quantity || 0;
          if (stock < reqQty) {
            available = false;
            break;
          }
        }
      }
    }
  }

  const result: any = {
    id: combo.id,
    name: combo.name,
    price: combo.price,
    items: formattedItems,
    image: combo.image ? getImageUrl(combo.image) : "",
    description: combo.description,
    expirable: combo.expirable,
    dateFrom: combo.dateFrom,
    dateTo: combo.dateTo,
    status: combo.status,
  };
  if (includeAvailability) {
    result.available = available;
  }
  return result;
};

// ❌ NO LOGGING - Read-only
export const comboList = async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const comboId = req.query.comboId as string;
  const all = req.query.all === "true";

  try {
    if (comboId) {
      const combo = await prisma.combo.findUnique({
        where: { id: parseInt(comboId) },
      });
      if (!combo) return failureResponse(res, "Combo not found", 404);
      const formatted = await formatCombo(combo, { includeAvailability: true });
      return successResponse(res, "Combo retrieved successfully", formatted);
    }

    const skip = all ? undefined : (page - 1) * limit;
    const take = all ? undefined : limit;

    const combos = await prisma.combo.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take,
    });

    const allProductIds = new Set<number>();
    for (const combo of combos) {
      let items: any[] = [];
      if (typeof combo.items === "string") {
        try { items = JSON.parse(combo.items); } catch { items = []; }
      } else if (Array.isArray(combo.items)) {
        items = combo.items;
      }
      items.forEach((item: any) => {
        if (item.itemId) allProductIds.add(item.itemId);
      });
    }

    let itemMap = new Map<number, any>();
    if (allProductIds.size > 0) {
      const items = await prisma.item.findMany({
        where: { id: { in: Array.from(allProductIds) } },
        include: { inventory: true },
      });
      itemMap = new Map(items.map(p => [p.id, { name: p.name, image: p.image, inventory: p.inventory }]));
    }

    const formattedCombos = await Promise.all(
      combos.map(combo => formatCombo(combo, { includeAvailability: true, itemMap }))
    );

    const totalCombos = all ? combos.length : await prisma.combo.count();
    const totalPages = all ? 1 : Math.ceil(totalCombos / limit);
    const meta = all ? undefined : { page, limit, totalCombos, totalPages };

    return successResponse(res, "Combo list retrieved successfully", formattedCombos, meta);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Failed to fetch combo list", 500);
  }
};

// ❌ NO LOGGING - Read-only
export const searchCombo = async (req: Request, res: Response): Promise<void> => {
  try {
    const keyword = req.query.keyword as string;
    if (!keyword) return failureResponse(res, "Search keyword is required", 400);
    const combos = await prisma.combo.findMany({
      where: { name: { contains: keyword } },
    });
    const results = await Promise.all(combos.map(c => formatCombo(c, { includeAvailability: false })));
    return successResponse(res, "Search successful", results);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Server error", 500);
  }
};

// ✅ YES - LOG THIS (New combo created)
export const addCombo = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, price, items, expirable, dateFrom, dateTo, status, description } = req.body;
    const comboPrice = parseFloat(price);
    const comboStatus = true;
    const isExpirable = expirable === "1" || expirable === 1 || expirable === "true" || expirable === true;

    if (!name || !description || !price || !items || expirable === undefined) {
      return failureResponse(res, "Name, Description, Price, Items, and Expirable fields are required.", 400);
    }
    if (isNaN(comboPrice) || comboPrice <= 0) {
      return failureResponse(res, "Price must be a valid number greater than 0.", 400);
    }

    const existing = await prisma.combo.findFirst({ where: { name } });
    if (existing) return failureResponse(res, "Combo with this name already exists.", 409);

    if (isExpirable) {
      if (!dateFrom || !dateTo) {
        return failureResponse(res, "Date From and Date To are required for expirable combos.", 422);
      }
      if (new Date(dateFrom) > new Date(dateTo)) {
        return failureResponse(res, "Date From cannot be later than Date To.", 422);
      }
    }

    let parsedItems: any[] = [];
    try {
      parsedItems = typeof items === "string" ? JSON.parse(items) : items;
      if (!Array.isArray(parsedItems) || parsedItems.some(i => !i.itemId || !i.quantity)) {
        return failureResponse(res, "Each item must include itemId and quantity.", 400);
      }
    } catch {
      return failureResponse(res, "Invalid items format. Must be a valid JSON array.", 400);
    }

    const itemIds = parsedItems.map(i => i.itemId);
    const existingProducts = await prisma.item.findMany({ where: { id: { in: itemIds } }, select: { id: true } });
    if (existingProducts.length !== itemIds.length) {
      return failureResponse(res, "One or more items do not exist.", 400);
    }

    let imageURL = "";
    if (req.file) {
      const ext = mimeTypes.extension(req.file.mimetype);
      if (!ext || !validImageTypes.includes(ext)) return failureResponse(res, "Invalid image file type.", 400);
      const result = await uploadImage(req.file.buffer, "combos");
      imageURL = result.public_id;
    }

    const combo = await prisma.combo.create({
      data: {
        name,
        price: comboPrice,
        status: comboStatus,
        expirable: isExpirable,
        dateFrom: isExpirable ? new Date(dateFrom) : null,
        dateTo: isExpirable ? new Date(dateTo) : null,
        image: imageURL,
        description,
        items: parsedItems,
      },
    });

    // ✅ LOG - Combo created
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "CREATE",
      entity: "COMBO",
      entityId: combo.id,
      changes: {
        name: combo.name,
        price: combo.price,
        expirable: combo.expirable,
        dateFrom: combo.dateFrom,
        dateTo: combo.dateTo,
        itemCount: parsedItems.length,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    const formatted = await formatCombo(combo, { includeAvailability: true });
    return successResponse(res, "Combo added successfully.", formatted, 201);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "An error occurred while adding the combo.", 500);
  }
};

// ✅ YES - LOG THIS (Combo updated)
export const updateCombo = async (req: Request, res: Response): Promise<void> => {
  try {
    const comboId = parseInt(req.params.id);
    if (isNaN(comboId)) return failureResponse(res, "Invalid combo ID", 400);

    const { name, price, items, expirable, dateFrom, dateTo, status, description } = req.body;

    const existingCombo = await prisma.combo.findUnique({ where: { id: comboId } });
    if (!existingCombo) return failureResponse(res, "Combo not found", 404);

    // Store old values for audit
    const oldValues = {
      name: existingCombo.name,
      price: existingCombo.price,
      expirable: existingCombo.expirable,
      dateFrom: existingCombo.dateFrom,
      dateTo: existingCombo.dateTo,
      status: existingCombo.status,
      description: existingCombo.description,
    };

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (price !== undefined) {
      const p = parseFloat(price);
      if (isNaN(p) || p <= 0) return failureResponse(res, "Price must be > 0", 400);
      updateData.price = p;
    }
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status === "true" || status === true;

    let isExpirable = existingCombo.expirable;
    if (expirable !== undefined) {
      isExpirable = expirable === "1" || expirable === 1 || expirable === "true" || expirable === true;
      updateData.expirable = isExpirable;
    }

    if (isExpirable) {
      let newDateFrom = existingCombo.dateFrom;
      let newDateTo = existingCombo.dateTo;
      if (dateFrom !== undefined) newDateFrom = new Date(dateFrom);
      if (dateTo !== undefined) newDateTo = new Date(dateTo);

      if (!newDateFrom || !newDateTo) {
        return failureResponse(res, "Date From and Date To are required for expirable combos.", 422);
      }
      if (newDateFrom > newDateTo) {
        return failureResponse(res, "Date From cannot be later than Date To.", 422);
      }
      updateData.dateFrom = newDateFrom;
      updateData.dateTo = newDateTo;
    } else {
      updateData.dateFrom = null;
      updateData.dateTo = null;
    }

    if (items !== undefined) {
      try {
        const parsedItems = typeof items === "string" ? JSON.parse(items) : items;
        if (!Array.isArray(parsedItems)) throw new Error();
        for (const item of parsedItems) {
          if (!item.itemId || !item.quantity) throw new Error();
        }
        const itemIds = parsedItems.map(i => i.itemId);
        const existingProducts = await prisma.item.findMany({ where: { id: { in: itemIds } }, select: { id: true } });
        if (existingProducts.length !== itemIds.length) {
          return failureResponse(res, "One or more items do not exist.", 400);
        }
        updateData.items = parsedItems;
      } catch {
        return failureResponse(res, "Invalid items format. Must be a JSON array of { itemId, quantity }", 400);
      }
    }

    let imageURL = existingCombo.image;
    if (req.file) {
      const ext = mimeTypes.extension(req.file.mimetype);
      if (!ext || !validImageTypes.includes(ext)) return failureResponse(res, "Invalid image file type.", 400);
      const result = await uploadImage(req.file.buffer, "combos");
      imageURL = result.public_id;
      if (existingCombo.image) await deleteImage(existingCombo.image);
      updateData.image = imageURL;
    }

    const updated = await prisma.combo.update({
      where: { id: comboId },
      data: updateData,
    });

    // ✅ LOG - Combo updated
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "UPDATE",
      entity: "COMBO",
      entityId: comboId,
      changes: {
        before: oldValues,
        after: {
          name: updated.name,
          price: updated.price,
          expirable: updated.expirable,
          dateFrom: updated.dateFrom,
          dateTo: updated.dateTo,
          status: updated.status,
          description: updated.description,
        },
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    const formatted = await formatCombo(updated, { includeAvailability: true });
    return successResponse(res, "Combo updated successfully.", formatted);
  } catch (error) {
    console.error(error);
    return failureResponse(res, "An error occurred while updating the combo.", 500);
  }
};

// ✅ YES - LOG THIS (Combo deleted)
export const destroyCombo = async (req: Request, res: Response) => {
  try {
    const comboId = parseInt(req.params.id);
    if (isNaN(comboId)) return failureResponse(res, "Invalid combo ID", 400);
    const combo = await prisma.combo.findUnique({ where: { id: comboId } });
    if (!combo) return failureResponse(res, "Combo not found", 404);

    // Store combo data for audit
    const comboData = {
      name: combo.name,
      price: combo.price,
      expirable: combo.expirable,
      dateFrom: combo.dateFrom,
      dateTo: combo.dateTo,
    };

    if (combo.image) await deleteImage(combo.image);
    await prisma.combo.delete({ where: { id: comboId } });

    // ✅ LOG - Combo deleted
    await AuditService.log({
      userId: req.admin.id,
      userEmail: req.admin.email,
      userRole: req.admin.role,
      action: "DELETE",
      entity: "COMBO",
      entityId: comboId,
      changes: {
        deleted: comboData,
      },
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    return successResponse(res, "Combo deleted successfully");
  } catch (error) {
    console.error(error);
    return failureResponse(res, "Server error", 500);
  }
};