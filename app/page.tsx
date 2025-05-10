"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";

// @ts-ignore
declare global {
  interface Window {
    Human: any;
  }
}

export default function Home() {
  const [webcamActive, setWebcamActive] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const [human, setHuman] = useState<any>(null);
  const [scanning, setScanning] = useState(false);

  // Create and initialize video element directly
  const initializeCamera = async () => {
    setError("");
    setRegistering(true);

    try {
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      console.log("Camera access granted", stream);

      // Ensure video ref exists before proceeding
      if (videoRef.current) {
        console.log("Video reference found", videoRef.current);
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          videoRef.current
            ?.play()
            .then(() => {
              console.log("Video playing");
              setWebcamActive(true);
            })
            .catch((err) => {
              console.error("Error playing video:", err);
              setError("Error playing video: " + err.message);
            });
        };
      } else {
        console.error("Video reference is null!");
        setError("Video reference not available. Try refreshing the page.");
        setRegistering(false);
        return;
      }

      // Load Human.js model
      if (!human) {
        console.log("Loading Human.js model...");
        // @ts-ignore
        const h = new window.Human.Human({
          backend: "webgl",
          modelBasePath: "/models",
          face: {
            enabled: true,
            detector: { enabled: true },
            mesh: { enabled: true },
          },
          body: { enabled: false },
          hand: { enabled: false },
          object: { enabled: false },
          gesture: { enabled: false },
        });
        await h.load();
        setHuman(h);
        console.log("Human.js model loaded");
      }

      setRegistering(false);

      // Wait for video to be ready before scanning
      if (videoRef.current) {
        // Wait a moment for the camera to warm up
        setTimeout(() => scanFace(human || window.Human.Human), 1500);
      }
    } catch (e: any) {
      console.error("Camera error:", e);
      setError(e.message || "Failed to start webcam");
      setRegistering(false);
    }
  };

  const handleSignUp = async () => {
    setError("");
    setRegistering(true);
    try {
      // First initialize camera stream before loading Human.js model
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true, // Use default settings instead of fixed dimensions
      });
      console.log("Camera access granted", stream);

      // Set video source immediately
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log("Video source set");

        // Only activate webcam UI after ensuring stream is connected
        setWebcamActive(true);

        // Now load Human.js if not already loaded
        if (!human) {
          console.log("Loading Human.js model...");
          // @ts-ignore
          const h = new window.Human.Human({
            backend: "webgl",
            modelBasePath: "/models",
            face: {
              enabled: true,
              detector: { enabled: true },
              mesh: { enabled: true },
            },
            body: { enabled: false },
            hand: { enabled: false },
            object: { enabled: false },
            gesture: { enabled: false },
          });
          await h.load();
          setHuman(h);
          console.log("Human.js model loaded");
        }

        setRegistering(false);
        // Wait a moment for the camera to warm up
        setTimeout(() => scanFace(human || window.Human.Human), 1500); // Increased timeout
      } else {
        setError("Video reference not available");
        setRegistering(false);
      }
    } catch (e: any) {
      console.error("Camera error:", e);
      setError(e.message || "Failed to start webcam");
      setRegistering(false);
    }
  };

  const scanFace = async (HumanCtor: any) => {
    setScanning(true);
    setError("");
    try {
      console.log("Starting face scan...");
      // Check if video element exists and is playing
      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      if (videoRef.current.paused || videoRef.current.ended) {
        console.log("Video is not playing, attempting to play...");
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.error("Failed to play video:", playErr);
        }
      }

      // Use the latest human instance
      const h =
        human ||
        new HumanCtor({
          backend: "webgl",
          face: {
            enabled: true,
            detector: { enabled: true },
            mesh: { enabled: true },
          },
          body: { enabled: false },
          hand: { enabled: false },
          object: { enabled: false },
          gesture: { enabled: false },
        });
      if (!human) {
        await h.load();
        setHuman(h);
      }

      // Try up to 10 times to detect a face
      let found = false;
      for (let i = 0; i < 10; i++) {
        console.log(`Face detection attempt ${i + 1}/10`);
        if (!videoRef.current) break;

        const result = await h.detect(videoRef.current);
        console.log(
          "Detection result:",
          result?.face?.length || 0,
          "faces found"
        );

        if (result.face && result.face.length > 0 && result.face[0].embedding) {
          localStorage.setItem(
            "faceCredentials",
            JSON.stringify(result.face[0].embedding)
          );
          const tracks = (
            videoRef.current.srcObject as MediaStream
          )?.getTracks();
          tracks?.forEach((t) => t.stop());
          setWebcamActive(false);
          setScanning(false);
          router.push("/dashboard");
          found = true;
          break;
        }
        await new Promise((res) => setTimeout(res, 500)); // Increased interval
      }
      if (!found) {
        setError(
          "No face detected. Please center your face in the circle and ensure good lighting."
        );
        setScanning(false);
      }
    } catch (e: any) {
      console.error("Face scan error:", e);
      setError(e.message || "Failed to scan face");
      setScanning(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="border border-black rounded-3xl p-8 w-full max-w-4xl min-h-[70vh] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center">
            <div
              className="relative mb-8"
              style={{
                width: 400,
                height: 400,
                borderRadius: "50%",
                border: "1px solid black",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#eee",
              }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "auto",
                  height: "100%",
                  minWidth: "100%",
                  objectFit: "cover",
                  display: webcamActive ? "block" : "none",
                }}
              />
              {!webcamActive && (
                <div className="text-gray-400">Camera will appear here</div>
              )}
              {/* Debug information overlay */}
              {webcamActive && (
                <div
                  className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-50 text-white text-xs p-1 rounded"
                  onClick={() => {
                    if (videoRef.current) {
                      const status = videoRef.current.paused
                        ? "paused"
                        : "playing";
                      console.log(`Video is ${status}`, videoRef.current);
                      alert(
                        `Video status: ${status}\nReadyState: ${
                          videoRef.current.readyState
                        }\nHas srcObject: ${Boolean(
                          videoRef.current.srcObject
                        )}`
                      );
                    }
                  }}
                >
                  Click for debug info
                </div>
              )}
            </div>
            {!webcamActive ? (
              <Button
                className="text-2xl px-12 py-4 rounded-xl border border-black"
                onClick={initializeCamera}
                disabled={registering || scanning}
              >
                {registering ? "Starting camera..." : "sign up"}
              </Button>
            ) : (
              <Button
                className="text-2xl px-12 py-4 rounded-xl border border-black"
                disabled
              >
                {scanning ? "Scanning face..." : "Scanning..."}
              </Button>
            )}
            {error && <div className="text-red-500 mt-4">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
