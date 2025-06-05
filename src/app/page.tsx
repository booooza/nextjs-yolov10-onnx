"use client";
import { HEIGHT, WIDTH } from "@/lib/config";
import { loadModelFromCache, saveModelToCache } from "@/lib/db";
import { DetectionResultProps, runInference } from "@/lib/inference";
import { Model, MODELS } from "@/lib/models";
import { InferenceSession } from "onnxruntime-web";
import React, { useCallback, useEffect } from "react";
import { useRef, useState } from "react";
import Webcam from "react-webcam";

export default function Home() {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.35);
  const [selectedModel, setSelectedModel] = useState<Model>(MODELS[0]);
  const [session, setSession] = useState<InferenceSession | null>(null);
  const [detectionResult, setDetectionResult] = useState<
    DetectionResultProps[] | null
  >(null);
  const [inferenceTime, setInferenceTime] = useState<number>(500);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isLoadingModel, setIsLoadingModel] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  // Load ONNX model
  const getModel = async (model: Model) => {
    setIsLoadingModel(true);
    try {
      let modelBuffer = await loadModelFromCache(model.key);

      if (!modelBuffer) {
        // Fetch and cache
        const response = await fetch(model.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        modelBuffer = await response.arrayBuffer();
        if (modelBuffer.byteLength === 0) {
          throw new Error("Empty model buffer");
        }
        await saveModelToCache(model.key, modelBuffer);
        console.log(`Cached model: ${model.name}`);
      } else {
        console.log(`Loaded model from cache: ${model.name}`);
      }

      const newSession = await InferenceSession.create(modelBuffer);
      setSession(newSession);
      console.log(`Model loaded successfully: ${model.name}`);
    } catch (error) {
      console.error(`Failed to load model ${model.name}:`, error);
      setSession(null);
      setSelectedModel(MODELS[0]); // Reset to default model
    } finally {
      setIsLoadingModel(false);
    }
  };

  // eslint-disable-next-line
  const clearModelCache = () => {
    const request = indexedDB.open("onnx-model-cache", 1);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction("models", "readwrite");
      tx.objectStore("models").clear();
      tx.oncomplete = () => {
        db.close();
        console.log("Model cache cleared.");
      };
    };
  };

  // Handle model selection change
  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const model = MODELS.find((m) => m.url === value) || MODELS[0];
    setSelectedModel(model);
    setSession(null);
    setDetectionResult(null);
    getModel(model);
  };

  // Handle confidence threshold change
  const handleConfidenceChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setConfidenceThreshold(parseFloat(event.target.value));
  };

  // Process a single frame from the webcam
  const processFrame = useCallback(async () => {
    if (!webcamRef.current || !session || !canvasRef.current || isLoadingModel)
      return;

    setIsProcessing(true);
    const imageSrc = webcamRef.current.getScreenshot();

    if (imageSrc) {
      try {
        // Create an image element to get pixel data
        const img = document.createElement("img");
        img.src = imageSrc;

        await new Promise((resolve) => {
          img.onload = resolve;
        });

        // Get image data
        const canvas = document.createElement("canvas");
        canvas.width = WIDTH;
        canvas.height = HEIGHT;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
          const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);

          // Run inference
          const startTime = performance.now();
          const results = await runInference(
            session,
            confidenceThreshold,
            imageData
          );
          const endTime = performance.now();

          setInferenceTime(Math.floor(endTime - startTime));
          setDetectionResult(results);

          // Draw bounding boxes
          drawBoundingBoxes(results);
        }
      } catch (error) {
        console.error("Error processing frame:", error);
      } finally {
        setIsProcessing(false);
      }
    } else {
      setIsProcessing(false);
    }
  }, [confidenceThreshold, session, isLoadingModel]);

  // Draw bounding boxes on canvas
  const drawBoundingBoxes = (detections: DetectionResultProps[]) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw each detection
    detections.forEach((detection) => {
      const [x, y, w, h] = detection.bbox;
      const label = `${detection.label} ${Math.round(
        detection.confidence * 100
      )}%`;

      // Draw bounding box
      ctx.strokeStyle = "red";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // Draw background for label
      ctx.fillStyle = "red";
      const textWidth = ctx.measureText(label).width;
      ctx.fillRect(x, y - 20, textWidth + 10, 20);

      // Draw label
      ctx.fillStyle = "white";
      ctx.font = "16px Arial";
      ctx.fillText(label, x + 5, y - 5);
    });
  };

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setDevices(devices);
    });
  }, []);

  useEffect(() => {
    if (!session && !isLoadingModel) {
      getModel(selectedModel);
    }

    // Use inference time to determine processing interval (minimum 50ms + 50ms buffer)
    const processingInterval = Math.max(50, inferenceTime + 50);

    const interval = setInterval(() => {
      if (webcamRef.current && !isProcessing && !isLoadingModel) {
        processFrame();
      }
    }, processingInterval);

    return () => clearInterval(interval);
  }, [
    session,
    isLoadingModel,
    isProcessing,
    inferenceTime,
    selectedModel,
    confidenceThreshold,
    processFrame,
  ]);

  return (
    <div className="grid grid-rows items-center justify-items-center pt-2 px-2 pb-10 gap-4 sm:pt-4 sm:px-10 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center">
        <h1 className="text-2xl/7 font-bold sm:truncate sm:text-3xl sm:tracking-tight">
          YOLOv10 Demo - Next.js-based edge object detection application
        </h1>

        {/* Main content area with responsive layout */}
        <div className="flex flex-col xl:flex-row gap-8 items-start">
          {/* Webcam container */}
          <div className="relative" style={{ height: "640px", width: "640px" }}>
            <Webcam
              mirrored={facingMode === "user"}
              audio={false}
              ref={webcamRef}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              videoConstraints={{
                height: HEIGHT,
                width: WIDTH,
                facingMode: facingMode,
              }}
              width={WIDTH}
              height={HEIGHT}
              screenshotFormat="image/jpeg"
            />
            <canvas
              ref={canvasRef}
              width={WIDTH}
              height={HEIGHT}
              className="absolute inset-0 z-10"
            />
            {isLoadingModel && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
                <div className="text-white text-lg">Loading Model...</div>
              </div>
            )}
          </div>

          {/* Controls and info panel */}
          <div className="flex flex-col gap-6 w-full xl:w-80">
            {/* Model Selection Dropdown */}
            <div className="flex flex-col gap-2 p-4 rounded-lg border font-[family-name:var(--font-geist-mono)]">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">
                Model Selection
              </h3>
              <label
                htmlFor="model-select"
                className="text-sm font-medium text-gray-200"
              >
                Choose YOLO Model:
              </label>
              <select
                id="model-select"
                value={selectedModel.url}
                onChange={handleModelChange}
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoadingModel}
              >
                {MODELS.map((model) => (
                  <option key={model.key} value={model.url}>
                    {model.name}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-400 mt-1">
                {isLoadingModel ? <>Loading model...</> : <>Model loaded</>}
              </p>

              {/* Confidence Threshold Slider */}
              <div className="mt-4">
                <label
                  htmlFor="confidence-slider"
                  className="text-sm font-medium text-gray-200 block mb-2"
                >
                  Confidence Threshold: {Math.round(confidenceThreshold * 100)}%
                </label>
                <input
                  id="confidence-slider"
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={handleConfidenceChange}
                  className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer slider"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>10%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Camera Switch Button */}
              {devices.length > 1 && (
                <button
                  onClick={() => {
                    const newFacingMode =
                      facingMode === "user" ? "environment" : "user";
                    setFacingMode(newFacingMode);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                >
                  Switch Camera
                </button>
              )}
            </div>

            {/* Model Information Panel */}
            <div className="flex flex-col gap-3 p-4 rounded-lg border font-[family-name:var(--font-geist-mono)]">
              <h3 className="text-lg font-semibold text-gray-200 mb-2">
                Model Information
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-200">Current Model:</span>
                  <span className="font-medium">
                    {session
                      ? selectedModel.name
                      : isLoadingModel
                      ? "Loading..."
                      : "No Model Loaded"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-200">Inference Time:</span>
                  <span className="font-medium">{inferenceTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-200">Processing Rate:</span>
                  <span className="font-medium">
                    {Math.round(1000 / Math.max(50, inferenceTime + 50))} FPS
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-200">Detections:</span>
                  <span className="font-medium">
                    {detectionResult?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-200">Status:</span>
                  <span
                    className={`font-medium ${
                      isProcessing
                        ? "text-yellow-600"
                        : isLoadingModel
                        ? "text-blue-600"
                        : session
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {isLoadingModel
                      ? "Loading Model"
                      : isProcessing
                      ? "Processing"
                      : session
                      ? "Ready"
                      : "No Model"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <p className="text-gray-200 text-xs">
          <a href="https://github.com/booooza/nextjs-yolov10-onnx">
            booooza/nextjs-yolov10-onnx
          </a>
        </p>
      </footer>
    </div>
  );
}
