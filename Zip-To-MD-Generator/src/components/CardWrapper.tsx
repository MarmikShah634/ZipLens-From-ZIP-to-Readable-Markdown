import React from "react";

interface Props {
  title: string;
  children: React.ReactNode;
}

const CardWrapper: React.FC<Props> = ({ title, children }) => {
  return (
    <div className="bg-gray-800/90 backdrop-blur-xl shadow-2xl rounded-2xl p-6 w-full max-w-2xl mx-auto border border-gray-700">
      <h2 className="text-lg font-semibold text-gray-100 mb-4">{title}</h2>
      {children}
    </div>
  );
};

export default CardWrapper;
