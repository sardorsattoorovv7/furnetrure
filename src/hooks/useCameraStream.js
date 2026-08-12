// src/hooks/useCameraStream.js
import { useState, useRef, useCallback, useEffect } from 'react';

export function useCameraStream() {
  const [stream, setStream] = useState(null);
  const [status, setStatus] = useState('idle');
  const videoRef = useRef(null);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setStatus('unsupported');
      console.error('❌ Browser does not support getUserMedia');
      return null;
    }

    setStatus('requesting');
    console.log('📷 Requesting camera...');

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      console.log('✅ Camera stream obtained!');
      setStream(mediaStream);
      setStatus('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
        console.log('▶️ Video playing');
      }

      return mediaStream;
    } catch (error) {
      console.error('❌ Camera error:', error);
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setStatus('denied');
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setStatus('unsupported');
      } else {
        setStatus('denied');
      }
      
      return null;
    }
  }, []);

  const stop = useCallback(() => {
    console.log('🛑 Stopping camera...');
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      setStream(null);
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    setStatus('idle');
  }, [stream]);

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    stream,
    status,
    videoRef,
    start,
    stop,
    isActive: status === 'granted'
  };
}

export default useCameraStream;