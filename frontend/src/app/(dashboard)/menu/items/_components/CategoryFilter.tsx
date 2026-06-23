"use client";

import { FunnelIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Category } from "@/typings";
import { Menubar, MenubarContent, MenubarMenu, MenubarTrigger } from "@/components/ui/menubar";

function CategoryFilter({ data }: { data: Category[] }) {
  const searchParams = useSearchParams();
  const currentCategoryId = searchParams?.get("categoryId");
  const currentPage = Number(searchParams?.get("page")) || 1;
  const currentPath = usePathname();

  const isAllActive = !currentCategoryId;

  return (
    <Menubar className="bg-transparent border-none">
      <MenubarMenu>
        <MenubarTrigger
          className="
            group flex items-center gap-2 rounded-xl 
            bg-white border border-gray-200 
            px-4 py-2.5 text-sm font-medium
            shadow-sm hover:shadow-md
            transition-all cursor-pointer
          "
        >
          <FunnelIcon className="h-5 w-5 text-primary group-hover:rotate-12 transition" />
          Filter Category
        </MenubarTrigger>

        <MenubarContent
          align="end"
          className="
            mt-2 w-64 rounded-xl border border-gray-100 
            bg-white p-2 shadow-xl
          "
        >
          <div className="px-3 py-2 text-xs font-semibold uppercase text-gray-400">
            Categories
          </div>

          <ul className="space-y-1 max-h-[300px] overflow-y-auto">
            <li>
              <Link
                href={{
                  pathname: currentPath,
                  query: {},
                }}
                className={`
                  flex items-center justify-between rounded-lg
                  px-3 py-2 text-sm transition-all
                  ${isAllActive
                    ? "bg-primary text-white shadow-sm"
                    : "hover:bg-gray-100 text-gray-700"
                  }
                `}
              >
                <span>All Categories</span>
              </Link>
            </li>

            {data?.map((category) => {
              const active =
                currentCategoryId === category.id.toString();

              return (
                <li key={category.id}>
                  <Link
                    href={{
                      pathname: currentPath,
                      query: {
                        page: currentPage,
                        categoryId: category.id.toString(),
                      },
                    }}
                    className={`
                      flex items-center justify-between
                      rounded-lg px-3 py-2 text-sm
                      transition-all
                      ${active
                        ? "bg-primary text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-100"
                      }
                    `}
                  >
                    <span>{category.name}</span>

                    <span
                      className={`
                        rounded-full px-2 py-0.5 text-xs
                        ${active
                          ? "bg-white/20 text-white"
                          : "bg-gray-100 text-gray-500"
                        }
                      `}
                    >
                      {category.itemCount}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

export default CategoryFilter;