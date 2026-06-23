import React from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/ui/button";
import PaginationHandler from "./Pagination";

function ListLayout({
  title,
  subtitle,
  totalCount,
  link,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  totalCount: number;
  link?: { href: string; label: string };
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between pb-2">
        {/* Title Section */}
        <div className="flex flex-col gap-1 min-w-0">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </h2>

          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}{" "}
              <span className="text-muted-foreground/70">
                · {totalCount} items
              </span>
            </p>
          )}
        </div>

        {/* Actions Section */}
        <div className="flex flex-wrap items-center gap-2 sm:justify-end pr-1">
          {actions}

          {link && (
            <Link
              href={link.href}
              prefetch
              className={buttonVariants({
                variant: "default",
              })}
            >
              {link.label}
            </Link>
          )}
        </div>
      </div>

      <Separator className="my-4" />

      {/* List */}
      <div className="flex-1 w-full overflow-y-auto pb-5">
        {children}
      </div>

      {/* Pagination */}
      <div className="pt-3 border-t">
        <PaginationHandler totalCount={totalCount} />
      </div>
    </div>
  );
}

export default ListLayout;