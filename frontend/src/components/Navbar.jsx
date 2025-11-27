import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.slice(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  if (isMobile) {
    return <MobileNavbar currentPath={currentPath} navigate={navigate} />;
  }

  return <DesktopNavbar currentPath={currentPath} navigate={navigate} />;
}

// Mobile navbar (your existing design)
function MobileNavbar({ currentPath, navigate }) {
  return (
    <div className="fixed bottom-4 left-4 right-4 z-30 md:hidden">
      <nav className="w-full max-w-md mx-auto bg-[#080C1BE5]/85 z-50 rounded-xl px-2 py-3 flex justify-around items-center border border-transparent bg-clip-padding border-gradient-to-br from-[#09113B] to-[#195281]">
        <NavItem
          label="Predict"
          active={currentPath === "predict"}
          onClick={() => navigate("/predict")}
          svgContent={
            <path d="M8.5 14.6667C8.5 15.9553 9.54467 17 10.8333 17L13 17C14.3807 17 15.5 15.8807 15.5 14.5C15.5 13.1193 14.3807 12 13 12L11 12C9.61929 12 8.5 10.8807 8.5 9.5C8.5 8.11929 9.61929 7 11 7L13.1667 7C14.4553 7 15.5 8.04467 15.5 9.33333M12 5.5L12 7M12 17L12 18.5M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" />
          }
          viewBox="0 0 24 24"
          isMobile
        />
        <NavItem
          label="Play"
          active={currentPath === "play"}
          onClick={() => navigate("/play")}
          svgContent={
            <path d="M5.25 4.98963C5.25 4.01847 5.25 3.53289 5.45249 3.26522C5.62889 3.03203 5.89852 2.88773 6.1904 2.8703C6.52544 2.8503 6.92946 3.11965 7.73752 3.65835L18.2531 10.6687C18.9208 11.1139 19.2546 11.3364 19.3709 11.6169C19.4727 11.8622 19.4727 12.1378 19.3709 12.3831C19.2546 12.6636 18.9208 12.8862 18.2531 13.3313L7.73752 20.3417C6.92946 20.8804 6.52544 21.1497 6.1904 21.1297C5.89852 21.1123 5.62889 20.968 5.45249 20.7348C5.25 20.4671 5.25 19.9815 5.25 19.0104V4.98963Z" />
          }
          viewBox="0 0 25 24"
          isMobile
        />
        <NavItem
          label="Rewards"
          active={currentPath === "rewards"}
          onClick={() => navigate("/rewards")}
          svgContent={
            <path d="M11.6043 2.17701L13.4317 5.82776C13.6108 6.18616 13.9565 6.43467 14.3573 6.49218L18.4453 7.08062C19.4554 7.22644 19.8573 8.45055 19.1263 9.15194L16.1702 11.9924C15.8797 12.2718 15.7474 12.6733 15.8162 13.0676L16.5138 17.0778C16.6856 18.0698 15.6298 18.8267 14.727 18.3574L11.0732 16.4627C10.715 16.2768 10.286 16.2768 9.92679 16.4627L6.273 18.3574C5.37023 18.8267 4.31439 18.0698 4.48724 17.0778L5.18385 13.0676C5.25257 12.6733 5.12033 12.2718 4.82982 11.9924L1.87368 9.15194C1.14272 8.45055 1.54464 7.22644 2.55466 7.08062L6.64265 6.49218C7.04354 6.43467 7.39028 6.18616 7.56937 5.82776L9.39574 2.17701C9.84765 1.27433 11.1523 1.27433 11.6043 2.17701Z" />
          }
          viewBox="0 0 21 20"
          isMobile
        />
        <NavItem
          label="Wallet"
          active={currentPath === "wallet"}
          onClick={() => navigate("/wallet")}
          svgWidth="22"
          svgHeight="20"
          svgContent={
            <g>
              <path d="M20.6389 12.3957H16.5906C15.1042 12.3948 13.8994 11.1909 13.8985 9.70446C13.8985 8.21801 15.1042 7.01409 16.5906 7.01318H20.6389" />
              <path d="M17.0486 9.64294H16.7369" />
              <path d="M6.74766 1H15.3911C18.2892 1 20.6388 3.34951 20.6388 6.24766V13.4247C20.6388 16.3229 18.2892 18.6724 15.3911 18.6724H6.74766C3.84951 18.6724 1.5 16.3229 1.5 13.4247V6.24766C1.5 3.34951 3.84951 1 6.74766 1Z" />
              <path d="M6.03561 5.5382H11.4346" />
            </g>
          }
          viewBox="0 0 22 20"
          isMobile
        />
        <NavItem
          label="Profile"
          active={currentPath === "profile"}
          onClick={() => navigate("/profile")}
          svgWidth="18"
          svgHeight="18"
          svgContent={
            <g>
              <path d="M9 9C11.21 9 13 7.21 13 5C13 2.79 11.21 1 9 1C6.79 1 5 2.79 5 5C5 7.21 6.79 9 9 9Z" />
              <path d="M15 13C15 15.76 12.76 17 9 17C5.24 17 3 15.76 3 13C3 11.24 5.24 11 9 11C12.76 11 15 11.24 15 13Z" />
            </g>
          }
          viewBox="0 0 18 18"
          isMobile
        />
      </nav>
    </div>
  );
}

// Desktop navbar - moved back to bottom
function DesktopNavbar({ currentPath, navigate }) {
  return (
    <div className="hidden md:block fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30">
      <nav className="bg-[#080C1BE5]/85 rounded-xl px-6 py-3 border border-transparent bg-clip-padding border-gradient-to-br from-[#09113B] to-[#195281]">
        <div className="flex space-x-8 items-center">
          <DesktopNavItem
            label="Predict"
            active={currentPath === "predict"}
            onClick={() => navigate("/predict")}
            svgContent={
              <path d="M8.5 14.6667C8.5 15.9553 9.54467 17 10.8333 17L13 17C14.3807 17 15.5 15.8807 15.5 14.5C15.5 13.1193 14.3807 12 13 12L11 12C9.61929 12 8.5 10.8807 8.5 9.5C8.5 8.11929 9.61929 7 11 7L13.1667 7C14.4553 7 15.5 8.04467 15.5 9.33333M12 5.5L12 7M12 17L12 18.5M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" />
            }
            viewBox="0 0 24 24"
          />
          <DesktopNavItem
            label="Play"
            active={currentPath === "play"}
            onClick={() => navigate("/play")}
            svgContent={
              <path d="M5.25 4.98963C5.25 4.01847 5.25 3.53289 5.45249 3.26522C5.62889 3.03203 5.89852 2.88773 6.1904 2.8703C6.52544 2.8503 6.92946 3.11965 7.73752 3.65835L18.2531 10.6687C18.9208 11.1139 19.2546 11.3364 19.3709 11.6169C19.4727 11.8622 19.4727 12.1378 19.3709 12.3831C19.2546 12.6636 18.9208 12.8862 18.2531 13.3313L7.73752 20.3417C6.92946 20.8804 6.52544 21.1497 6.1904 21.1297C5.89852 21.1123 5.62889 20.968 5.45249 20.7348C5.25 20.4671 5.25 19.9815 5.25 19.0104V4.98963Z" />
            }
            viewBox="0 0 25 24"
          />
          <DesktopNavItem
            label="Rewards"
            active={currentPath === "rewards"}
            onClick={() => navigate("/rewards")}
            svgContent={
              <path d="M11.6043 2.17701L13.4317 5.82776C13.6108 6.18616 13.9565 6.43467 14.3573 6.49218L18.4453 7.08062C19.4554 7.22644 19.8573 8.45055 19.1263 9.15194L16.1702 11.9924C15.8797 12.2718 15.7474 12.6733 15.8162 13.0676L16.5138 17.0778C16.6856 18.0698 15.6298 18.8267 14.727 18.3574L11.0732 16.4627C10.715 16.2768 10.286 16.2768 9.92679 16.4627L6.273 18.3574C5.37023 18.8267 4.31439 18.0698 4.48724 17.0778L5.18385 13.0676C5.25257 12.6733 5.12033 12.2718 4.82982 11.9924L1.87368 9.15194C1.14272 8.45055 1.54464 7.22644 2.55466 7.08062L6.64265 6.49218C7.04354 6.43467 7.39028 6.18616 7.56937 5.82776L9.39574 2.17701C9.84765 1.27433 11.1523 1.27433 11.6043 2.17701Z" />
            }
            viewBox="0 0 21 20"
          />
          <DesktopNavItem
            label="Wallet"
            active={currentPath === "wallet"}
            onClick={() => navigate("/wallet")}
            svgWidth="22"
            svgHeight="20"
            svgContent={
              <g>
                <path d="M20.6389 12.3957H16.5906C15.1042 12.3948 13.8994 11.1909 13.8985 9.70446C13.8985 8.21801 15.1042 7.01409 16.5906 7.01318H20.6389" />
                <path d="M17.0486 9.64294H16.7369" />
                <path d="M6.74766 1H15.3911C18.2892 1 20.6388 3.34951 20.6388 6.24766V13.4247C20.6388 16.3229 18.2892 18.6724 15.3911 18.6724H6.74766C3.84951 18.6724 1.5 16.3229 1.5 13.4247V6.24766C1.5 3.34951 3.84951 1 6.74766 1Z" />
                <path d="M6.03561 5.5382H11.4346" />
              </g>
            }
            viewBox="0 0 22 20"
          />
          <DesktopNavItem
            label="Profile"
            active={currentPath === "profile"}
            onClick={() => navigate("/profile")}
            svgWidth="18"
            svgHeight="18"
            svgContent={
              <g>
                <path d="M9 9C11.21 9 13 7.21 13 5C13 2.79 11.21 1 9 1C6.79 1 5 2.79 5 5C5 7.21 6.79 9 9 9Z" />
                <path d="M15 13C15 15.76 12.76 17 9 17C5.24 17 3 15.76 3 13C3 11.24 5.24 11 9 11C12.76 11 15 11.24 15 13Z" />
              </g>
            }
            viewBox="0 0 18 18"
          />
        </div>
      </nav>
    </div>
  );
}

// Desktop nav item component - updated for horizontal layout
function DesktopNavItem({
  label,
  active,
  onClick,
  svgContent,
  viewBox,
  svgWidth,
  svgHeight,
}) {
  return (
    <div
      className="relative flex flex-col items-center cursor-pointer group px-3 py-2 rounded-lg transition-all duration-200 hover:bg-[#09113B]/30"
      onClick={onClick}
    >
      {/* Active indicator at top */}
      {active && (
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
          <div className="w-8 h-1 bg-white rounded-full" />
        </div>
      )}

      <svg
        width={svgWidth || "24"}
        height={svgHeight || "24"}
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 mb-1"
      >
        {React.Children.map(
          typeof svgContent === "object" &&
            !React.isValidElement(svgContent) ? (
            <path {...svgContent} />
          ) : (
            svgContent
          ),
          (child) =>
            React.cloneElement(child, {
              stroke: active ? "white" : "#9CA3AF",
              strokeWidth: "1.5",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeOpacity: active ? "1" : "0.5",
              fill: "none",
            })
        )}
      </svg>
      <span
        className={`text-sm font-medium transition-colors duration-200 text-center ${
          active
            ? "text-white"
            : "text-gray-400/60 group-hover:text-gray-300"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

// Mobile nav item (your existing component)
function NavItem({
  label,
  active,
  onClick,
  svgContent,
  viewBox,
  svgWidth,
  svgHeight,
  isMobile,
}) {
  return (
    <div
      className="relative flex flex-col items-center text-lg cursor-pointer group w-16"
      onClick={onClick}
    >
      {active && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <div className="h-1 w-8 bg-white rounded-full" />
        </div>
      )}

      <svg
        width={svgWidth || "24"}
        height={svgHeight || "24"}
        viewBox={viewBox}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 mb-1"
      >
        {React.Children.map(
          typeof svgContent === "object" &&
            !React.isValidElement(svgContent) ? (
            <path {...svgContent} />
          ) : (
            svgContent
          ),
          (child) =>
            React.cloneElement(child, {
              stroke: "white",
              strokeWidth: "1.5",
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeOpacity: active ? "1" : "0.5",
              fill: "none",
            })
        )}
      </svg>
      <span
        className={`text-sm mb-1 ${active ? "text-white" : "text-gray-400/60"}`}
      >
        {label}
      </span>
    </div>
  );
}

export default Navbar;