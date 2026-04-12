import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const RAY_COUNT = 350 

function LightningBolt({ speed, x, z }: Readonly<{ speed: number; x: number; z: number }>) {
  const groupRef = useRef<THREE.Group>(null!)
  const blueMaterialRef = useRef<THREE.MeshBasicMaterial>(null!)
  const orangeMaterialRef = useRef<THREE.MeshBasicMaterial>(null!)
  
  const shape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0.4)      
    s.lineTo(-0.12, 0)    
    s.lineTo(0.04, 0)     
    s.lineTo(-0.08, -0.6) 
    s.lineTo(0.12, -0.1) 
    s.lineTo(-0.04, -0.1)
    s.closePath()
    return s
  }, [])

  useFrame((state, delta) => {
    const group = groupRef.current
    if(!group) return

    group.position.y -= speed * delta
    group.position.x -= speed * 0.46 * delta

    if (group.position.y < -8) {
      group.position.y = 8 + Math.random() * 5
      group.position.x = (Math.random() - 0.5) * 20
    }

    // Lógica de parpadeo (Flicker)
    const t = (state.clock.elapsedTime + x) * 1.0
    const cycle = t % 4
    
    let opacityBlue = 0.02
    let opacityOrange = 0.01

    if (cycle < 0.15 || (cycle > 0.3 && cycle < 0.45)) {
      opacityBlue = 1.0    
      opacityOrange = 0.4  
    }

    if (blueMaterialRef.current) blueMaterialRef.current.opacity = opacityBlue
    if (orangeMaterialRef.current) orangeMaterialRef.current.opacity = opacityOrange
  })

  return (
    <group 
      ref={groupRef} 
      position={[x, 0, z]} 
      rotation={[0, 0, -Math.PI / 7]}
    >
      {/* 1. EL "GLOW" NARANJA (Atrás y más grande) */}
      <mesh scale={1.2}> 
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial 
          ref={orangeMaterialRef}
          color="#00bfff" 
          transparent 
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending} 
          depthWrite={false}
        />
      </mesh>

      {/* 2. EL RAYO AZUL NÚCLEO  */}
      <mesh scale={0.8}>
        <shapeGeometry args={[shape]} />
        <meshBasicMaterial 
          ref={blueMaterialRef}
          color="#df401d" 
          transparent 
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  )
}

function LightningField() {
  const rays = useMemo(() => {
    return Array.from({ length: RAY_COUNT }, () => ({
      speed: 1.5 + Math.random() * 2, 
      x: (Math.random() - 0.5) * 30,  
      z: (Math.random() - 0.5) * 10
    }))
  }, [])

  return (
    <group>
      {rays.map((props, i) => (
        <LightningBolt key={i} {...props} />
      ))}
    </group>
  )
}

export const BackgroundRays = () => (
  <div style={{ 
    position: 'fixed', 
    inset: 0, 
    zIndex: 0, 
    pointerEvents: 'none', 
    background: 'radial-gradient(circle, #201000 0%, #000000 100%)' 
  }}>
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ antialias: true, toneMapping: THREE.ReinhardToneMapping }} // ToneMapping ayuda a los colores intensos
      dpr={[1, 2]} 
    >
      {/* Niebla oscura para dar profundidad */}
      <fog attach="fog" args={['#000000', 5, 15]} />
      <LightningField />
    </Canvas>
  </div>
)