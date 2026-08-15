import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'Delete Message', 
  message = 'Are you sure you want to delete this? This action cannot be undone.', 
  confirmText = 'Delete', 
  confirmVariant = 'danger' 
}) => {
  const handleClose = onClose || onCancel || (() => {});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl space-y-4 text-center select-none">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto text-xl">
          <FaExclamationTriangle />
        </div>
        <div>
          <h3 className="text-base font-bold text-white mb-1">{title}</h3>
          <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
        </div>
        <div className="flex items-center space-x-3 pt-2">
          <button
            onClick={handleClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              handleClose();
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition ${
              confirmVariant === 'danger'
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
