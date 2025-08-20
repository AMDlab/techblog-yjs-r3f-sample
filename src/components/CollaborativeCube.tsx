import { useEffect, useRef, useState } from "react";
import { Mesh, Plane, Vector3, Quaternion, Euler } from "three";
import { useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import {
  OrbitControls,
  GizmoHelper,
  GizmoViewport,
  Html,
} from "@react-three/drei";
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
  const { camera } = useThree();

  const rotateByCameraAxis = (axis: "x" | "y" | "z", delta: number) => {
    const current = getCubeRotation();
    const qCurrent = new Quaternion().setFromEuler(
      new Euler(current[0], current[1], current[2], "XYZ")
    );

    // カメラ基準のワールド座標系ベクトルを取得
    const forward = new Vector3();
    camera.getWorldDirection(forward).normalize();
    const up = new Vector3(0, 1, 0)
      .applyQuaternion(camera.quaternion)
      .normalize();
    const right = new Vector3().copy(forward).cross(up).normalize();

    const axisVec = axis === "x" ? right : axis === "y" ? up : forward;
    const qAxis = new Quaternion().setFromAxisAngle(axisVec, delta);

    // カメラ基準のワールド軸まわりに回転させるため前掛けで合成
    const qNext = qAxis.multiply(qCurrent);
    const eNext = new Euler().setFromQuaternion(qNext, "XYZ");
    setCubeRotation([eNext.x, eNext.y, eNext.z]);
  };

  const step = Math.PI / 18; // 10度

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
      <Html fullscreen>
        <div className="rotation-controls">
          <button onClick={() => rotateByCameraAxis("x", +step)}>+X</button>
          <button onClick={() => rotateByCameraAxis("x", -step)}>-X</button>
          <button onClick={() => rotateByCameraAxis("y", +step)}>+Y</button>
          <button onClick={() => rotateByCameraAxis("y", -step)}>-Y</button>
          <button onClick={() => rotateByCameraAxis("z", +step)}>+Z</button>
          <button onClick={() => rotateByCameraAxis("z", -step)}>-Z</button>
        </div>
      </Html>
    </>
  );
}

function DraggableCube({ color = "#f97316" }: DraggableCubeProps) {
  const meshRef = useRef<Mesh | null>(null);
  const dragPlaneRef = useRef<Plane>(new Plane());
  const dragOffsetRef = useRef<Vector3>(new Vector3());
  const { controls, camera } = useThree((s) => ({
    controls: s.controls,
    camera: s.camera,
  }));
  const [position, setPositionState] = useState<Vec3>(getCubePosition());
  const [rotation, setRotationState] = useState<Vec3>(getCubeRotation());
  const [isDragging, setIsDragging] = useState(false);

  // リモート更新をYjsから購読して同期
  useEffect(() => {
    const observer = () => {
      setPositionState(getCubePosition());
      setRotationState(getCubeRotation());
    };
    yCube.observe(observer);
    return () => yCube.unobserve(observer);
  }, []);

  // フレーム毎の自動回転は削除。回転はUIボタンで制御

  // ドラッグ：カメラに平行な平面上でキューブをポインタに追従させる
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
      // 現在位置を通る平面を作成（法線はカメラ方向）
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
    // ドラッグ平面との交点を計算し、カーソルに追従
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
