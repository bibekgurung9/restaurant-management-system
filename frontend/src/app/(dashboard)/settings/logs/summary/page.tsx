import ListLayout from "@/components/layout/ListLayout";
import requests from "@/lib/requests";

export const metadata = {
  title: "Audit Log Summary",
};

export default async function Page() {
  const { data } = await requests.get("/audit-logs/summary");

  const metrics = [
    { label: "CREATE", value: data.CREATE },
    { label: "UPDATE", value: data.UPDATE },
    { label: "DELETE", value: data.DELETE },
    { label: "LOGIN", value: data.LOGIN },
    { label: "LOGOUT", value: data.LOGOUT },
    { label: "LOGIN FAILED", value: data.LOGIN_FAILED },
  ];

  return (
    <ListLayout
      title="Audit Log Summary"
      subtitle="Last 7 days system activity"
      totalCount={0}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border bg-white p-4 shadow-sm"
          >
            <div className="text-xs text-muted-foreground">
              {m.label}
            </div>

            <div className="text-2xl font-semibold mt-1">
              {m.value}
            </div>
          </div>
        ))}
      </div>
    </ListLayout>
  );
}