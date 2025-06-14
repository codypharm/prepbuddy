import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = "",
  showLabel = false,
}) => {
  const { theme, toggleTheme } = useTheme();

  const handleToggleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent all default behavior and propagation
    event.preventDefault();
    event.stopPropagation();

    // Toggle the theme
    toggleTheme();

    // Return false to ensure no other handlers run
    return false;
  };

  return (
    <button
      onClick={handleToggleClick}
      onMouseDown={(e) => e.preventDefault()} // Prevent any mousedown events too
      type="button" // Explicitly set button type to prevent form submission
      className={`flex items-center justify-center p-2 rounded-lg transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700 ${className}`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <>
          <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          {showLabel && (
            <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">
              Dark Mode
            </span>
          )}
        </>
      ) : (
        <>
          <Sun className="h-5 w-5 text-yellow-500" />
          {showLabel && (
            <span className="ml-2 text-sm text-gray-300">Light Mode</span>
          )}
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
