import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface GuestCountInputProps {
  guests: number;
  setGuests: (guests: number) => void;
  disabled: boolean;
  capacity: number;
}

const GuestCountInput = ({ guests, setGuests, disabled, capacity }: GuestCountInputProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newGuests = Number(e.target.value);

    // Check if the number exceeds the capacity
    if (newGuests > capacity) {
      // Show error toast when guests exceed capacity
      toast.error( `Cannot exceed table capacity of ${capacity} guests.`,);

      newGuests = capacity;
    } else if (newGuests < 1) {
      newGuests = 1;
    }

    setGuests(newGuests);
  };

  return (
    <div className="flex flex-col gap-2 w-1/2">
      <label htmlFor="guests" className="font-semibold text-sm">
        Number of Guests <span className="text-primary">*</span>
      </label>
      <Input
        id="guests"
        type="number"
        value={guests}
        min={1}
        max={capacity}  
        onChange={handleChange}
        className="p-2 text-sm border rounded"
        disabled={disabled}
      />
    </div>
  );
};

export default GuestCountInput;