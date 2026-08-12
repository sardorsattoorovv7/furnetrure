import { useEffect, useState } from "react";

/**
 * Detects real WebXR "immersive-ar" support. This must be an honest check -
 * never assume AR works just because the browser is Chrome or the device is
 * Android. iOS Safari does not implement WebXR at all (as of this writing),
 * so it will correctly report false here and the UI must fall back to
 * <model-viewer>'s Quick Look / Scene Viewer path instead.
 */
export function useWebXRSupport() {
  const [status, setStatus] = useState("checking"); // "checking" | "supported" | "unsupported"

  useEffect(() => {
    let cancelled = false;

    async function check() {
      if (!navigator.xr) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      try {
        const supported = await navigator.xr.isSessionSupported("immersive-ar");
        if (!cancelled) setStatus(supported ? "supported" : "unsupported");
      } catch {
        if (!cancelled) setStatus("unsupported");
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}

export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
