"use client";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { DatePicker } from "../ui/date-picker";

function DatePickerWithQuery() {
  const searchParams = useSearchParams();
  const currentPath = usePathname();
  const router = useRouter();
  const currentQueryDate = searchParams?.get("date");
  const currentQueryStatus = searchParams?.get("status"); // Get the current status query parameter

  const [selectedDate, setSelectedDate] = useState<string | null>(currentQueryDate || null);

  const handleDateChange = (newDate: Date | null) => {
    const updatedQuery = new URLSearchParams(searchParams?.toString() || "");
    
    if (newDate) {
      // To ensure the date is displayed correctly in local time zone
      const dateString = new Date(newDate.getTime() - newDate.getTimezoneOffset() * 60000)
        .toISOString()
        .split("T")[0];

      setSelectedDate(dateString);
      updatedQuery.set("date", dateString);
    } else {
      setSelectedDate(null);
      updatedQuery.delete("date");
    }

    // Preserve the 'status' query parameter in the updated URL
    if (currentQueryStatus) {
      updatedQuery.set("status", currentQueryStatus);
    }

    // Push the updated URL with preserved 'status' and updated 'date'
    router.push(`${currentPath}?${updatedQuery.toString()}`);
  };

  return (
    <div>
      <div className="relative">
        <DatePicker date={selectedDate ? new Date(selectedDate) : new Date()} setDate={handleDateChange} />
      </div>
    </div>
  );
}

export default DatePickerWithQuery;
