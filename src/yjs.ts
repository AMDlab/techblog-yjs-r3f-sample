import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";

export const ydoc = new Y.Doc();

// Use a stable room name for collaboration.
export const ROOM_NAME = "r3f-yjs-demo";

// Spin up WebRTC provider (serverless discovery uses public signalling servers by default)
export const provider = new WebrtcProvider(ROOM_NAME, ydoc);

// Shared map for cube state (position, rotation)
export const yCube = ydoc.getMap("cube");

export type Vec3 = [number, number, number];

export function setCubePosition(position: Vec3) {
  // store as plain array to keep it serializable
  yCube.set("position", position);
}

export function getCubePosition(): Vec3 {
  const pos = yCube.get("position") as Vec3 | undefined;
  return pos ?? [0, 0, 0];
}

export function setCubeRotation(rotation: Vec3) {
  yCube.set("rotation", rotation);
}

export function getCubeRotation(): Vec3 {
  const rot = yCube.get("rotation") as Vec3 | undefined;
  return rot ?? [0, 0, 0];
}
