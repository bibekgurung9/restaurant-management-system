import React from 'react';

interface MetricCardProps {
  title: string;
  number: number | string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, number }) => {
  return (
    <div className="p-3 bg-white rounded shadow text-center">
      <p className="text-sm text-gray-700 font-medium">{title}</p>
      <p className="text-xl font-semibold">{number}</p>
    </div>
  );
};

export default MetricCard;
