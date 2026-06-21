import React, { useState, useEffect, Suspense, useRef } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { Player } from './Player';
import { Level } from './Level';
import { Enemy } from './Enemy';
import { Vector3, Quaternion, Mesh } from 'three';
import { useGameStore } from '../store';

const Effects = () => {
  const decals = useGameStore(s => s.decals);
  const bullets = useGameStore(s => s.bullets);
  const explosions = useGameStore(s => s.explosions);
  const bodyParts = useGameStore(s => s.bodyParts);
  const updateBodyParts = useGameStore(s => s.actions.updateBodyParts);
  const [, setTick] = useState(0);

  // Force re-render for bullet animation & local physics
  useFrame((state, delta) => {
    let needsUpdate = false;
    
    // Animate body parts
    if (bodyParts.length > 0) {
      const g = -20 * delta;
      let updated = false;
      const newParts = bodyParts.map(p => {
        if (p.position[1] <= 0) return p; // Reached ground
        updated = true;
        const nv = [p.velocity[0], p.velocity[1] + g, p.velocity[2]] as [number, number, number];
        const nx = p.position[0] + nv[0] * delta;
        let ny = p.position[1] + nv[1] * delta;
        const nz = p.position[2] + nv[2] * delta;
        
        let nr = [...p.rotation] as [number, number, number];
        if (ny > 0) {
           nr[0] += nv[0] * delta;
           nr[1] += nv[1] * delta;
           nr[2] += nv[2] * delta;
        } else {
           ny = 0; // stop falling
        }

        return { ...p, position: [nx, ny, nz], velocity: nv, rotation: nr } as typeof p;
      });
      if (updated) {
        updateBodyParts(newParts);
      }
    }

    if (bullets.length > 0 || explosions.length > 0) {
      setTick(t => t + 1);
    }
  });

  const now = Date.now();

  return (
    <group>
      {decals.map((d) => {
        const pos = new Vector3(...d.position);
        const norm = new Vector3(...d.normal);
        pos.add(norm.clone().multiplyScalar(0.01));
        const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), norm);

        return (
          <mesh key={d.id} position={pos} quaternion={quaternion}>
            <circleGeometry args={[d.size || 0.08, 8]} />
            <meshBasicMaterial color={d.color || "#111"} transparent opacity={0.8} depthWrite={false} />
          </mesh>
        );
      })}

      {bullets.map((b) => {
        const timePassed = now - b.time;
        if (timePassed > 150) return null;
        const t = timePassed / 150;
        
        const start = new Vector3(...b.start);
        const end = new Vector3(...b.end);
        const currentPos = new Vector3().lerpVectors(start, end, t);
        
        const length = start.distanceTo(end);
        const dir = new Vector3().subVectors(end, start).normalize();
        
        // Handle vector fallback for 0 length
        if (dir.lengthSq() < 0.001) dir.set(0, 1, 0);

        const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), dir);

        return (
          <mesh key={b.id} position={currentPos} quaternion={quaternion}>
            <cylinderGeometry args={[0.02, 0.02, length * 0.2, 4]} />
            <meshBasicMaterial color={b.color || "yellow"} />
          </mesh>
        );
      })}

      {explosions.map(e => {
        const t = (now - e.time) / 500;
        if (t > 1) return null;
        const s = 1 + t * 4;
        const o = 1 - t;
        return (
          <mesh key={e.id} position={e.position} scale={[s, s, s]}>
            <sphereGeometry args={[1, 16, 16]} />
            <meshBasicMaterial color="orange" transparent opacity={o} />
          </mesh>
        );
      })}

      {bodyParts.map(p => {
        // Disappear after 10s
        if (now - p.time > 10000) return null;
        return (
          <mesh key={p.id} position={p.position} rotation={p.rotation as any}>
            <boxGeometry args={[0.5, 0.5, 0.5]} />
            <meshStandardMaterial color="red" />
          </mesh>
        );
      })}
    </group>
  );
};

const EnemySpawner = () => {
    const { camera } = useThree();
    const [playerPos, setPlayerPos] = useState(new Vector3());
    const isPlaying = useGameStore(s => s.isPlaying);
    const score = useGameStore(s => s.score);

    // Dynamic enemy spawning
    const [enemies, setEnemies] = useState<{id: number, pos: [number, number, number]}[]>([
        {id: 1, pos: [10, 2, -20]},
        {id: 2, pos: [-10, 2, -20]},
        {id: 3, pos: [-15, 2, 15]},
        {id: 4, pos: [20, 2, 0]},
        {id: 5, pos: [0, 2, 20]},
    ]);
    const nextEnemyId = useRef(6);

    useEffect(() => {
        const interval = setInterval(() => {
            if (camera) {
                setPlayerPos(new Vector3().copy(camera.position));
            }
        }, 500);
        return () => clearInterval(interval);
    }, [camera]);

    useEffect(() => {
        if (!isPlaying) return;
        const spawner = setInterval(() => {
            setEnemies(current => {
                // If we've spawned less than 30 overall (or currently alive)
                if (current.length < 30) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 25 + Math.random() * 15;
                    const rx = playerPos.x + Math.cos(angle) * distance;
                    const rz = playerPos.z + Math.sin(angle) * distance;
                    return [...current, { id: nextEnemyId.current++, pos: [rx, 2, rz] }];
                }
                return current;
            });
        }, 1500); 
        return () => clearInterval(spawner);
    }, [isPlaying, playerPos]);

    if (!isPlaying) return null;

    return (
        <group>
            {enemies.map((e) => (
                <Enemy key={e.id} position={e.pos} playerPos={playerPos} />
            ))}
        </group>
    )
}

class ErrorBoundary extends React.Component<any, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-10 text-red-500 bg-black absolute inset-0 z-50"><h1>Canvas Crashed</h1><pre>{String(this.state.error)}</pre></div>;
    }
    return this.props.children;
  }
}

export const Game = () => {
  return (
    <div className="absolute inset-0 w-full h-full bg-slate-900">
      <ErrorBoundary>
        <Canvas 
          shadows 
          camera={{ fov: 75, position: [0, 5, 10] }} 
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          gl={{ antialias: true }}
        >
        <Suspense fallback={null}>
          <Sky sunPosition={[100, 20, 100]} turbidity={0.1} rayleigh={0.5} />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />
          <directionalLight 
            position={[-5, 10, 5]} 
            intensity={0.8} 
            castShadow 
            shadow-mapSize={[1024, 1024]}
          />
          
          <Player />
          <Level />
          <EnemySpawner />
          <Effects />
        </Suspense>
        </Canvas>
      </ErrorBoundary>
    </div>
  );
};