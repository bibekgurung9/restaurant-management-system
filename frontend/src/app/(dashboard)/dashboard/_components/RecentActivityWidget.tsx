import requests from "@/lib/requests";

type Log = {
  id: number;
  userName?: string;
  action: string;
  entity: string;
  createdAt: string;
};

export default async function RecentActivityWidget() {
  const { data: logs } = await requests.get(
    "/audit-logs/recent?limit=8"
  );

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Recent Activity
        </h3>
      </div>

      <div className="space-y-3">
        {logs?.map((log: Log) => (
          <div
            key={log.id}
            className="flex items-start justify-between gap-3"
          >
            {/* Left */}
            <div className="flex flex-col">
              <span className="text-sm font-medium">
                {log.userName ?? "System"}
              </span>

              <span className="text-xs text-muted-foreground">
                {log.action} • {log.entity}
              </span>
            </div>

            {/* Right */}
            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
              {new Date(log.createdAt).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}