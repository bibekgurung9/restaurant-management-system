import { FunnelIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menubar, MenubarContent, MenubarMenu, MenubarTrigger } from "../ui/menubar";

const orderStatuses = [
  { id: "all", label: "All Orders" },
  { id: "pending", label: "Pending" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

function OrderStatusFilterActions() {
  const searchParams = useSearchParams();
  const currentStatus = searchParams?.get("status") || "all";
  const currentPage = Number(searchParams?.get("page")) || 1;
  const currentDate = searchParams?.get("date"); // Get the current date query parameter
  const currentPath = usePathname();

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger className="flex gap-2 items-center secondary-btn">
          <FunnelIcon className="h-5 w-5" />
          Filter Status
        </MenubarTrigger>
        <MenubarContent className="py-4 px-3">
          <ul className="space-y-2 text-sm mt-2">
            {orderStatuses.map((status) => (
              <li
                key={status.id}
                className={`flex items-center py-1 px-3 rounded-md ${
                  currentStatus === status.id
                    ? "bg-primary text-white"
                    : "hover:bg-lightGray"
                }`}
              >
                <Link
                  href={{
                    pathname: currentPath,
                    query: {
                      page: currentPage,
                      status: status.id === "all" ? "" : status.id, // Set status
                      date: currentDate || "", // Preserve the current date
                    },
                  }}
                >
                  {status.label}
                </Link>
              </li>
            ))}
          </ul>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

export default OrderStatusFilterActions;
