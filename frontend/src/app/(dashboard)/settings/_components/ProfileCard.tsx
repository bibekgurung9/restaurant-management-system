"use client";

import { formatDate } from "@/lib/format-date";

type Staff = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  image: string;
  role: string;
  verified: boolean;
  phone_verified: boolean;
  email_verified: boolean;
  last_active_at: string | null;
  remarks: string | null;
  createdAt: string;
  updatedAt: string;
};

export default function ProfileCard({ user }: { user: Staff }) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center text-xl font-bold">
            {user.name?.charAt(0)}
          </div>

          <div>
            <h1 className="text-xl font-semibold">{user.name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">

          <div>
            <p className="text-gray-500">Role</p>
            <p className="font-medium">{user.role}</p>
          </div>

          <div>
            <p className="text-gray-500">Phone</p>
            <p className="font-medium">{user.phone || "N/A"}</p>
          </div>

          <div>
            <p className="text-gray-500">Email Verified</p>
            <p className="font-medium">
              {user.email_verified ? "Yes" : "No"}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Phone Verified</p>
            <p className="font-medium">
              {user.phone_verified ? "Yes" : "No"}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Last Active</p>
            <p className="font-medium">
              {user.last_active_at
                ? formatDate(user.last_active_at)
                : "Never"}
            </p>
          </div>

          <div>
            <p className="text-gray-500">Created</p>
            <p className="font-medium">
              {formatDate(user.createdAt)}
            </p>
          </div>

        </div>

        {/* Remarks */}
        <div>
          <p className="text-gray-500 text-sm">Remarks</p>
          <p className="font-medium">
            {user.remarks || "No remarks"}
          </p>
        </div>

      </div>
    </div>
  );
}