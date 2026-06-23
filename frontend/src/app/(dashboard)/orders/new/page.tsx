import ListLayout from "@/components/layout/ListLayout";
import requests from "@/lib/requests";
import { pageQuery } from "@/utils/query-handler";
import React from "react";
import TableForm from "../../tables/Form";
import DialogPage from "./_dialog";
import { comboListUrl, itemListUrl, tableListUrl } from "@/config/urls";

export const metadata = {
  title: "Admin - Add Order",
};

export default async function Page({
  searchParams,
}: {
  searchParams: { page: string; search: string };
}) {

  const [tablesResponse, foodItemsResponse, combosResponse] = await Promise.all([
    requests.get(`${tableListUrl}?${pageQuery(searchParams.page)}`),
    requests.get(itemListUrl),
    requests.get(comboListUrl),
  ]);

  const { data: tables, meta } = tablesResponse;
  const { data: foodItems } = foodItemsResponse;
  const { data: combos } = combosResponse;

  return (
    <ListLayout
      title="Select a table to place an order :"
      subtitle="Total Tables"
      totalCount={meta?.totalTables}
      link={{
        href: "/tables",
        label: "Manage Tables"
      }}
    >
      {tables?.length > 0 ? (
        <DialogPage tables={tables} foodItems={foodItems} combos={combos} />
      ) : (
        <div className="w-full text-center text-xl text-primary font-medium mt-12">
          <p>It seems you haven't created any tables yet!</p>
          <br />
          <TableForm>
            <div className="mt-4 bg-primary text-white px-6 py-2 rounded-md hover:bg-primary-dark">
              Create a table
            </div>
          </TableForm>
        </div>
      )}
    </ListLayout>
  );
}
