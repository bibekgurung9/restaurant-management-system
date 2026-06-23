interface LoyaltyProgramSelectorProps {
  loyaltyPrograms: any[];
  selectedLoyaltyProgram: any | null;
  onSelect: (program: any) => void;
}

const LoyaltyProgramSelector: React.FC<LoyaltyProgramSelectorProps> = (
  { loyaltyPrograms, selectedLoyaltyProgram, onSelect }
) => {
  return (
    <div className="w-full">
      <h4>Select Loyalty Program</h4>
      <select
        className="w-full p-2 border rounded-md h-[50px]"
        value={selectedLoyaltyProgram?.id || ""}
        onChange={(e) => {
          const selectedProgram = loyaltyPrograms.find(program => program.id === parseInt(e.target.value));
          onSelect(selectedProgram);
        }}
      >
        {loyaltyPrograms.map((program) => (
          <option key={program.id} value={program.id}>
            {program.name} - {program.discount}% Discount
          </option>
        ))}
        <option value="">No Discount</option>
      </select>
    </div>
  );
};

export default LoyaltyProgramSelector;
