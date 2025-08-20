import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";

export const ydoc = new Y.Doc();

export const ROOM_NAME = "r3f-yjs-demo";

export const provider = new WebrtcProvider(ROOM_NAME, ydoc);

export const yCube = ydoc.getMap("cube");

export type Vec3 = [number, number, number];

export function setCubePosition(position: Vec3) {
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
