"use client";
import { cn } from "@/lib/utils";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

function PaginationHandler({ totalCount }: any) {
  let totalPages = Math.ceil(totalCount / 10);
  let currentPage = Number(useSearchParams()?.get("page")) || 1;

  let pageNumbers = generatePageNumbers(currentPage, totalPages);
  let currrentPath = usePathname();

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between px-2 h-12">
      {/* Info */}
      <span className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {(currentPage - 1) * 10 + 1}
        </span>{" "}
        –{" "}
        <span className="font-medium text-foreground">
          {Math.min(currentPage * 10, totalCount)}
        </span>{" "}
        of <span className="font-medium text-foreground">{totalCount}</span>
      </span>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {/* Prev */}
        <Link
          className={cn(
            "h-9 w-9 flex items-center justify-center rounded-lg border transition-all",
            "hover:bg-muted hover:shadow-sm",
            currentPage <= 1 &&
            "pointer-events-none opacity-40"
          )}
          href={{
            pathname: currrentPath,
            query: {
              page: Math.max(currentPage - 1, 1),
            },
          }}
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Link>

        {/* Pages */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page) => (
            <Link
              key={page}
              href={{
                pathname: currrentPath,
                query: { page },
              }}
              className={cn(
                "h-9 min-w-9 px-3 flex items-center justify-center rounded-lg text-sm transition-all",
                "hover:bg-muted hover:shadow-sm",
                page === currentPage
                  ? "bg-primary text-white shadow-sm"
                  : "text-foreground"
              )}
            >
              {page}
            </Link>
          ))}
        </div>

        {/* Next */}
        <Link
          className={cn(
            "h-9 w-9 flex items-center justify-center rounded-lg border transition-all",
            "hover:bg-muted hover:shadow-sm",
            currentPage >= totalPages &&
            "pointer-events-none opacity-40"
          )}
          href={{
            pathname: currrentPath,
            query: {
              page: currentPage + 1,
            },
          }}
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function generatePageNumbers(currentPage: number, totalPages: number) {
  const maxDisplayedPages = 3;
  let startPage = Math.max(1, currentPage - Math.floor(maxDisplayedPages / 2));
  let endPage = Math.min(totalPages, startPage + maxDisplayedPages - 1);

  if (endPage - startPage + 1 < maxDisplayedPages) {
    startPage = Math.max(1, endPage - maxDisplayedPages + 1);
  }

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return pageNumbers;
}

export default PaginationHandler;
