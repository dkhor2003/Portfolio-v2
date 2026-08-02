import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { avatarKeyframes, sectionIds } from '../data/content';

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function computeScrollTarget() {
  const positions = sectionIds.map((id) => document.getElementById(id)?.offsetTop ?? 0);
  const y = window.scrollY + window.innerHeight * 0.4;
  let idx = 0;
  for (let i = 0; i < positions.length - 1; i++) if (y >= positions[i]) idx = i;
  let frac = 0;
  const next = positions[idx + 1];
  if (next !== undefined && next > positions[idx]) frac = Math.min(1, Math.max(0, (y - positions[idx]) / (next - positions[idx])));
  const a = avatarKeyframes[idx];
  const b = avatarKeyframes[Math.min(idx + 1, avatarKeyframes.length - 1)];
  return { rotY: lerp(a.rotY, b.rotY, frac), armL: lerp(a.armL, b.armL, frac), armR: lerp(a.armR, b.armR, frac), lap: lerp(a.lap, b.lap, frac) };
}

function Figure({ dragOffset }: { dragOffset: React.MutableRefObject<number> }) {
  const avatar = useRef<THREE.Group>(null);
  const laptop = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const pose = useRef({ rotY: 0.3, armL: -0.4, armR: -0.5, lap: 1 });

  useFrame(() => {
    const target = computeScrollTarget();
    const ease = 0.08;
    pose.current.rotY += (target.rotY - pose.current.rotY) * ease;
    pose.current.armL += (target.armL - pose.current.armL) * ease;
    pose.current.armR += (target.armR - pose.current.armR) * ease;
    pose.current.lap += (target.lap - pose.current.lap) * ease;

    if (avatar.current) {
      avatar.current.rotation.y = pose.current.rotY + dragOffset.current;
      avatar.current.position.y = -0.3 + Math.sin(performance.now() / 1400) * 0.06;
    }
    if (armL.current) armL.current.rotation.z = pose.current.armL;
    if (armR.current) armR.current.rotation.z = pose.current.armR;
    if (laptop.current) {
      const s = Math.max(0.001, pose.current.lap);
      laptop.current.scale.setScalar(s);
      laptop.current.visible = pose.current.lap > 0.03;
    }
  });

  const accent = '#4dd9d0';
  const bodyProps = { color: '#1c1c26', roughness: 0.5, metalness: 0.3, flatShading: true } as const;
  const accentProps = { color: accent, roughness: 0.3, metalness: 0.4, emissive: accent, emissiveIntensity: 0.35, flatShading: true } as const;

  return (
    <group ref={avatar} position={[0, -0.3, 0]} scale={1.5}>
      <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.72, 0.62, 1.5, 8]} /><meshStandardMaterial {...bodyProps} /></mesh>
      <mesh position={[0, 1.35, 0]}><icosahedronGeometry args={[0.52, 1]} /><meshStandardMaterial {...accentProps} /></mesh>
      <group ref={armL} position={[-0.78, 0.75, 0]}>
        <mesh position={[0, -0.55, 0]} rotation={[0, 0, 0.15]}><cylinderGeometry args={[0.16, 0.16, 1.1, 8]} /><meshStandardMaterial {...bodyProps} /></mesh>
      </group>
      <group ref={armR} position={[0.78, 0.75, 0]}>
        <mesh position={[0, -0.55, 0]} rotation={[0, 0, -0.15]}><cylinderGeometry args={[0.16, 0.16, 1.1, 8]} /><meshStandardMaterial {...bodyProps} /></mesh>
      </group>
      <group ref={laptop} position={[0, -0.55, 0.9]}>
        <mesh><boxGeometry args={[1.1, 0.06, 0.75]} /><meshStandardMaterial {...accentProps} /></mesh>
        <mesh position={[0, 0.35, -0.35]} rotation={[-0.25, 0, 0]}><boxGeometry args={[1.1, 0.7, 0.05]} /><meshStandardMaterial {...accentProps} /></mesh>
      </group>
      <mesh position={[0, -1.15, 0]} rotation={[Math.PI / 2.1, 0, 0]}><torusGeometry args={[1.3, 0.02, 8, 48]} /><meshStandardMaterial {...accentProps} /></mesh>
    </group>
  );
}

/** Scroll-driven 3D avatar: poses lerp between avatarKeyframes as the page scrolls, draggable to spin. */
export default function Avatar3D() {
  const dragOffset = useRef(0);
  const dragging = useRef(false);
  const dragStartX = useRef(0);
  const dragBase = useRef(0);
  const [cursor, setCursor] = useState('grab');

  return (
    <div
      className="fixed [@media(max-width:820px)]:!w-[110px] [@media(max-width:820px)]:!h-[110px] [@media(max-width:820px)]:!right-4 [@media(max-width:820px)]:!bottom-4 [@media(max-width:820px)]:!top-auto [@media(max-width:820px)]:!left-auto [@media(max-width:820px)]:!translate-y-0 w-[360px] h-[360px] right-[3vw] top-1/2 -translate-y-1/2 z-[5] touch-none"
      style={{ cursor }}
      onPointerDown={(e) => { dragging.current = true; dragStartX.current = e.clientX; dragBase.current = dragOffset.current; setCursor('grabbing'); }}
      onPointerMove={(e) => { if (dragging.current) dragOffset.current = dragBase.current + (e.clientX - dragStartX.current) * 0.01; }}
      onPointerUp={() => { dragging.current = false; setCursor('grab'); }}
      onPointerLeave={() => { dragging.current = false; setCursor('grab'); }}
    >
      <Canvas camera={{ position: [0, 0.6, 7.5], fov: 32 }} gl={{ alpha: true, antialias: true }}>
        <ambientLight color="#8899ff" intensity={0.7} />
        <directionalLight color="#4dd9d0" intensity={1.1} position={[3, 4, 5]} />
        <directionalLight color="#ff5fc4" intensity={0.6} position={[-4, 2, -3]} />
        <Figure dragOffset={dragOffset} />
      </Canvas>
    </div>
  );
}
