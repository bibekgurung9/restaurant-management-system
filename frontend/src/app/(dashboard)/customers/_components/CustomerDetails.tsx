import {
  Calendar,
  Mail,
  Pencil,
  Phone,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import CustomerForm from "@/app/(dashboard)/customers/Form";
import { formatDate } from "../../../../lib/format-date";
import { formatPrice } from "@/lib/format-price";

interface Props {
  customer: any
}

export default function CustomerDetailsCard({
  customer,
}: Props) {
  const creditUsage =
    customer.availableCredit > 0
      ? (customer.currentCredit /
        customer.availableCredit) *
      100
      : 0;

  return (
    <Card className="shadow-sm">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex flex-col gap-4 border-b p-6 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">
                {customer.name}
              </h2>

              <CustomerForm data={customer}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </CustomerForm>
            </div>

            <p className="text-sm text-muted-foreground">
              Customer #{customer.id}
            </p>

            <div className="mt-3">
              <Badge
                variant={
                  customer.currentCredit > 0
                    ? "danger"
                    : "outline"
                }
              >
                {customer.currentCredit > 0
                  ? "Outstanding Credit"
                  : "No Outstanding Credit"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4 p-6 lg:grid-cols-4">
          <MetricCard
            label="Credit Limit"
            value={`${formatPrice(customer.availableCredit)}`}
          />

          <MetricCard
            label="Current Credit"
            value={`${formatPrice(customer.currentCredit)}`}
          />

          <MetricCard
            label="Orders"
            value={customer.totalOrders}
          />

          <MetricCard
            label="Total Spend"
            value={`${formatPrice(
              customer.totalLifetimeSpend ??
              customer.totalOrderAmount
            )}`}
          />
        </div>

        {/* Credit Usage */}
        <div className="px-6 pb-6">
          <div className="rounded-lg border p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">
                Credit Usage
              </span>

              <span className="text-sm text-muted-foreground">
                {creditUsage.toFixed(0)}%
              </span>
            </div>

            <Progress value={creditUsage} />
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t px-6 py-5">
          <div className="grid gap-4 md:grid-cols-3">
            <InfoItem
              icon={<Phone className="h-4 w-4" />}
              label="Phone"
              value={customer.phone}
            />

            <InfoItem
              icon={<Mail className="h-4 w-4" />}
              label="Email"
              value={customer.email || "N/A"}
            />

            <InfoItem
              icon={<Calendar className="h-4 w-4" />}
              label="Member Since"
              value={
                customer.createdAt
                  ? formatDate(customer.createdAt)
                  : "N/A"
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-xs text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-xl font-semibold">
        {value}
      </p>
    </div>
  );
}

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 text-muted-foreground">
        {icon}
      </div>

      <div>
        <p className="text-xs text-muted-foreground">
          {label}
        </p>

        <p className="text-sm font-medium">
          {value}
        </p>
      </div>
    </div>
  );
}