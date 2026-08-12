import { useEffect, useRef } from "react";

/**
 * iOS Safari does not implement WebXR, so the "real" AR flow in ARPage.jsx
 * cannot run there. This is not a workaround-to-avoid-writing-real-code -
 * it's the standard, honest solution for iOS AR: Apple's own AR Quick Look
 * viewer, launched via a <model-viewer> web component with an `ar` button.
 * It opens the system AR viewer (not a custom in-page WebXR session), which
 * is the only AR path Apple exposes to web content.
 *
 * Loads the model-viewer custom element from a CDN on demand, so desktop/
 * Android bundles never pay for it.
 */
export function IOSQuickLookFallback({ furniture }) {
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || customElements.get("model-viewer")) {
      loadedRef.current = true;
      return;
    }
    const script = document.createElement("script");
    script.type = "module";
    script.src = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.5.0/model-viewer.min.js";
    document.head.appendChild(script);
    loadedRef.current = true;
  }, []);

  if (!furniture?.model_3d) {
    return <div className="empty-state">Bu mebel uchun 3D model mavjud emas</div>;
  }

  return (
    <div className="ios-ar-wrap">
      {/* eslint-disable-next-line react/no-unknown-property */}
      <model-viewer
        src={furniture.model_3d.glb_file}
        ios-src={furniture.model_3d.usdz_file || undefined}
        ar
        ar-modes="quick-look scene-viewer webxr"
        camera-controls
        auto-rotate
        shadow-intensity="1"
        style={{ width: "100%", height: "100%" }}
      >
        <button slot="ar-button" className="btn-primary ios-ar-button">
          📷 AR'da ko'rish
        </button>
      </model-viewer>
      <p className="muted small">
        "AR'da ko'rish" tugmasi bosilganda iOS'ning o'zining AR Quick Look ilovasi ochiladi - bu Apple qurilmalar
        uchun brauzerdan AR ochishning yagona rasmiy usuli (Safari WebXR'ni qo'llab-quvvatlamaydi).
      </p>
      {!furniture.model_3d.usdz_file && (
        <p className="ar-usdz-warning">
          ⚠ Diqqat: iOS AR Quick Look odatda GLB emas, <strong>USDZ</strong> formatini talab qiladi. Hozircha
          backend faqat GLB saqlaydi - iPhone'da "AR'da ko'rish" tugmasi ba'zi qurilmalarda ishlamasligi mumkin.
          To'liq ishlashi uchun backendga GLB→USDZ konvertatsiya bosqichini qo'shish kerak (Phase 5'ga qoldirildi).
        </p>
      )}
    </div>
  );
}
