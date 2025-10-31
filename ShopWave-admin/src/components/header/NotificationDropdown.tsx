import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown.tsx";
import { Link } from "react-router";
// Removed i18n usage; hardcoded Vietnamese labels

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);
  const handleClick = () => {
    toggleDropdown();
    setNotifying(false);
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
        aria-label="Thông báo"
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 ${notifying ? "" : "hidden"}`}
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-5 h-5"
          aria-hidden="true"
        >
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zm0 16a3 3 0 003-3H7a3 3 0 003 3z" />
        </svg>
      </button>

      <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-[360px] p-0">
        <div className="p-4">
          <div className="mb-3 text-sm font-medium text-gray-800 dark:text-gray-200">
            Thông báo
          </div>
          <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
            <li className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
              Không có thông báo
            </li>
          </ul>
          <Link
            to="/"
            className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Xem tất cả thông báo
          </Link>
        </div>
      </Dropdown>
    </div>
  );
}
