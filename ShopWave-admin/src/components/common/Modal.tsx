import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  widthClass?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, widthClass = 'max-w-2xl' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
  <div className={`bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full ${widthClass} m-4`}>
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-white/[0.03]">
          <h3 className="font-semibold text-lg text-black dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-black dark:text-white">
            &times;
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto no-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
