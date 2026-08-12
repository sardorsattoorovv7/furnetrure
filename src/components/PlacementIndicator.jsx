import { useRef, useState } from "react";
import { useXRHitTest } from "@react-three/xr";
import * as THREE from "three";

/**
 * Shows a ring on any detected real-world surface (floor) and reports the
 * hit position/rotation up via onHit. This is the "Floor detected" /
 * "Tap the floor to place furniture" indicator from the spec - driven by
 * genuine WebXR hit-test results, not a fixed offset from the camera.
 */
export function PlacementIndicator({ onHit }) {
  const ringRef = useRef();
  const [visible, setVisible] = useState(false);
  const matrixHelper = useRef(new THREE.Matrix4()).current;

  useXRHitTest((results, getWorldMatrix) => {
    if (results.length === 0) {
      setVisible(false);
      return;
    }
    const ok = getWorldMatrix(matrixHelper, results[0]);
    if (!ok || !ringRef.current) {
      setVisible(false);
      return;
    }
    ringRef.current.position.setFromMatrixPosition(matrixHelper);
    setVisible(true);
    onHit?.(matrixHelper);
  }, "viewer");

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} visible={visible}>
      <ringGeometry args={[0.08, 0.1, 32]} />
      <meshBasicMaterial color="#a15a2a" />
    </mesh>
  );
}
