import { Component, Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows } from "@react-three/drei";
import { FurnitureModel } from "./FurnitureModel";

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[0.3, 0.3, 0.3]} />
      <meshBasicMaterial color="#c9c1b2" wireframe />
    </mesh>
  );
}

// Three.js/GLTF parse failures (corrupt file, unsupported format) throw
// during render inside the Canvas tree. A real React error boundary is
// required to catch these - there is no hook equivalent - so the page can
// show an honest error instead of a blank canvas or a crashed app.
class ModelErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    this.props.onError?.(error);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function ViewerScene({ glbUrl, heightMm, autoRotate, onModelError }) {
  return (
    <>
      {/* Studio-style 3-point lighting instead of an external HDR environment
          map - keeps the viewer fully self-contained (no CDN dependency at
          runtime) while still looking clean and product-photo-like. */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[3, 5, 3]} intensity={1.2} castShadow /> {/* key */}
      <directionalLight position={[-4, 2, -2]} intensity={0.4} /> {/* fill */}
      <directionalLight position={[0, 3, -5]} intensity={0.3} /> {/* rim */}

      <ModelErrorBoundary onError={onModelError}>
        <Suspense fallback={<LoadingFallback />}>
          <FurnitureModel url={glbUrl} heightMm={heightMm} />
        </Suspense>
      </ModelErrorBoundary>

      <ContactShadows position={[0, -0.01, 0]} opacity={0.35} scale={5} blur={2.4} far={2} />

      <OrbitControls
        autoRotate={autoRotate}
        autoRotateSpeed={1.6}
        enablePan
        minDistance={0.5}
        maxDistance={8}
        maxPolarAngle={Math.PI / 1.9}
      />
    </>
  );
}

export function FurnitureViewer3D({ glbUrl, heightMm, className = "" }) {
  const [autoRotate, setAutoRotate] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!glbUrl) {
    return (
      <div className={`viewer3d-empty ${className}`}>
        <span>3D model mavjud emas</span>
      </div>
    );
  }

  return (
    <div className={`viewer3d-wrap ${fullscreen ? "fullscreen" : ""} ${className}`}>
      <Canvas
        shadows
        camera={{ position: [1.6, 1.2, 1.6], fov: 40 }}
        onError={() => setHasError(true)}
      >
        {!hasError && (
          <ViewerScene
            glbUrl={glbUrl}
            heightMm={heightMm}
            autoRotate={autoRotate}
            onModelError={() => setHasError(true)}
          />
        )}
      </Canvas>

      {hasError && (
        <div className="viewer3d-error">
          3D modelni yuklab bo'lmadi. Fayl buzilgan yoki noto'g'ri formatda bo'lishi mumkin.
        </div>
      )}

      <div className="viewer3d-controls">
        <button
          className="viewer3d-btn"
          onClick={() => setAutoRotate((v) => !v)}
          title="Avto-aylanish"
        >
          {autoRotate ? "⏸" : "▶"}
        </button>
        <button
          className="viewer3d-btn"
          onClick={() => setFullscreen((v) => !v)}
          title="To'liq ekran"
        >
          {fullscreen ? "⤡" : "⤢"}
        </button>
      </div>
      <div className="viewer3d-hint">Aylantirish uchun suring · Zoom uchun g'ildirak</div>
    </div>
  );
}
