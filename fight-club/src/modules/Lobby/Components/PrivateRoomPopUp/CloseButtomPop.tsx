import React from "react";

type Props = {
    onClose: () => void;
};

export const CloseButtonPopUP :React.FC<Props> = ({onClose}) =>{
    return(
        <button onClick={onClose} className="absolute top-6 right-6 text-stone-400 hover:text-orange-500 transition-colors active:scale-95">
           <span className="material-symbols-outlined text-3xl">close</span>
        </button>
    );
}