import React, { useRef, useEffect } from 'react';
import type { Fight } from '../types/fight';
import backgroundImage from '../../../assets/Background.jpeg'; 

interface Props {
    gameState: Fight | null;
}

const ArenaCanvas: React.FC<Props> = ({ gameState }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !gameState) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const imgFondo = new Image();
        imgFondo.src = backgroundImage;

        const render = () => {
            // Dibujar Fondo
            ctx.drawImage(imgFondo, 0, 0, canvas.width, canvas.height);

            // Dibujar Player 1
            ctx.fillStyle = "#3b82f6";
            ctx.fillRect(gameState.player1.posX, gameState.player1.posY, 50, 100);

            // Dibujar Player 2
            ctx.fillStyle = "#ef4444";
            ctx.fillRect(gameState.player2.posX, gameState.player2.posY, 50, 100);

            requestAnimationFrame(render);
        };

        imgFondo.onload = () => render();
    }, [gameState]);

    return <canvas ref={canvasRef} width={800} height={400} className="rounded-lg shadow-2xl border-4 border-zinc-800" />;
};

export default ArenaCanvas;