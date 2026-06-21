import React from 'react';

const Wall = (props: any) => {
  return (
    <mesh position={props.position} castShadow receiveShadow>
      <boxGeometry args={props.args} />
      <meshStandardMaterial color="#c2b280" roughness={0.8} />
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

export const Level = () => {
  return (
    <group>
      <Floor />
      
      {/* Perimeter Walls */}
      <Wall position={[0, 2.5, -25]} args={[50, 5, 1]} />
      <Wall position={[0, 2.5, 25]} args={[50, 5, 1]} />
      <Wall position={[-25, 2.5, 0]} args={[1, 5, 50]} />
      <Wall position={[25, 2.5, 0]} args={[1, 5, 50]} />

      {/* Obstacles */}
      <Wall position={[-10, 2, -10]} args={[8, 4, 1]} />
      <Wall position={[10, 2, 10]} args={[8, 4, 1]} />
      
      <Crate position={[5, 1, 0]} args={[2, 2, 2]} />
      <Crate position={[5, 3, 0]} args={[2, 2, 2]} />
      <Crate position={[3, 1, 0]} args={[2, 2, 2]} />

      <Crate position={[-15, 1, -15]} args={[3, 2, 3]} />
    </group>
  );
};