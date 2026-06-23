import React from "react";
import DayOrderBookForm from "@/app/(dashboard)/transactions/_components/DayBook";
import ListLayout from "@/components/layout/ListLayout";
import requests from "@/lib/requests";
import { pageQuery } from "@/utils/query-handler";
import { billingDayBookUrl } from "@/config/urls";

export const metadata = {
  title: "Day Book",
};

export default async function Page({
  searchParams,
}: {
  searchParams: {
    page: string;
    limit: string,
    status: string,
    date: string
  };
}) {
  const { data: orderData, meta } = await requests.get(
    `${billingDayBookUrl}?${pageQuery(searchParams.page)}&status=${searchParams.status ? searchParams.status : ''}&date=${searchParams.date}`
  );

  return (
    <ListLayout
      title="Day Book"
      totalCount={meta?.totalOrders ? meta.totalOrders : 0}
    >
      <DayOrderBookForm ordersData={orderData?.orders} metricsData={orderData?.metrics} />
    </ListLayout>

  );
}