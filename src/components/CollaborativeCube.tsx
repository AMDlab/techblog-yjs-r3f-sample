import { useEffect, useRef, useState } from "react";
import { Mesh, Plane, Vector3 } from "three";
import { useThree, useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { OrbitControls, GizmoHelper, GizmoViewport } from "@react-three/drei";
import {
  getCubePosition,
  getCubeRotation,
  setCubePosition,
  setCubeRotation,
  yCube,
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
        margin={[80, 80] as [number, number]}
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
  const dragPlaneRef = useRef<Plane>(new Plane());
  const dragOffsetRef = useRef<Vector3>(new Vector3());
  const { controls, camera } = useThree((s) => ({
    viewport: s.viewport,
    size: s.size,
    controls: s.controls,
    camera: s.camera,
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

  // Drag: make cube follow the pointer on a plane parallel to the camera at the cube's depth
  const onPointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const targetEl = e.target as Element & {
      setPointerCapture?: (pointerId: number) => void;
    };
    targetEl.setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    const c = controls as { enabled?: boolean } | undefined;
    if (c && typeof c.enabled === "boolean") c.enabled = false;
    if (meshRef.current) {
      const normal = new Vector3();
      camera.getWorldDirection(normal);
      // Plane through current position, normal facing camera direction
      const pos = meshRef.current.position.clone();
      dragPlaneRef.current.setFromNormalAndCoplanarPoint(normal, pos);
      const hit = e.ray.intersectPlane(dragPlaneRef.current, new Vector3());
      if (hit) {
        dragOffsetRef.current.copy(pos.sub(hit));
      } else {
        dragOffsetRef.current.set(0, 0, 0);
      }
    }
  };
  const onPointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const targetEl = e.target as Element & {
      releasePointerCapture?: (pointerId: number) => void;
    };
    targetEl.releasePointerCapture?.(e.pointerId);
    setIsDragging(false);
    const c = controls as { enabled?: boolean } | undefined;
    if (c && typeof c.enabled === "boolean") c.enabled = true;
  };
  const onPointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (!isDragging) return;
    e.stopPropagation();
    // Compute intersection with drag plane and follow cursor
    const hit = e.ray.intersectPlane(dragPlaneRef.current, new Vector3());
    if (!hit) return;
    const next = hit.add(dragOffsetRef.current);
    const clamp = (n: number, min: number, max: number) =>
      Math.min(Math.max(n, min), max);
    const nextPos: Vec3 = [clamp(next.x, -8, 8), clamp(next.y, -5, 5), next.z];
    setPositionState(nextPos);
    setCubePosition(nextPos);
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
