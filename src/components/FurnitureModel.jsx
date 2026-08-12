import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useGLTF, Center } from "@react-three/drei";

/**
 * Loads a GLB model and scales it so its real-world height (millimeters,
 * from the Furniture record) matches physical scale in the 3D scene
 * (1 scene unit = 1 meter). This keeps the viewer physically accurate
 * instead of an arbitrary "fit to screen" preview - important since the
 * same scaling logic will later drive AR placement sizing.
 */
export function FurnitureModel({ url, heightMm, castShadow = true }) {
  const { scene } = useGLTF(url);
  const [scaleFactor, setScaleFactor] = useState(1);

  // Clone so multiple instances (e.g. catalog thumbnails) don't share state
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(cloned);
    const size = new THREE.Vector3();
    box.getSize(size);

    if (size.y > 0 && heightMm) {
      const targetHeightMeters = heightMm / 1000;
      setScaleFactor(targetHeightMeters / size.y);
    }
  }, [cloned, heightMm]);

  return (
    <Center>
      <primitive object={cloned} scale={scaleFactor} castShadow={castShadow} />
    </Center>
  );
}

export function preloadFurnitureModel(url) {
  useGLTF.preload(url);
}
