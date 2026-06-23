import ActionButton from "@/components/layout/ActionButton";
import { Column, DataTable } from "@/components/layout/DataTable";
import ListLayout from "@/components/layout/ListLayout";
import requests from "@/lib/requests";
import { pageQuery } from "@/utils/query-handler";
import { PencilIcon } from "lucide-react";
import UserForm from "./Form";
import { getStaffList } from "@/config/urls";
import { AdminRole } from "@/config/constant";

export interface StaffUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  image: string;
  role: AdminRole;
  verified: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  last_active_at: string | null;
  type: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
}


export const metadata = {
  title: "Users",
};

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { page: string };
}) {
  const { data: staff, meta } = await requests.get(
    `${getStaffList}?${pageQuery(searchParams.page)}`
  );

  const columns: Column<StaffUser>[] = [
    {
      key: "sn",
      header: "S.N",
      render: (_, i) => i + 1,
    },

    {
      key: "user",
      header: "User",
      render: (user) => (
        <div className="flex items-center gap-3">
          {user.image ? (
            <img
              src={user.image}
              className="h-9 w-9 rounded-full object-cover"
              alt={user.name}
            />
          ) : (
            <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center font-medium">
              {user.name.charAt(0)}
            </div>
          )}

          <div className="flex flex-col">
            <span className="font-medium">{user.name}</span>
            <span className="text-xs text-muted-foreground">
              {user.email}
            </span>
          </div>
        </div>
      ),
    },

    {
      key: "role",
      header: "Role",
      render: (user) => {
        const styles: Record<AdminRole, string> = {
          SUPER_ADMIN: "bg-red-100 text-red-700",
          ADMIN: "bg-purple-100 text-purple-700",
          STAFF: "bg-blue-100 text-blue-700",
          CASHIER: "bg-green-100 text-green-700",
        };

        return (
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${styles[user.role]}`}
          >
            {user.role.replace("_", " ")}
          </span>
        );
      },
    },

    {
      key: "verification",
      header: "Verification",
      render: (user) => (
        <div className="flex flex-col gap-1 text-xs">
          <span className={user.email_verified ? "text-green-600" : "text-red-500"}>
            Email {user.email_verified ? "Verified" : "Pending"}
          </span>

          <span className={user.phone_verified ? "text-green-600" : "text-red-500"}>
            Phone {user.phone_verified ? "Verified" : "Pending"}
          </span>
        </div>
      ),
    },

    {
      key: "active",
      header: "Last Active",
      render: (user) => (
        <span className="text-sm text-muted-foreground">
          {user.last_active_at
            ? new Date(user.last_active_at).toLocaleString()
            : "Never"}
        </span>
      ),
    },

    {
      key: "actions",
      header: "Actions",
      render: (user) => (
        <UserForm data={user}>
          <ActionButton icon={<PencilIcon className="h-4 w-4" />}>
            Edit
          </ActionButton>
        </UserForm>
      ),
    },
  ];

  return (
    <ListLayout
      title="Staff Management"
      subtitle="System Users"
      totalCount={meta?.totalUsers ?? 0}
      actions={<Actions />}
    >
      <DataTable
        data={staff}
        columns={columns}
        emptyText="No staff found"
      />
    </ListLayout>
  );
}

function Actions() {
  return (
    <UserForm>
      <ActionButton>Add Staff</ActionButton>
    </UserForm>
  );
}