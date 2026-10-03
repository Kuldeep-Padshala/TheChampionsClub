import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, X, RefreshCw, AlertCircle, Sparkles, CheckCircle2, FlipHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';

interface CameraQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (decodedText: string) => void;
  title?: string;
}

export const CameraQrScannerModal: React.FC<CameraQrScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title = 'Front Desk Camera QR Scanner',
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMirrored, setIsMirrored] = useState<boolean>(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isClosingRef = useRef<boolean>(false);

  // ── 1. GUARANTEED 0-MS HARDWARE SHUTDOWN ───────────────────────────
  const stopHardwareCamera = useCallback(() => {
    isClosingRef.current = true;

    // 1. Cancel requestAnimationFrame loop immediately
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    // 2. Shut off all hardware camera tracks immediately
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
          track.enabled = false;
        } catch (e) {
          console.warn('[Camera] Track stop error:', e);
        }
      });
      streamRef.current = null;
    }

    // 3. Clear video element source so camera light turns off immediately
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsLoading(false);
  }, []);

  // Safe Close Handler
  const handleSafeClose = useCallback(() => {
    stopHardwareCamera();
    onClose();
  }, [stopHardwareCamera, onClose]);

  // Audio feedback chime on scan success
  const playSuccessChime = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.12); // A5

      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.26);

      if (navigator.vibrate) {
        navigator.vibrate(80);
      }
    } catch {
      // AudioContext autoplay policy
    }
  }, []);

  // ── 2. HIGH SPEED SCANNING LOOP ────────────────────────────────────
  const startScanLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Use native hardware BarcodeDetector if available (Chrome / Edge hardware accelerated)
    const hasNativeBarcodeDetector = 'BarcodeDetector' in window;
    const barcodeDetector = hasNativeBarcodeDetector
      ? new (window as any).BarcodeDetector({ formats: ['qr_code'] })
      : null;

    let scanInterval = 0;

    const scanFrame = async () => {
      if (isClosingRef.current) return;

      if (video.readyState >= video.HAVE_CURRENT_DATA && video.videoWidth > 0) {
        scanInterval++;
        // Scan every 2nd frame for 60fps responsiveness with minimal CPU
        if (scanInterval % 2 === 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          let decodedText: string | null = null;

          // Attempt native hardware detection
          if (barcodeDetector) {
            try {
              const barcodes = await barcodeDetector.detect(canvas);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                decodedText = barcodes[0].rawValue;
              }
            } catch {
              // fallback
            }
          }

          // Fallback to pure jsQR engine
          if (!decodedText) {
            try {
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert',
              });
              if (code && code.data && code.data.trim()) {
                decodedText = code.data.trim();
              }
            } catch {
              // Skip frame
            }
          }

          // If still not decoded, try horizontally flipped frame
          if (!decodedText) {
            try {
              ctx.save();
              ctx.scale(-1, 1);
              ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
              ctx.restore();
              const flippedData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const flippedCode = jsQR(flippedData.data, flippedData.width, flippedData.height, {
                inversionAttempts: 'dontInvert',
              });
              if (flippedCode && flippedCode.data && flippedCode.data.trim()) {
                decodedText = flippedCode.data.trim();
              }
            } catch {
              // Skip frame
            }
          }

          // When valid QR code is scanned:
          if (decodedText && !isClosingRef.current) {
            isClosingRef.current = true;
            setLastScannedCode(decodedText);
            playSuccessChime();
            toast.success(`Verified: ${decodedText}`, { id: 'qr-toast', duration: 2500 });

            // 1. Immediately kill the hardware camera stream & light
            stopHardwareCamera();

            // 2. Deliver code to receptionist check-in & close modal
            onScan(decodedText);
            onClose();
            return;
          }
        }
      }

      if (!isClosingRef.current) {
        animFrameRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animFrameRef.current = requestAnimationFrame(scanFrame);
  }, [playSuccessChime, stopHardwareCamera, onScan, onClose]);

  // ── 3. AUTOMATICALLY SELECT & OPEN LAPTOP CAMERA ───────────────────
  const openLaptopCamera = useCallback(async () => {
    isClosingRef.current = false;
    setIsLoading(true);
    setCameraError(null);

    // Stop any previously running stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    try {
      // Find devices to select the true built-in laptop camera (ignore OnePlus/Virtual/OBS cameras)
      let targetDeviceId: string | undefined = undefined;

      try {
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');

        if (videoInputs.length > 0) {
          // Helper to identify virtual/phone cameras
          const isVirtual = (name: string) => {
            const l = name.toLowerCase();
            return (
              l.includes('virtual') ||
              l.includes('oneplus') ||
              l.includes('obs') ||
              l.includes('droidcam') ||
              l.includes('phone') ||
              l.includes('link')
            );
          };

          // Find the real built-in laptop camera:
          // Usually labeled: "Integrated Camera", "Integrated Webcam", "HD WebCam", "Internal", "Front Camera"
          const preferredLaptopCam = videoInputs.find((d) => {
            const l = d.label.toLowerCase();
            return (
              !isVirtual(l) &&
              (l.includes('integrated') ||
                l.includes('webcam') ||
                l.includes('internal') ||
                l.includes('hd') ||
                l.includes('front') ||
                l.includes('camera'))
            );
          });

          // If preferred is found, use it; otherwise use the first non-virtual device
          const nonVirtualCam = preferredLaptopCam || videoInputs.find((d) => !isVirtual(d.label));
          if (nonVirtualCam) {
            targetDeviceId = nonVirtualCam.deviceId;
          }
        }
      } catch (e) {
        console.warn('[Camera] Device enumeration fallback:', e);
      }

      // Constraints: For laptops, use 'user' (front-facing laptop webcam) rather than 'environment'
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: targetDeviceId
          ? { deviceId: { exact: targetDeviceId }, width: { ideal: 640 }, height: { ideal: 480 } }
          : { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // If user closed modal while camera was spinning up, kill stream immediately
      if (isClosingRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');

        videoRef.current.onloadedmetadata = () => {
          if (isClosingRef.current) return;
          videoRef.current?.play().catch(console.warn);
          setIsLoading(false);
          startScanLoop();
        };
      }
    } catch (err: any) {
      console.error('[Camera] openLaptopCamera failed:', err);
      setIsLoading(false);
      let errorMsg = 'Failed to open laptop webcam.';
      if (err?.name === 'NotAllowedError' || String(err).includes('Permission')) {
        errorMsg = 'Camera permission denied. Please allow camera access in your browser.';
      } else if (err?.name === 'NotFoundError') {
        errorMsg = 'No laptop camera detected.';
      } else if (err?.name === 'NotReadableError' || String(err).includes('busy')) {
        errorMsg = 'Your laptop webcam is busy or in use by another program.';
      }
      setCameraError(errorMsg);
    }
  }, [startScanLoop]);

  // Lifecycle when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setLastScannedCode(null);
      isClosingRef.current = false;
      openLaptopCamera();
    } else {
      stopHardwareCamera();
    }

    return () => {
      stopHardwareCamera();
    };
  }, [isOpen, openLaptopCamera, stopHardwareCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-[#121216] border border-[#B89047]/40 shadow-2xl overflow-hidden flex flex-col text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#B89047]/20 border border-[#B89047]/30 flex items-center justify-center text-[#EAD29A]">
              <Camera size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm sm:text-base text-white flex items-center gap-2">
                <span>{title}</span>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#B89047]/20 text-[#EAD29A] font-mono uppercase tracking-wider">
                  Laptop Camera
                </span>
              </h3>
              <p className="text-[11px] text-gray-400">Position the member QR code in front of your screen</p>
            </div>
          </div>

          <button
            onClick={handleSafeClose}
            className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
            title="Close camera"
          >
            <X size={16} />
          </button>
        </div>

        {/* Viewport Area */}
        <div className="relative p-6 flex flex-col items-center justify-center bg-[#09090C]">
          
          <div className="relative w-full aspect-square max-w-[320px] rounded-2xl overflow-hidden border-2 border-[#B89047]/40 shadow-inner bg-black flex items-center justify-center">
            
            {/* Native Video Feed with Mirror View */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ transform: isMirrored ? 'scaleX(-1)' : 'scaleX(1)' }}
              className="w-full h-full object-cover transition-transform duration-200"
            />

            {/* Quick Flip / Mirror View Button */}
            {!isLoading && !cameraError && (
              <button
                type="button"
                onClick={() => setIsMirrored((prev) => !prev)}
                className="absolute top-3 right-3 z-30 px-2.5 py-1 rounded-xl bg-black/70 hover:bg-black/90 text-white border border-white/20 text-[11px] font-medium flex items-center gap-1.5 backdrop-blur-md transition-all shadow-md cursor-pointer"
                title="Toggle Mirror View"
              >
                <FlipHorizontal size={13} className="text-[#EAD29A]" />
                <span>{isMirrored ? 'Mirror: On' : 'Mirror: Off'}</span>
              </button>
            )}

            {/* Hidden canvas for decoding */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Loading Spinner */}
            {isLoading && (
              <div className="absolute inset-0 bg-[#09090C]/90 flex flex-col items-center justify-center gap-3 z-10">
                <div className="w-9 h-9 border-2 border-[#B89047]/30 border-t-[#B89047] rounded-full animate-spin" />
                <span className="text-xs text-[#EAD29A] font-medium">Opening Laptop Camera...</span>
              </div>
            )}

            {/* Luxury Viewfinder Frame Overlay */}
            {!isLoading && !cameraError && (
              <div className="pointer-events-none absolute inset-5 rounded-xl flex flex-col justify-between p-2">
                <div className="flex justify-between">
                  <div className="w-6 h-6 border-t-2 border-l-2 border-[#EAD29A] rounded-tl-sm shadow-[0_0_8px_#B89047]" />
                  <div className="w-6 h-6 border-t-2 border-r-2 border-[#EAD29A] rounded-tr-sm shadow-[0_0_8px_#B89047]" />
                </div>
                
                {/* Laser animation */}
                <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-[#EAD29A] to-transparent animate-pulse shadow-[0_0_12px_#EAD29A]" />

                <div className="flex justify-between">
                  <div className="w-6 h-6 border-b-2 border-l-2 border-[#EAD29A] rounded-bl-sm shadow-[0_0_8px_#B89047]" />
                  <div className="w-6 h-6 border-b-2 border-r-2 border-[#EAD29A] rounded-br-sm shadow-[0_0_8px_#B89047]" />
                </div>
              </div>
            )}

            {/* Error Message */}
            {cameraError && (
              <div className="absolute inset-0 bg-[#121216]/95 p-6 flex flex-col items-center justify-center text-center z-20">
                <AlertCircle size={36} className="text-amber-400 mb-3" />
                <h4 className="font-bold text-sm text-white mb-1.5">Camera Error</h4>
                <p className="text-xs text-gray-400 max-w-xs leading-relaxed mb-4">{cameraError}</p>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={openLaptopCamera}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#B89047] text-black hover:opacity-90 flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <RefreshCw size={13} />
                    <span>Retry</span>
                  </button>
                  <button
                    onClick={handleSafeClose}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white/10 text-white hover:bg-white/15 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Success flash */}
            {lastScannedCode && (
              <div className="absolute inset-0 bg-emerald-950/95 flex flex-col items-center justify-center text-center z-20 animate-fadeIn">
                <CheckCircle2 size={44} className="text-emerald-400 mb-2" />
                <span className="font-bold text-sm text-white">QR Code Verified!</span>
                <span className="font-mono text-xs text-emerald-300 mt-1 max-w-[200px] truncate">{lastScannedCode}</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-gray-400 mt-4 flex items-center gap-1.5">
            <Sparkles size={12} className="text-[#EAD29A]" />
            Hold phone screen or card steady in front of your laptop webcam
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/[0.02] flex items-center justify-between">
          <span className="text-[11px] text-gray-500 font-mono">
            Auto-closes instantly on scan
          </span>

          <button
            onClick={handleSafeClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            Close Camera
          </button>
        </div>
      </div>
    </div>
  );
};
