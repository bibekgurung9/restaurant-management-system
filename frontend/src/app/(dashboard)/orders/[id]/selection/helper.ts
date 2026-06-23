import { useState } from "react";

export function usePagination<T>(items: T[], itemsPerPage: number) {
  const [currentPage, setCurrentPage] = useState(0);

  const paginatedItems = items.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const hasNextPage = (currentPage + 1) * itemsPerPage < items.length;
  const hasPreviousPage = currentPage > 0;

  const nextPage = () => {
    if (hasNextPage) setCurrentPage((prev) => prev + 1);
  };

  const previousPage = () => {
    if (hasPreviousPage) setCurrentPage((prev) => prev - 1);
  };

  return {
    paginatedItems,
    hasNextPage,
    hasPreviousPage,
    nextPage,
    previousPage,
  };
}

