import React, { useState, useEffect, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useFBX } from '@react-three/drei';
import { useGameStore } from '../store';
import { Mesh, MeshStandardMaterial } from 'three';

const Wall = (props: any) => {
  return (
    <mesh position={props.position} castShadow receiveShadow>
      <boxGeometry args={props.args} />
      <meshStandardMaterial color={props.color || "#c2b280"} roughness={0.8} />
    </mesh>
  );
};

const Crate = (props: any) => {
  return (
    <mesh position={props.position} castShadow receiveShadow>
      <boxGeometry args={props.args} />
      <meshStandardMaterial color="#8B4513" roughness={0.6} />
    </mesh>
  );
};

const Floor = (props: any) => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={props.position || [0,0,0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#d6c68b" roughness={1} />
    </mesh>
  );
};

// A door that opens when all enemies are killed
const Door = ({ position, rotation, levelObjectiveMet }: { position: [number, number, number], rotation?: [number, number, number], levelObjectiveMet: boolean }) => {
  const [openAmount, setOpenAmount] = useState(0);

  useFrame((state, delta) => {
    if (levelObjectiveMet && openAmount < 1) {
      setOpenAmount(Math.min(1, openAmount + delta * 2)); // open speed
    }
  });

  return (
    <mesh position={[position[0], position[1] + openAmount * 5, position[2]]} rotation={rotation} castShadow receiveShadow>
      <boxGeometry args={[4, 5, 0.5]} />
      <meshStandardMaterial color={levelObjectiveMet ? "#00ff00" : "#ff0000"} metalness={0.8} roughness={0.2} />
    </mesh>
  );
};

const CityModel = () => {
  const fbx = useFBX('/city.fbx');
  
  // Clone to safely mutate materials
  const cloned = useMemo(() => fbx.clone(), [fbx]);

  useEffect(() => {
    if (cloned) {
      cloned.traverse((child) => {
        if ((child as Mesh).isMesh) {
          const mesh = child as Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          // Apply a generic standard material so it responds to lighting propery and isn't black
          mesh.material = new MeshStandardMaterial({ color: '#cccccc', roughness: 1.0, metalness: 0.0 });
        }
      });
    }
  }, [cloned]);

  return <primitive object={cloned} scale={[0.1, 0.1, 0.1]} />;
};

export const Level = () => {
  const level = useGameStore(s => s.level);
  const enemiesTotal = useGameStore(s => s.enemiesTotal);
  const enemiesKilled = useGameStore(s => s.enemiesKilled);
  
  const levelObjectiveMet = enemiesTotal > 0 && enemiesKilled >= enemiesTotal;

  if (level === 1) {
    return (
      <group>
        <Floor />
        
        {/* Placeholder perimeter so player doesn't fall off */}
        <Wall position={[0, 2.5, -25]} args={[50, 5, 1]} color="#888" />
        <Wall position={[0, 2.5, 25]} args={[50, 5, 1]} color="#888" />
        <Wall position={[-25, 2.5, 0]} args={[1, 5, 50]} color="#888" />
        <Wall position={[25, 2.5, 0]} args={[1, 5, 50]} color="#888" />

        <CityModel />
        <Door position={[0, 2.5, -24.5]} levelObjectiveMet={levelObjectiveMet} />
      </group>
    );
  }

  // Level 2+
  return (
    <group>
      <Floor />
      
      {/* Perimeter Walls */}
      <Wall position={[0, 2.5, -25]} args={[50, 5, 1]} />
      <Wall position={[0, 2.5, 25]} args={[50, 5, 1]} />
      <Wall position={[-25, 2.5, 0]} args={[1, 5, 50]} />
      <Wall position={[25, 2.5, 0]} args={[1, 5, 50]} />

      {/* Internal Rooms */}
      <Wall position={[-10, 2.5, 0]} args={[30, 5, 1]} />
      <Door position={[10, 2.5, 0]} levelObjectiveMet={levelObjectiveMet} />

      {/* Obstacles */}
      <Crate position={[5, 1, 10]} args={[2, 2, 2]} />
      <Crate position={[5, 3, 10]} args={[2, 2, 2]} />
      <Crate position={[3, 1, 10]} args={[2, 2, 2]} />
      <Crate position={[-15, 1, -15]} args={[3, 2, 3]} />
    </group>
  );
};