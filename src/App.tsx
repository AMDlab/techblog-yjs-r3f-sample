import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import CollaborativeScene from "./components/CollaborativeCube";
import "./App.css";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Suspense
        fallback={<div style={{ color: "#888", padding: 12 }}>Loading 3D…</div>}
      >
        <Canvas shadows camera={{ position: [4, 4, 6], fov: 50 }}>
          <color attach="background" args={[0.06, 0.07, 0.09]} />
          <CollaborativeScene />
        </Canvas>
      </Suspense>
    </div>
  );
}

export default App;
