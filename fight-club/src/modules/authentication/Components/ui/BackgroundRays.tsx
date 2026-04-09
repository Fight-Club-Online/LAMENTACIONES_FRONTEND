import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const RAY_COUNT = 200

function LightningBolt({ speed, x, z }: Readonly<{ speed: number; x: number; z: number }>) {
  const meshRef = useRef<THREE.Mesh>(null!)
  
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
    meshRef.current.position.y -= speed * delta
    meshRef.current.position.x -= speed * 0.46 * delta

    if (meshRef.current.position.y < -8) {
      meshRef.current.position.y = 8 + Math.random() * 5
      meshRef.current.position.x = (Math.random() - 0.5) * 20
    }

    const t = (state.clock.elapsedTime + x) * 2.5
    const cycle = t % 4
    let opacity = 0.05

    if (cycle < 0.15 || (cycle > 0.3 && cycle < 0.45)) {
      opacity = 0.9
    }

    const material = meshRef.current.material as THREE.MeshBasicMaterial
    material.opacity = opacity
  })

  return (
    <mesh 
      ref={meshRef} 
      position={[x, 0, z]} 
      scale={0.8} 
      rotation={[0, 0, -Math.PI / 7]}
    >
      <shapeGeometry args={[shape]} />
      <meshBasicMaterial 
        color="#FF5500" 
        transparent 
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

function LightningField() {
  const rays = useMemo(() => {
    return Array.from({ length: RAY_COUNT }, () => ({
      speed: 1.5 + Math.random() * 2,
      x: (Math.random() - 0.5) * 25,
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
    background: 'radial-gradient(circle, #331100 0%, #050505 100%)' 
  }}>
    <Canvas
      camera={{ position: [0, 0, 8], fov: 45 }}
      gl={{ antialias: true }}
    >
      <color attach="background" args={['#0d0600']} />
      <fog attach="fog" args={['#0d0600', 5, 15]} />
      <LightningField />
    </Canvas>
  </div>
)