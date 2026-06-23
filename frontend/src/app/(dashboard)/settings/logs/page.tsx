import { Column, DataTable } from "@/components/layout/DataTable";
import ListLayout from "@/components/layout/ListLayout";
import { getAllAuditLogs } from "@/config/urls";
import requests from "@/lib/requests";
import { AuditAction, AuditLog } from "@/typings";
import { pageQuery } from "@/utils/query-handler";


export const metadata = {
  title: "Admin - Audit Logs",
};

export default async function Page({
  searchParams,
}: {
  searchParams: { page: string };
}) {
  const { data: logs, meta } = await requests.get(
    `${getAllAuditLogs}?${pageQuery(searchParams.page)}`
  );

  const getActionStyle = (action: AuditAction) => {
    switch (action) {
      case "CREATE":
        return "bg-green-100 text-green-700";
      case "UPDATE":
        return "bg-blue-100 text-blue-700";
      case "DELETE":
        return "bg-red-100 text-red-700";
      case "LOGIN":
        return "bg-purple-100 text-purple-700";
      case "LOGOUT":
        return "bg-gray-100 text-gray-700";
      case "LOGIN_FAILED":
        return "bg-orange-100 text-orange-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const columns: Column<AuditLog>[] = [
    {
      key: "sn",
      header: "S.N",
      render: (_, i) => i + 1,
    },

    {
      key: "user",
      header: "User",
      render: (log) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {log.userName ?? `User #${log.userId}`}
          </span>
          <span className="text-xs text-muted-foreground">
            ID: {log.userId}
          </span>
        </div>
      ),
    },

    {
      key: "action",
      header: "Action",
      render: (log) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getActionStyle(
            log.action
          )}`}
        >
          {log.action}
        </span>
      ),
    },

    {
      key: "entity",
      header: "Entity",
      render: (log) => (
        <div className="flex flex-col">
          <span className="font-medium">{log.entity}</span>
          {log.entityId && (
            <span className="text-xs text-muted-foreground">
              #{log.entityId}
            </span>
          )}
        </div>
      ),
    },

    {
      key: "description",
      header: "Description",
      render: (log) => (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {log.description ?? "-"}
        </span>
      ),
    },

    {
      key: "date",
      header: "Time",
      render: (log) => (
        <span className="text-sm text-muted-foreground">
          {new Date(log.createdAt).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <ListLayout
      title="Audit Logs"
      subtitle="System activity & security events"
      totalCount={meta?.totalLogs ?? 0}
    >
      <DataTable
        data={logs}
        columns={columns}
        emptyText="No logs found"
      />
    </ListLayout>
  );
}