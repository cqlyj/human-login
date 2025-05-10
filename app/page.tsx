"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../components/ui/button";

export default function Home() {
  const [webcamActive, setWebcamActive] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const router = useRouter();
  const [human, setHuman] = useState<any>(null);

  const handleSignUp = async () => {
    setError("");
    setRegistering(true);
    try {
      if (!human) {
        // @ts-ignore
        const h = new window.Human.Human({
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
        await h.load();
        setHuman(h);
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 400 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setWebcamActive(true);
    } catch (e: any) {
      setError(e.message || "Failed to start webcam");
      setRegistering(false);
    }
  };

  const handleRegister = async () => {
    if (!videoRef.current || !human) return;
    setRegistering(true);
    setError("");
    try {
      const result = await human.detect(videoRef.current);
      if (result.face && result.face.length > 0 && result.face[0].embedding) {
        localStorage.setItem(
          "faceCredentials",
          JSON.stringify(result.face[0].embedding)
        );
        const tracks = (videoRef.current.srcObject as MediaStream)?.getTracks();
        tracks?.forEach((t) => t.stop());
        setWebcamActive(false);
        setRegistering(false);
        router.push("/dashboard");
      } else {
        setError("No face detected. Please center your face in the circle.");
        setRegistering(false);
      }
    } catch (e: any) {
      setError(e.message || "Failed to register face");
      setRegistering(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="border border-black rounded-3xl p-8 w-full max-w-4xl min-h-[70vh] flex flex-col items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center">
            <div className="w-[400px] h-[400px] rounded-full border border-black flex items-center justify-center bg-gray-200 overflow-hidden mb-8">
              {webcamActive ? (
                <video
                  ref={videoRef}
                  width={400}
                  height={400}
                  className="object-cover w-full h-full"
                  autoPlay
                  muted
                  playsInline
                />
              ) : null}
            </div>
            {!webcamActive ? (
              <Button
                className="text-2xl px-12 py-4 rounded-xl border border-black"
                onClick={handleSignUp}
                disabled={registering}
              >
                sign up
              </Button>
            ) : (
              <Button
                className="text-2xl px-12 py-4 rounded-xl border border-black"
                onClick={handleRegister}
                disabled={registering}
              >
                Register Face
              </Button>
            )}
            {error && <div className="text-red-500 mt-4">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
