// components/dashboard/DashboardSkeleton.tsx
export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 bg-gray-200 rounded"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-64 bg-gray-200 rounded-xl"></div>
        <div className="space-y-6"><div className="h-48 bg-gray-200 rounded-xl"></div><div className="h-48 bg-gray-200 rounded-xl"></div></div>
      </div>
    </div>
  );
}