import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'

export const AuthHeader = () => {
  const duration = 1.5;
  const repeatDelay = 1.5;

  return (
    <div className="flex flex-col items-center mb-8 sm:mb-12"> {/* Menos margen en móvil */}
      <div className="relative mb-4 sm:mb-6">
        
        {/* Contenedor del Círculo: w-20 en móvil, w-24 en desktop */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-acero/90 rounded-full flex items-center justify-center border border-fuego/30 shadow-[0_0_50px_rgba(255,68,0,0.15)] overflow-hidden relative">
          
          {/* LA LLAMA: Tamaño 40 en móvil, 48 en desktop */}
          <motion.div
            animate={{ scale: [1, 1.2, 1], x: [0, 8, 0] }}
            transition={{ duration, repeat: Infinity, repeatDelay, times: [0, 0.2, 1], ease: "easeOut" }}
          >
            <Flame className="text-oro w-[40px] h-[40px] sm:w-[48px] sm:h-[48px]" strokeWidth={1.2} />
          </motion.div>

          {/* EL PUÑO */}
          <motion.div
            initial={{ x: -90, opacity: 0 }}
            animate={{ x: [-90, -12, -90], opacity: [0, 1, 0] }}
            transition={{ duration, repeat: Infinity, repeatDelay, times: [0, 0.2, 1], ease: "anticipate" }}
            className="absolute left-0 text-fuego drop-shadow-[0_0_20px_rgba(255,68,0,0.5)]"
          >
            <svg className="w-[38px] h-[38px] sm:w-[45px] sm:h-[45px]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.57 14.86L22 13.43V7.14L20.57 5.71H15.43L14 7.14V8.57H12.57V7.14L11.14 5.71H6V14.86L8.57 17.43H15.43L18 14.86V13.43H19.43V14.86H20.57M5.14 14.86H2V10.29H5.14V14.86M11.14 14.86H8.57V10.29H11.14V14.86Z" />
              <path d="M14.5 17h-4l-2.5-2.5V6h5.5l1.5 1.5V9h1.5l1.5 1.5v4L16.5 16h-2z" opacity=".2"/>
            </svg>
          </motion.div>
        </div>

        {/* ONDAS DE CHOQUE */}
        {[0, 0.1, 0.2].map((delay, index) => (
          <motion.div
            key={index}
            animate={{ scale: [1, 2], opacity: [0, 0.4, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, repeatDelay: duration + repeatDelay - 0.8, delay: delay + 0.3, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border border-ceniza/40"
          />
        ))}
      </div>

      {/* TEXTO: text-4xl en móvil, text-5xl en desktop */}
      <motion.div
        initial={{ opacity: 0, filter: "blur(15px)", scale: 0.9 }}
        animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
        transition={{ duration: 1.8, ease: "easeOut" }}
        className="text-center"
      >
        <h1 className="text-4xl sm:text-5xl font-black italic text-ceniza tracking-tighter uppercase">
          FIGHT <span className="text-fuego drop-shadow-[0_0_20px_rgba(255,68,0,0.7)]">CLUB</span>
        </h1>
        <p className="text-oro/40 text-[7px] sm:text-[9px] tracking-[0.5em] sm:tracking-[0.7em] uppercase font-bold mt-2 sm:mt-3">
          Online Battle
        </p>
      </motion.div>
    </div>
  )
}