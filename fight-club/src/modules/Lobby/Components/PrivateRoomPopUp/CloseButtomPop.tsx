import React from "react";

type Props = {
    onClose: () => void;
};

export const CloseButtonPopUP: React.FC<Props> = ({ onClose }) => {
    return (
        <button 
            onClick={onClose} 
            type="button"
            className="absolute top-6 right-6 text-stone-400 hover:text-orange-500 transition-colors active:scale-95 z-[110] cursor-pointer !cursor-pointer"
        >
            <span className="material-symbols-outlined text-3xl pointer-events-none select-none">
                close
            </span>
        </button>
    );
};