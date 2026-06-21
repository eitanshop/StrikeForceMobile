import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Vector3, Group, Quaternion } from 'three';
import { controlsRef, useGameStore } from '../store';

interface WeaponProps {
    flash: number;
}

export const Weapon: React.FC<WeaponProps> = ({ flash }) => {
  const group = useRef<Group>(null);
  const recoilAnim = useRef(0);
  const ammo = useGameStore((state) => state.ammo);
  const { camera } = useThree();

  // We use a high priority to ensure this runs after the Player/Camera update
  useFrame((state, delta) => {
    if (!group.current) return;

    // Bobbing while moving
    const isMoving = Math.abs(controlsRef.current.moveX) > 0.1 || Math.abs(controlsRef.current.moveY) > 0.1;
    const time = state.clock.getElapsedTime();
    
    const targetBobY = isMoving ? Math.sin(time * 10) * 0.02 : 0;
    const targetBobX = isMoving ? Math.cos(time * 5) * 0.01 : 0;

    // Recoil recovery
    if (controlsRef.current.shoot && ammo > 0) {
        recoilAnim.current = 0.1; 
    }
    recoilAnim.current = Math.max(0, recoilAnim.current - delta * 2);

    // Calculate relative position
    // Base offset from camera: [0.2, -0.3, -0.5]
    const offset = new Vector3(
        0.2 + targetBobX, 
        -0.3 + targetBobY, 
        -0.5 + recoilAnim.current
    );
    
    // Apply camera rotation to offset
    offset.applyQuaternion(camera.quaternion);

    // Set final position: Camera Pos + Rotated Offset
    group.current.position.copy(camera.position).add(offset);
    
    // Set rotation: Copy camera rotation + sway
    group.current.quaternion.copy(camera.quaternion);
    
    // Add sway (weapon lag)
    const swayQ = new Quaternion();
    swayQ.setFromAxisAngle(new Vector3(0,0,1), -controlsRef.current.moveX * 0.1);
    group.current.quaternion.multiply(swayQ);

  });

  return (
    <group ref={group} dispose={null}>
      {/* Gun Body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.1, 0.15, 0.6]} />
        <meshStandardMaterial color="#333" roughness={0.5} metalness={0.8} />
      </mesh>
      
      {/* Barrel */}
      <mesh position={[0, 0.05, -0.45]}>
        <boxGeometry args={[0.04, 0.04, 0.4]} />
        <meshStandardMaterial color="#111" />
      </mesh>

      {/* Magazine */}
      <mesh position={[0, -0.1, 0.1]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.08, 0.2, 0.15]} />
        <meshStandardMaterial color="#222" />
      </mesh>

      {/* Scope/Sights */}
      <mesh position={[0, 0.1, 0.1]}>
        <boxGeometry args={[0.06, 0.05, 0.2]} />
        <meshStandardMaterial color="#444" />
      </mesh>

      {/* Muzzle Flash */}
      {flash > 0 && (
          <pointLight position={[0, 0.1, -0.6]} intensity={5} color="orange" distance={5} decay={2} />
      )}
      <object3D name="muzzle" position={[0, 0.05, -0.65]} />
    </group>
  );
};