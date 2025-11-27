import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const ToggleMenu = ({
  options = [
    {
      id: "live",
      label: "Live",
      icon: "/path/to/signal.svg",
      iconAlt: "Public icon",
    },
    {
      id: "create",
      label: "Create Pool",
      icon: "/path/to/users-plus.svg",
      iconAlt: "Private icon",
    },
  ],
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeOption =
    location.pathname === "/create-event" ? "create" : "live";

  const handleToggle = (optionId: string) => {
    if (optionId === "create") {
      navigate("/create-event");
    } else {
      navigate("/stake"); // or '/public' depending on your route setup
    }
  };

  return (
    <div className="flex bg-[#0A0E2E] rounded-xl p-1">
      {options.map((option) => (
        <button
          key={option.id}
          className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 ${
            activeOption === option.id
              ? "bg-gradient-to-r from-[#00FFFF] to-[#27FE60] text-black"
              : "text-gray-400"
          }`}
          onClick={() => handleToggle(option.id)}
        >
          {option.icon && (
            <img
              src={option.icon}
              alt={option.iconAlt}
              className="w-4 h-4"
              style={{
                filter:
                  activeOption === option.id
                    ? "brightness(0) saturate(100%) invert(14%) sepia(14%) saturate(7338%) hue-rotate(182deg) brightness(93%) contrast(103%)"
                    : "brightness(0) saturate(100%) invert(73%) sepia(82%) saturate(2553%) hue-rotate(153deg) brightness(100%) contrast(102%)",
              }}
            />
          )}
          {option.label}
        </button>
      ))}
    </div>
  );
};

export default ToggleMenu;
