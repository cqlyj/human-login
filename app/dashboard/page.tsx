"use client";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [credentials, setCredentials] = useState<string | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCredentials(localStorage.getItem("faceCredentials"));
      setAlreadyRegistered(
        localStorage.getItem("alreadyRegistered") === "true"
      );
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="border border-black rounded-3xl p-8 w-full max-w-2xl min-h-[40vh] flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        {alreadyRegistered ? (
          <div className="text-green-600 text-lg font-semibold">
            You already registered!
          </div>
        ) : credentials ? (
          <>
            <div className="mb-2 text-lg">Face Credentials:</div>
            <pre className="bg-gray-100 p-4 rounded text-xs max-w-full overflow-x-auto">
              {credentials}
            </pre>
          </>
        ) : (
          <div className="text-red-500">
            No credentials found in localStorage.
          </div>
        )}
      </div>
    </div>
  );
}
