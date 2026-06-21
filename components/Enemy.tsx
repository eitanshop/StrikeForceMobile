import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Mesh } from 'three';
import { useGameStore } from '../store';
import { resolveCollision } from '../colliders';

interface EnemyProps {
  position: [number, number, number];
  playerPos: Vector3;
}

export const Enemy: React.FC<EnemyProps> = ({ position, playerPos }) => {
  const [health, setHealth] = useState(100);
  const [dead, setDead] = useState(false);
  const actions = useGameStore(state => state.actions);
  const meshRef = useRef<Mesh>(null);

  // Define hit handler
  const onHit = (damage: number = 35) => {
    if (!dead) {
      setHealth(h => h - damage);
    }
  };

  React.useEffect(() => {
    if (health <= 0 && !dead && meshRef.current) {
      setDead(true);
      actions.addScore(100);
      
      const pos = meshRef.current.position;
      
      // Add explosion effect
      actions.addExplosion({ position: [pos.x, pos.y, pos.z], time: Date.now() });
      
      // Add blood decal
      actions.addDecal({
        position: [pos.x, 0.05, pos.z],
        normal: [0, 1, 0],
        color: 'red',
        size: 2 + Math.random() * 2
      });
      
      // Spawn body parts
      for (let i = 0; i < 4; i++) {
        actions.addBodyPart({
          position: [pos.x, pos.y + 1, pos.z],
          velocity: [
            (Math.random() - 0.5) * 10,
            Math.random() * 10 + 5,
            (Math.random() - 0.5) * 10
          ],
          rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
          time: Date.now()
        });
      }
    }
  }, [health, dead, actions]);

  const lastAttack = useRef(0);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.1);

    if (dead) {
        // Sink into ground effect
        if (meshRef.current.position.y > -0.9) {
          meshRef.current.position.y -= 0.5 * dt;
        }
        const currentScale = meshRef.current.scale;
        if (currentScale.y > 0.1) {
             meshRef.current.scale.set(currentScale.x * 0.95, currentScale.y * 0.95, currentScale.z * 0.95);
        }
        return;
    }

    // Simple AI: Move towards player
    const enemyPos = meshRef.current.position;
    
    const direction = new Vector3().subVectors(playerPos, enemyPos);
    direction.y = 0; // Lock to dynamic flat movement plane
    const dist = direction.length();

    if (dist < 15 && dist > 1.5) {
        direction.normalize().multiplyScalar(2 * dt); // Move speed = 2
        meshRef.current.position.add(direction);
    }

    // Gravity for Enemy
    if (meshRef.current.position.y > 1.0) {
        meshRef.current.position.y -= 9.8 * dt;
    } else {
        meshRef.current.position.y = 1.0; // Rest exactly on ground (center height of 2/2 = 1.0)
    }

    // Solve obstacle collision
    const resolved = resolveCollision(meshRef.current.position, 0.5, 2.0);
    meshRef.current.position.x = resolved.x;
    meshRef.current.position.z = resolved.z;

    // Look at player
    meshRef.current.lookAt(playerPos.x, meshRef.current.position.y, playerPos.z);

    // Attack
    if (dist < 2.5 && Date.now() - lastAttack.current > 1000) {
        lastAttack.current = Date.now();
        actions.takeDamage(10);
    }
  });

  if (dead && health <= -100) return null; // Despawn eventually

  return (
    <mesh 
      ref={meshRef} 
      castShadow 
      receiveShadow
      position={position}
      // CRITICAL: Attach userData to the MESH so the Raycaster can see it
      userData={{ type: 'enemy', onHit }} 
    >
      <boxGeometry args={[1, 2, 1]} />
      <meshStandardMaterial color={dead ? "red" : "#5e4b35"} />
      {/* Enemy Eyes/Visor */}
      <mesh position={[0, 0.5, 0.51]}>
         <planeGeometry args={[0.8, 0.2]} />
         <meshBasicMaterial color={dead ? "black" : "red"} />
      </mesh>
    </mesh>
  );
};