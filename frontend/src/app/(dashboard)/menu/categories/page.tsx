import ListLayout from "@/components/layout/ListLayout";
import requests from "@/lib/requests";
import { pageQuery } from "@/utils/query-handler";
import { PencilIcon } from "lucide-react";
import CategoryForm from "./Form";
import ActionButton from "@/components/layout/ActionButton";
import { categoryListUrl } from "@/config/urls";
import { Column, DataTable } from "@/components/layout/DataTable";
import { Category } from "@/typings";

export const metadata = {
  title: "Categories",
};

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: { page: string; limit: string };
}) {
  const { data: categories, meta } = await requests.get(
    `${categoryListUrl}?${pageQuery(searchParams.page)}`
  );

  const columns: Column<Category>[] = [
    {
      key: "sn",
      header: "S.N",
      render: (_, i) => i + 1,
    },

    {
      key: "name",
      header: "Name",
      render: (cat) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center text-xs font-medium">
            {cat.name.charAt(0)}
          </div>
          <span className="font-medium text-foreground">
            {cat.name}
          </span>
        </div>
      ),
    },

    {
      key: "itemCount",
      header: "Items",
      render: (cat) => (
        <span className="text-muted-foreground">
          {cat.itemCount}
        </span>
      ),
    },

    {
      key: "actions",
      header: "Actions",
      render: (cat) => (
        <div className="flex items-center gap-3">
          <CategoryForm data={cat}>
            <ActionButton>
              Edit
            </ActionButton>
          </CategoryForm>
        </div>
      ),
    },
  ];

  return (
    <ListLayout
      title="Categories"
      subtitle="Manage your menu categories"
      totalCount={meta?.totalCategories ?? 0}
      actions={<Actions />}
    >
      <DataTable
        data={categories}
        columns={columns}
        emptyText="No categories found"
      />
    </ListLayout>
  );
}

function Actions() {
  return (
    <CategoryForm>
      <ActionButton>
        Add New Category
      </ActionButton>
    </CategoryForm>
  );
}