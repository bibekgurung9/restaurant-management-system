import { Button } from "@/components/ui/button";
import { printOrder } from "@/utils/printOrder";
import { PrinterIcon } from "lucide-react";

interface PrintOrderButtonProps {
  order: any;
  hasUnsavedChanges: boolean;
}

const PrintOrderButton = ({ order, hasUnsavedChanges }: PrintOrderButtonProps) => {
  const handlePrint = () => {
    if (!hasUnsavedChanges) {
      printOrder(order);
    }
  };

  return (
    <Button
      type="button"
      variant="default"
      size="icon"
      onClick={handlePrint}
      disabled={hasUnsavedChanges}
      title="Print Order"
    >
      <PrinterIcon />
    </Button>
  );
};

export default PrintOrderButton;
