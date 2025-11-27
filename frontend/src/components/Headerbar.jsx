import React from "react";
import { X, ChevronDown, MoreVertical } from "lucide-react";

const HeaderBar = ({ title, onClose }) => {
  return (
    <div className="bg-[#09113B] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {onClose && (
          <X className="w-5 h-5 text-white cursor-pointer" onClick={onClose} />
        )}
        <span className="font-medium text-white">{title || "Predicta App"}</span>
      </div>
      <div className="flex gap-3">
        <ChevronDown className="w-5 h-5 text-white" />
        <MoreVertical className="w-5 h-5 text-white" />
      </div>
    </div>
  );
};

export default HeaderBar;
