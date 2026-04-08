import React, { type RefObject } from "react";

type props = {
    formRef : RefObject<HTMLFormElement | null>;
}

export const RefreshButtonPanel :React.FC<props> = ({formRef}) =>{
    function refresh(){
        formRef.current?.requestSubmit();
    }

    return(
        <button onClick={refresh} className="bg-surface-container-highest text-on-surface-variant font-label font-bold text-xs tracking-[0.15em] uppercase h-14 flex items-center justify-center gap-2 hover:bg-surface-bright transition-all active:scale-[0.98] rounded-[14px] md:rounded-[16px]">
            <span className="material-symbols-outlined">refresh</span>
                    Refrescar
        </button>
    );
}