import React from 'react';
import Image from 'next/image';

interface PopupProps {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  className: string
}

function Popup({ type, title, message, className }: PopupProps) {
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-xl shadow-lg m-2 flex items-start gap-3 p-4 border shadow-[0px_2px_6px_0px_rgba(0,0,0,0.08)] h-[79px] shrink-0 rounded-lg border-solid items-center">
      {type === "success" && <Image src="/success.svg" alt="Success logo" height={60} width={60} className="text-green-500 flex-shrink-0" />}
      {type === "error" && <Image src="/failure.svg" alt="Error logo" height={40} width={40} className="text-green-500 flex-shrink-0" />}
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
}

export default Popup;