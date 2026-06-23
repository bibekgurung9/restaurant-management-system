import ListLayout from "@/components/layout/ListLayout";
import RevenueInsightsForm from "@/app/(dashboard)/reports/_components/RevenuInsights";

export const metadata = {
  title: "Admin - Revenue Insights",
};

export default async function Page() {
  return (
    <ListLayout title="Revenue Insights" totalCount={0}>
      <RevenueInsightsForm />
    </ListLayout>
  );
}
