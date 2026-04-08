import React from 'react';


export const NotificationsButton : React.FC = () =>{
    return(
        <button className="relative w-10 h-10 flex items-center justify-center hover:bg-stone-900 transition-all active:scale-95 text-stone-400 hover:text-orange-500">
            <span className="material-symbols-outlined" data-icon="notifications"> notifications</span> 
         </button>
    );
}