import { useEffect, useRef, useState } from "react";
import { Mesh } from "three";
import { useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import {
  getCubePosition,
  getCubeRotation,
  setCubePosition,
  setCubeRotation,
  yCube,
  ydoc,
  type Vec3,
} from "../yjs";

type DraggableCubeProps = {
  color?: string;
};

export function CollaborativeScene() {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <gridHelper args={[20, 20]} />
      <axesHelper args={[5]} />
      <DraggableCube color="#f97316" />
      <OrbitControls makeDefault enableDamping />
      <GizmoHelper
        alignment="bottom-right"
        margin={[80, 80] as unknown as number}
      >
        <GizmoViewport
          axisColors={["#f87171", "#34d399", "#60a5fa"]}
          labelColor="#111827"
        />
      </GizmoHelper>
    </>
  );
}

function DraggableCube({ color = "#f97316" }: DraggableCubeProps) {
  const meshRef = useRef<Mesh | null>(null);
  const { viewport, size, controls } = useThree((s) => ({
    viewport: s.viewport,
    size: s.size,
    controls: s.controls as any,
  }));
  const [position, setPositionState] = useState<Vec3>(getCubePosition());
  const [rotation, setRotationState] = useState<Vec3>(getCubeRotation());
  const [isDragging, setIsDragging] = useState(false);

  // Sync from Yjs on remote updates
  useEffect(() => {
    const observer = () => {
      setPositionState(getCubePosition());
      setRotationState(getCubeRotation());
    };
    yCube.observe(observer);
    return () => yCube.unobserve(observer);
  }, []);

  // Apply rotation animation if not dragging
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    if (!isDragging) {
      const r = meshRef.current.rotation;
      const nextRot: Vec3 = [r.x + delta * 0.3, r.y + delta * 0.5, r.z];
      setRotationState(nextRot);
      setCubeRotation(nextRot);
    }
  });

  // Simple 2D drag on X/Y based on pointer movement
  const onPointerDown = (e: any) => {
    e.stopPropagation();
    try {
      e.target.setPointerCapture?.(e.pointerId);
    } catch {}
    setIsDragging(true);
    try {
      const c: any = controls;
      if (c) c.enabled = false;
    } catch {}
  };
  const onPointerUp = (e: any) => {
    e.stopPropagation();
    try {
      e.target.releasePointerCapture?.(e.pointerId);
    } catch {}
    setIsDragging(false);
    try {
      const c: any = controls;
      if (c) c.enabled = true;
    } catch {}
  };
  const onPointerMove = (e: any) => {
    if (!isDragging) return;
    e.stopPropagation();
    // Convert screen pixel delta to world-units using current viewport
    const deltaX = (e.movementX / size.width) * viewport.width;
    const deltaY = (e.movementY / size.height) * viewport.height;
    setPositionState((prev) => {
      const clamp = (n: number, min: number, max: number) =>
        Math.min(Math.max(n, min), max);
      const nextX = clamp(prev[0] + deltaX, -8, 8);
      const nextY = clamp(prev[1] - deltaY, -5, 5);
      const nextPos: Vec3 = [nextX, nextY, prev[2]];
      setCubePosition(nextPos);
      return nextPos;
    });
  };

  return (
    <mesh
      ref={meshRef}
      position={position as unknown as [number, number, number]}
      rotation={rotation as unknown as [number, number, number]}
      castShadow
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerOut={onPointerUp}
      onPointerMove={onPointerMove}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

export default CollaborativeScene;
