import { formatDate } from "@/lib/format-date";
import { OrderItem } from "@/typings";

// Helper function to display 'NA' for null/undefined strings and 0 for null/undefined numbers
function displayValue(value: any, isNumber = false) {
  if (value === null || value === undefined) {
    return isNumber ? 0 : "NA";
  }
  return value;
}

// Helper function to format the receipt content
function formatReceipt(data: any) {
  const order = data; // The whole order object that contains table, items, etc.
  const payment = order.paymentDetails || {}; // Extract the payment details or default to empty object

  let receipt = `----------------------------\n`;
  receipt += `        Order Receipt\n`;
  receipt += `----------------------------\n`;

  // Extract basic order details
  receipt += `Order ID: ${displayValue(order.id, true)}\n`;
  receipt += `Table: ${displayValue(order.table?.name)}\n`;
  receipt += `Guests: ${displayValue(order.guests, true)}\n`;
  receipt += `Order Date: ${(formatDate(payment.createdAt))}\n`;
  receipt += `Status: ${displayValue(order.status)}\n\n`;

  // Itemized List of Items
  receipt += `Items:\n`;
  order.orderItems.forEach((item: OrderItem) => {
    receipt += ` - ${displayValue(item.itemName)} (Qty: ${displayValue(item.quantity, true)}) - ${displayValue(item.price)} NPR\n`;
  });

  // Subtotal, Discount, Total, and Remaining Balance
  receipt += `\nSubtotal: ${displayValue(order.totalAmount)} NPR\n`;
  receipt += `Discount: ${displayValue(payment.discountPercent )} %\n`;
  // If VAT and Service Charge are available, show them (even if zero)
  if (payment.vatAmount || payment.serviceChargeAmount || payment.vatAmount === 0 || payment.serviceChargeAmount === 0) {
    receipt += `\nVAT : ${displayValue(payment.vatPercentage)} %\n`;
    receipt += `Service Charge : ${displayValue(payment.serviceChargePercentage)} %\n`;
  }
  // Total Amount After Taxes (added)
  receipt += `Total Amount After Taxes: ${displayValue(payment.totalAmountAfterTaxes)} NPR\n`; // Display the total amount after taxes
  // receipt += `Remaining Balance: ${displayValue(order.remainingBalance)} NPR\n`;


  // Payment Information
  receipt += `\nPayment Method: ${displayValue(payment.paymentMethod ? payment.paymentMethod.charAt(0).toUpperCase() + payment.paymentMethod.slice(1) : null)}\n`;
  receipt += `Paid Amount: ${displayValue(payment.paidAmount, true)} NPR\n`;
  receipt += `Payment Status: ${displayValue(payment.paymentStatus ? payment.paymentStatus.charAt(0).toUpperCase() + payment.paymentStatus.slice(1) : null)}\n`;
  receipt += `Payment Date: ${payment.paymentDate ? new Date(payment.paymentDate).toLocaleString() : "NA"}\n`;

  // Add remarks if any
  receipt += `Remarks: ${displayValue(payment.remarks)}\n`;

  // Footer with customer details if available
  receipt += `\nPaid By: ${displayValue(payment.customerName ? payment.customerName : "N/A")}\n`;

  // Footer message
  receipt += `\n----------------------------\n`;
  receipt += `  Thank you for your purchase!\n`;
  receipt += `----------------------------\n`;

  return receipt;
}

// Function to open a print dialog with the formatted receipt
export const printReceipt = (data: any) => {
  // Generate the formatted receipt content from the order data
  const receiptContent = formatReceipt(data);

  // Open a new window for printing
  const printWindow = window.open("", "_blank");

  if (printWindow) {
    // Write the receipt content to the print window
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            .receipt-container {
              max-width: 600px;
              margin: auto;
              padding: 20px;
              border: 1px solid #ccc;
              background-color: #f9f9f9;
              font-size: 16px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              font-size: 14px;
            }
            pre {
              white-space: pre-wrap; /* Ensures content wraps properly */
              word-wrap: break-word;
            }
            .header {
              text-align: center;
              font-weight: bold;
              font-size: 18px;
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <h1>Receipt</h1>
              <p>Order ID: ${displayValue(data.id)}</p>
            </div>
            <pre>${receiptContent}</pre>
            <div class="footer">
              <p>Thank you for your purchase!</p>
            </div>
          </div>
        </body>
      </html>
    `);

    // Ensure the document is fully loaded before printing
    printWindow.document.close();

    // Wait for the document to fully load before triggering the print
    printWindow.onload = () => {
      printWindow.print(); // Trigger the print dialog
      printWindow.close();  // Optionally close the window after printing
    };
  } else {
    console.error("Failed to open print window.");
  }
};
