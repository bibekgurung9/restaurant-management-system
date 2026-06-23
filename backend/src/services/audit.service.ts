import prisma from "../config/database";

interface AuditLogData {
  userId: number;
  userEmail: string;
  userRole: string;
  action: string;
  entity: string;
  entityId?: number | null;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}

export class AuditService {
  /**
   * Create an audit log entry
   */
  static async log(data: AuditLogData) {
    try {
      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          userEmail: data.userEmail,
          userRole: data.userRole,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId || null,
          changes: data.changes || null,
          ipAddress: data.ipAddress || null,
          userAgent: data.userAgent || null,
        },
      });
    } catch (error) {
      console.error("Failed to create audit log:", error);
      // Don't throw - logging should never break the main flow
    }
  }

  /**
   * Log CRUD operation with before/after comparison
   */
  static async logCRUD(
    userId: number,
    userEmail: string,
    userRole: string,
    action: "CREATE" | "UPDATE" | "DELETE",
    entity: string,
    entityId: number,
    beforeData?: any,
    afterData?: any,
    ipAddress?: string,
    userAgent?: string
  ) {
    let changes: any = {};

    if (action === "CREATE") {
      changes = { created: afterData };
    } else if (action === "DELETE") {
      changes = { deleted: beforeData };
    } else if (action === "UPDATE") {
      changes = {
        before: beforeData,
        after: afterData,
      };
    }

    await this.log({
      userId,
      userEmail,
      userRole,
      action,
      entity,
      entityId,
      changes,
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log login attempt
   */
  static async logLogin(
    userId: number,
    userEmail: string,
    userRole: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId,
      userEmail,
      userRole,
      action: success ? "LOGIN" : "LOGIN_FAILED",
      entity: "AUTH",
      changes: success ? undefined : { reason: "Invalid credentials" },
      ipAddress,
      userAgent,
    });
  }

  /**
   * Log logout
   */
  static async logLogout(
    userId: number,
    userEmail: string,
    userRole: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    await this.log({
      userId,
      userEmail,
      userRole,
      action: "LOGOUT",
      entity: "AUTH",
      ipAddress,
      userAgent,
    });
  }

  /**
   * Get audit logs with filters
   */
  static async getLogs({
    page = 1,
    limit = 50,
    userId,
    action,
    entity,
    startDate,
    endDate,
  }: {
    page?: number;
    limit?: number;
    userId?: number;
    action?: string;
    entity?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) where.userId = userId;
    if (action) where.action = action;
    if (entity) where.entity = entity;
    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get recent logs (last 24 hours)
   */
  static async getRecentLogs(limit: number = 100) {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return prisma.auditLog.findMany({
      where: {
        createdAt: {
          gte: twentyFourHoursAgo,
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  /**
   * Get activity summary (counts by action and entity)
   */
  static async getActivitySummary() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [byAction, byEntity] = await Promise.all([
      prisma.auditLog.groupBy({
        by: ["action"],
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        _count: {
          id: true,
        },
      }),
      prisma.auditLog.groupBy({
        by: ["entity"],
        where: {
          createdAt: {
            gte: sevenDaysAgo,
          },
        },
        _count: {
          id: true,
        },
      }),
    ]);

    return {
      byAction: byAction.map((item) => ({
        action: item.action,
        count: item._count.id,
      })),
      byEntity: byEntity.map((item) => ({
        entity: item.entity,
        count: item._count.id,
      })),
    };
  }
}