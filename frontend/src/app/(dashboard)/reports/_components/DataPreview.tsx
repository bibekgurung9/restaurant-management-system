import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fetchCompletedOrdersData } from "@/utils/previewSales";

function DataPreview({ date }: any) {
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);  // Number of records per page
  const [totalRecords, setTotalRecords] = useState(0);
  const fetchData = async () => {
    setLoading(true);
    const result = await fetchCompletedOrdersData(date); // Fetch all data at once
    console.log(result)
    console.log(date)
    if (result.status) {
      setPreviewData(result.data);
      console.log(result.data)
      setTotalRecords(result.data!.orders.length);
    } else {
      alert(result.message || "Error fetching data.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [date]); // Fetch data whenever the date changes

  const handleCloseDialog = () => {
    setPreviewData(null); // Clear data when dialog is closed
    setCurrentPage(1);
  };

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = previewData
    ? previewData.orders.slice(indexOfFirstRecord, indexOfLastRecord)
    : [];

  // Pagination control handlers
  const handleNextPage = () => {
    if (currentPage < Math.ceil(totalRecords / recordsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button onClick={fetchData} disabled={loading}>
          {loading ? "Fetching..." : "Preview Data"}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Data Preview for {date}</DialogTitle>
        </DialogHeader>

        {previewData ? (
          <Tabs defaultValue="records" className="mt-4">
            <TabsList>
              <TabsTrigger value="records">Records</TabsTrigger>
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="records">
              <h2 className="text-lg font-semibold">Orders</h2>
              <div className="overflow-x-auto mt-4">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2">Order ID</th>
                      <th className="px-4 py-2">Total Amount</th>
                      <th className="px-4 py-2">Payment Method</th>
                      <th className="px-4 py-2">Paid Amount</th>
                      <th className="px-4 py-2">VAT Amount</th>
                      <th className="px-4 py-2">Service Charge</th>
                      <th className="px-4 py-2">Discount Amount</th>
                      <th className="px-4 py-2">Remaining Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.map((order: any) => (
                      <tr key={order.id} className="border-b">
                        <td className="px-4 py-2">{order.id}</td>
                        <td className="px-4 py-2">{order.totalAmount}</td>
                        <td className="px-4 py-2">{order.paymentMethod}</td>
                        <td className="px-4 py-2">{order.paidAmount}</td>
                        <td className="px-4 py-2">{order.vatAmount}</td>
                        <td className="px-4 py-2">{order.serviceChargeAmount}</td>
                        <td className="px-4 py-2">{order.discountAmount}</td>
                        <td className="px-4 py-2">{order.remainingAmount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalRecords > recordsPerPage && (
                <div className="mt-4 flex justify-between items-center">
                  <Button
                    disabled={currentPage === 1 || loading}
                    onClick={handlePrevPage}
                  >
                    Previous
                  </Button>
                  <span>Page {currentPage} of {Math.ceil(totalRecords / recordsPerPage)}</span>
                  <Button
                    disabled={currentPage === Math.ceil(totalRecords / recordsPerPage) || loading}
                    onClick={handleNextPage}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Summary Tab */}
            <TabsContent value="summary">
              <h2 className="text-lg font-semibold">Metrics Summary</h2>
              <ul className="list-disc pl-6 mt-4">
                <li>Total Orders: {previewData.metrics.totalOrders}</li>
                <li>Total Sales: NPR. {previewData.metrics.totalSales}</li>
                <li>Total Discount Amount: NPR. {previewData.metrics.totalDiscount}</li>
                <li>Total Service Charge: NPR. {previewData.metrics.totalServiceCharge}</li>
                <li>Total VAT Amount: NPR. {previewData.metrics.totalVAT}</li>
                <li>Total Credit Payments: NPR. {previewData.metrics.totalCreditPayments}</li>
                <li>Opening Balance: NPR. {previewData.metrics.openingBalance}</li>
                <li>Closing Balance: NPR. {previewData.metrics.closingBalance}</li>

                {/* Payment Method Breakdown */}
                {previewData.metrics.paymentMethodStats &&
                  previewData.metrics.paymentMethodStats?.map((method: any, index: number) => (
                    <li key={index}>
                      {Object.keys(method)[0]}: {method[Object.keys(method)[0]]}
                    </li>
                  ))}
              </ul>
            </TabsContent>
          </Tabs>
        ) : (
          <p>No data to preview. Click on "Preview Data" to fetch.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default DataPreview;
