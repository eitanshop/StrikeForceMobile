import React, { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Vector3, Raycaster, Matrix3 } from 'three';
import { controlsRef, useGameStore } from '../store';
import { Weapon } from './Weapon';
import { resolveCollision } from '../colliders';
import { sfx } from '../sfx';

const SHOOT_DELAYS = {
  rifle: 150,
  laser: 50,
  plasma: 600,
};

const WEAPON_DAMAGE = {
  rifle: 35,
  laser: 10,
  plasma: 100,
};

const WEAPON_COLOR = {
  rifle: 'yellow',
  laser: '#00ff00',
  plasma: '#ff00ff',
};

export const Player = () => {
  const { camera, scene } = useThree();
  const playerPosition = useRef(new Vector3(0, 0, 10));
  const velocityY = useRef(0);
  const lastShootTime = useRef(0);
  const actions = useGameStore((state) => state.actions);
  const ammo = useGameStore((state) => state.ammo);
  const weapon = useGameStore((state) => state.weapon);

  const raycaster = useRef(new Raycaster());
  
  // Flash effect
  const [flash, setFlash] = useState(0);

  // Desktop controls fallbacks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'KeyW': controlsRef.current.moveY = 1; break;
        case 'KeyS': controlsRef.current.moveY = -1; break;
        case 'KeyA': controlsRef.current.moveX = -1; break;
        case 'KeyD': controlsRef.current.moveX = 1; break;
        case 'Space': controlsRef.current.jump = true; break;
        case 'KeyR': actions.reload(); break;
        case 'Digit1': actions.setWeapon('rifle'); break;
        case 'Digit2': actions.setWeapon('laser'); break;
        case 'Digit3': actions.setWeapon('plasma'); break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch(e.code) {
        case 'KeyW': if (controlsRef.current.moveY > 0) controlsRef.current.moveY = 0; break;
        case 'KeyS': if (controlsRef.current.moveY < 0) controlsRef.current.moveY = 0; break;
        case 'KeyA': if (controlsRef.current.moveX < 0) controlsRef.current.moveX = 0; break;
        case 'KeyD': if (controlsRef.current.moveX > 0) controlsRef.current.moveX = 0; break;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Only shoot if clicking on the canvas / active area
      if (document.pointerLockElement || e.target instanceof HTMLCanvasElement || (e.target as HTMLElement).tagName === 'DIV' && (e.target as HTMLElement).classList.contains('touch-none')) {
        controlsRef.current.shoot = true;
      }
    };

    const handleMouseUp = () => {
      controlsRef.current.shoot = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement) {
        controlsRef.current.lookX -= e.movementX * 0.002;
        controlsRef.current.lookY -= e.movementY * 0.002;
        controlsRef.current.lookY = Math.max(-1.5, Math.min(1.5, controlsRef.current.lookY));
      }
    };

    const handleCanvasClick = () => {
      const canvasEl = document.querySelector('canvas');
      if (canvasEl) {
        canvasEl.requestPointerLock?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove);
    
    const canvasEl = document.querySelector('canvas');
    if (canvasEl) {
      canvasEl.addEventListener('click', handleCanvasClick);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove);
      if (canvasEl) {
        canvasEl.removeEventListener('click', handleCanvasClick);
      }
    };
  }, []);

    const handleShooting = () => {
    if (controlsRef.current.shoot && ammo > 0) {
      if (Date.now() - lastShootTime.current > SHOOT_DELAYS[weapon]) {
        lastShootTime.current = Date.now();
        actions.decrementAmmo();
        setFlash(3); // Show muzzle flash for 3 frames
        
        sfx.playShoot(weapon);

        // Raycast shooting
        raycaster.current.setFromCamera({ x: 0, y: 0 }, camera);
        // Intersect with everything in scene to find enemies
        const intersects = raycaster.current.intersectObjects(scene.children, true);
        
        const hit = intersects.find(i => i.object.userData && i.object.userData.type === 'enemy');
        if (hit && hit.object.userData.onHit) {
          hit.object.userData.onHit(WEAPON_DAMAGE[weapon]);
          sfx.playHitEnemy();
        }

        const anyHit = intersects[0];
        
        let startPos: [number, number, number] = [camera.position.x, camera.position.y - 0.2, camera.position.z];
        const muzzle = scene.getObjectByName('muzzle');
        if (muzzle) {
          const muzzleWorldPos = new Vector3();
          muzzle.getWorldPosition(muzzleWorldPos);
          startPos = [muzzleWorldPos.x, muzzleWorldPos.y, muzzleWorldPos.z];
        }
        
        if (anyHit) {
          // Bullet goes up to the hit point
          actions.addBullet({
            start: startPos,
            end: [anyHit.point.x, anyHit.point.y, anyHit.point.z],
            time: Date.now(),
            color: WEAPON_COLOR[weapon]
          });

          // Add decal if it hit environment or enemy
          // Don't spawn decals on enemies, as they disappear/move
          const isEnemy = anyHit.object.userData?.type === 'enemy' || (anyHit.object.parent && anyHit.object.parent.userData?.type === 'enemy');
          
          if (!isEnemy) {
            const normalMatrix = new Matrix3().getNormalMatrix(anyHit.object.matrixWorld);
            const worldNormal = anyHit.face ? anyHit.face.normal.clone().applyMatrix3(normalMatrix).normalize() : new Vector3(0, 1, 0);

            let decalSize = 0.08;
            let decalColor = '#111';
            if (weapon === 'laser') {
              decalSize = 0.05;
              decalColor = '#00ff00';
            } else if (weapon === 'plasma') {
              decalSize = 0.4;
              decalColor = '#ff00ff';
            }

            actions.addDecal({
              position: [anyHit.point.x, anyHit.point.y, anyHit.point.z],
              normal: [worldNormal.x, worldNormal.y, worldNormal.z],
              size: decalSize,
              color: decalColor
            });
            sfx.playHitWall();
            
            // explosion for plasma
            if (weapon === 'plasma') {
              actions.addExplosion({ position: [anyHit.point.x, anyHit.point.y, anyHit.point.z], time: Date.now() });
              sfx.playExplosion();
            }
          }
        } else {
          // Shoot into distance
          const dir = new Vector3();
          camera.getWorldDirection(dir);
          dir.multiplyScalar(100).add(camera.position);
          actions.addBullet({
            start: startPos,
            end: [dir.x, dir.y, dir.z],
            time: Date.now(),
            color: WEAPON_COLOR[weapon]
          });
        }
      }
    } else if (ammo <= 0) {
        controlsRef.current.shoot = false; // Reset trigger if out of ammo
    }
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1); // Limit large delta jumps

    // 1. Camera Rotation (Look)
    camera.rotation.order = 'YXZ';
    camera.rotation.y = controlsRef.current.lookX;
    camera.rotation.x = controlsRef.current.lookY;

    // 2. Movement Calculation
    // For frontVector, negative Z is forward in Three.js
    const frontVector = new Vector3(0, 0, -controlsRef.current.moveY); 
    const sideVector = new Vector3(controlsRef.current.moveX, 0, 0); 
    const direction = new Vector3();

    // Calculate move direction relative to current camera looking direction
    direction
      .addVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(5); // Speed multiplier

    // Apply rotation only on camera Y orientation
    const camEulerY = camera.rotation.y;
    direction.applyAxisAngle(new Vector3(0, 1, 0), camEulerY);

    // 3. Gravity and Jumping physics
    const isOnGround = playerPosition.current.y <= 0.05 && velocityY.current <= 0;
    if (isOnGround) {
      playerPosition.current.y = 0;
      velocityY.current = 0;
      if (controlsRef.current.jump) {
        velocityY.current = 5.5; // Jump velocity
        controlsRef.current.jump = false;
      }
    } else {
      velocityY.current -= 18.0 * dt; // Gravity
    }

    // Apply translation
    playerPosition.current.x += direction.x * dt;
    playerPosition.current.y += velocityY.current * dt;
    playerPosition.current.z += direction.z * dt;

    if (isOnGround && direction.lengthSq() > 0.01) {
      sfx.playFootstep();
    }

    // 4. Resolve level collider hit and sliding
    const resolved = resolveCollision(playerPosition.current, 0.5);
    playerPosition.current.copy(resolved);

    const level = useGameStore.getState().level;
    const enemiesTotal = useGameStore.getState().enemiesTotal;
    const enemiesKilled = useGameStore.getState().enemiesKilled;
    
    // Check level progression win condition
    if (enemiesTotal > 0 && enemiesKilled >= enemiesTotal) {
      let doorPos = new Vector3(0, 0, -24.5);
      if (level > 1) {
        doorPos = new Vector3(10, 0, 0);
      }
      
      // If close to door, advance level
      const dToDoor = playerPosition.current.distanceTo(doorPos);
      if (dToDoor < 3.0) {
        actions.nextLevel();
        // Reset player pos
        playerPosition.current.set(0, 0, 10);
      }
    }

    // 5. Sync Camera to Physics Body (eye height is 1.6 above ground)
    camera.position.set(playerPosition.current.x, playerPosition.current.y + 1.6, playerPosition.current.z);

    // 6. Shooting
    handleShooting();
    
    // Muzzle flash decay
    if (flash > 0) setFlash(f => f - 1);
  });

  return (
    <>
      {/* Logic only, render weapon pinned relative to camera */}
      <Weapon flash={flash} />
    </>
  );
};