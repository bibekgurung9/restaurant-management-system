import { Input } from "@/components/ui/input";

interface InputFieldProps {
  label: string;
  value: number | string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string;
  disabled?: boolean;
  type?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, placeholder, disabled, type = "text" }) => {
  return (
    <div className="mt-4 p-2">
      <h4>{label}</h4>
      <Input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
};

export default InputField;
