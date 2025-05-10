// src/components/ModelViewer.jsx

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, Html } from "@react-three/drei";
import { Suspense } from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { useLoader } from "@react-three/fiber";

function Model({ url }) {
  const gltf = useLoader(GLTFLoader, url);
  return <primitive object={gltf.scene} scale={1.5} />;
}

export default function ModelViewer({ modelUrl }) {
  return (
    <div className="w-full h-[500px] bg-gray-200 rounded-lg shadow-lg overflow-hidden">
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />

        {/* Suspense fallback */}
        <Suspense fallback={
          <Html center>
            <div className="text-gray-700 font-semibold">Loading 3D Model...</div>
          </Html>
        }>
          <Model url={modelUrl} />
          <OrbitControls enablePan={true} enableZoom={true} autoRotate autoRotateSpeed={2} />
          <Environment preset="sunset" />
        </Suspense>
      </Canvas>
    </div>
  );
}
