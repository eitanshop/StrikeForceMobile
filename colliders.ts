import { Vector3 } from 'three';

export interface Collider {
  minX: number; maxX: number;
  minY: number; maxY: number;
  minZ: number; maxZ: number;
}

export const colliders: Collider[] = [
  // Bounds of level (to keep the player inside)
  // Perimeter Walls (Wall position: [0, 2.5, -25], args: [50, 5, 1]) -> minX: -25, maxX: 25, z: [-25.5, -24.5]
  { minX: -25, maxX: 25, minY: 0, maxY: 5, minZ: -25.5, maxZ: -24.5 },
  // Perimeter Wall (Wall position: [0, 2.5, 25], args: [50, 5, 1]) -> minX: -25, maxX: 25, z: [24.5, 25.5]
  { minX: -25, maxX: 25, minY: 0, maxY: 5, minZ: 24.5, maxZ: 25.5 },
  // Perimeter Wall (Wall position: [-25, 2.5, 0], args: [1, 5, 50]) -> x: [-25.5, -24.5], z: [-25, 25]
  { minX: -25.5, maxX: -24.5, minY: 0, maxY: 5, minZ: -25, maxZ: 25 },
  // Perimeter Wall (Wall position: [25, 2.5, 0], args: [1, 5, 50]) -> x: [24.5, 25.5], z: [-25, 25]
  { minX: 24.5, maxX: 25.5, minY: 0, maxY: 5, minZ: -25, maxZ: 25 },

  // Obstacles
  // Wall position: [-10, 2, -10], args: [8, 4, 1] -> x: [-14, -6], y: [0, 4], z: [-10.5, -9.5]
  { minX: -14, maxX: -6, minY: 0, maxY: 4, minZ: -10.5, maxZ: -9.5 },
  // Wall position: [10, 2, 10], args: [8, 4, 1] -> x: [6, 14], y: [0, 4], z: [9.5, 10.5]
  { minX: 6, maxX: 14, minY: 0, maxY: 4, minZ: 9.5, maxZ: 10.5 },

  // Crates
  // Crate position: [5, 1, 0], args: [2, 2, 2] -> x: [4, 6], y: [0, 2], z: [-1, 1]
  { minX: 4, maxX: 6, minY: 0, maxY: 2, minZ: -1, maxZ: 1 },
  // Crate position: [5, 3, 0], args: [2, 2, 2] -> x: [4, 6], y: [2, 4], z: [-1, 1]
  { minX: 4, maxX: 6, minY: 2, maxY: 4, minZ: -1, maxZ: 1 },
  // Crate position: [3, 1, 0], args: [2, 2, 2] -> x: [2, 4], y: [0, 2], z: [-1, 1]
  { minX: 2, maxX: 4, minY: 0, maxY: 2, minZ: -1, maxZ: 1 },
  // Crate position: [-15, 1, -15], args: [3, 2, 3] -> x: [-16.5, -13.5], y: [0, 2], z: [-16.5, -13.5]
  { minX: -16.5, maxX: -13.5, minY: 0, maxY: 2, minZ: -16.5, maxZ: -13.5 }
];

export function resolveCollision(pos: Vector3, radius: number, height: number = 1.8): Vector3 {
  const nextPos = pos.clone();

  // Perimeter boundary clamp to absolutely prevent any boundary clipping
  if (nextPos.x - radius < -24.5) nextPos.x = -24.5 + radius;
  if (nextPos.x + radius > 24.5) nextPos.x = 24.5 - radius;
  if (nextPos.z - radius < -24.5) nextPos.z = -24.5 + radius;
  if (nextPos.z + radius > 24.5) nextPos.z = 24.5 - radius;

  // Resolve with box obstacles
  for (const c of colliders) {
    if (nextPos.y < c.maxY && nextPos.y + height > c.minY) {
      const closestX = Math.max(c.minX, Math.min(nextPos.x, c.maxX));
      const closestZ = Math.max(c.minZ, Math.min(nextPos.z, c.maxZ));

      const dx = nextPos.x - closestX;
      const dz = nextPos.z - closestZ;
      const distXZ = Math.sqrt(dx * dx + dz * dz);

      if (distXZ < radius) {
        if (distXZ === 0) {
          const leftX = nextPos.x - c.minX;
          const rightX = c.maxX - nextPos.x;
          const backZ = nextPos.z - c.minZ;
          const frontZ = c.maxZ - nextPos.z;
          const minOverlap = Math.min(leftX, rightX, backZ, frontZ);
          if (minOverlap === leftX) nextPos.x -= radius;
          else if (minOverlap === rightX) nextPos.x += radius;
          else if (minOverlap === backZ) nextPos.z -= radius;
          else nextPos.z += radius;
        } else {
          const overlap = radius - distXZ;
          nextPos.x += (dx / distXZ) * overlap;
          nextPos.z += (dz / distXZ) * overlap;
        }
      }
    }
  }

  // Floor constraint
  if (nextPos.y < 0) {
    nextPos.y = 0;
  }

  return nextPos;
}
