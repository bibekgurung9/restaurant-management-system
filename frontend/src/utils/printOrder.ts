// Helper function to display 'NA' for null/undefined strings and 0 for null/undefined numbers
function displayValue(value: any, isNumber = false) {
  if (value === null || value === undefined) {
    return isNumber ? 0 : "NA";
  }
  return value;
}

// Helper function to format the order details
function formatOrder(data: any) {
  const {
    id,
    table,
    items,
    status,
  } = data || {};

  const tableName = table?.name || "Unknown Table";
  const orderItems = items || [];

  let orderDetails = `----------------------------\n`;
  orderDetails += `        Order Details\n`;
  orderDetails += `----------------------------\n`;

  // Extract order details with fallbacks
  orderDetails += `Order ID: ${displayValue(id, true)}\n`;
  orderDetails += `Table: ${displayValue(tableName)}\n`;
  orderDetails += `Status: ${displayValue(status)}\n\n`;

  // Itemized List of Items with fallback handling
  orderDetails += `Order Items:\n`;
  if (orderItems.length > 0) {
    orderItems.forEach((item: any) => {
      // Ensure each item is on a new line with a clear format
      orderDetails += ` - ${displayValue(item.itemName)} (Qty: ${displayValue(item.quantity, true)})\n`;
    });
  } else {
    orderDetails += ` - No items available\n`;
  }

  return orderDetails;
}

// Function to open a print dialog with the formatted order details
export const printOrder = (data: any) => {
  // Generate the formatted order details from the order data
  const orderContent = formatOrder(data);

  // Open a new window for printing
  const printWindow = window.open("", "_blank");

  if (printWindow) {
    // Write the order content to the print window
    printWindow.document.write(`
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
            }
            .order-container {
              max-width: 600px;
              margin: auto;
              padding: 20px;
              border: 1px solid #ccc;
              background-color: #f9f9f9;
              font-size: 16px;
            }
            .footer {
              margin-top: 20px;
              font-size: 14px;
            }
            pre {
              white-space: pre-wrap; /* Ensures content wraps properly */
              word-wrap: break-word;
            }
          </style>
        </head>
        <body>
          <div class="order-container">
            <pre>${orderContent}</pre>
            <div class="footer">
              <p>Thank you for dining with us!</p>
            </div>
          </div>
        </body>
      </html>
    `);

    // Ensure the document is fully loaded before printing
    printWindow.document.close();

    // Wait for the document to fully load before triggering the print
    printWindow.onload = () => {
      printWindow.print(); 
      printWindow.close(); // Optionally close the window after printing
    };
  } else {
    console.error("Failed to open print window.");
  }
};
