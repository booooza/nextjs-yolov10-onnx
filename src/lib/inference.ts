import { InferenceSession, Tensor } from "onnxruntime-web";
import { CLASS_NAMES } from "./classes";
import { HEIGHT, WIDTH } from "./config";

interface DetectionResultProps {
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

// Run model inference on the input image
const runInference = async (
  session: InferenceSession | null,
  confidenceThreshold: number,
  imageData: ImageData,
): Promise<DetectionResultProps[]> => {
  // Prepare input tensor - normalize pixel values to [0,1] and reshape to model input shape
  const inputTensor = new Float32Array(WIDTH * HEIGHT * 3);
  const { data } = imageData;

  // Convert RGBA to RGB and normalize to [0,1]
  for (let i = 0; i < WIDTH * HEIGHT; i++) {
    inputTensor[i] = data[i * 4] / 255.0; // R
    inputTensor[i + WIDTH * HEIGHT] = data[i * 4 + 1] / 255.0; // G
    inputTensor[i + 2 * WIDTH * HEIGHT] = data[i * 4 + 2] / 255.0; // B
  }

  // Create tensor with shape [1, 3, height, width]
  const tensor = new Tensor("float32", inputTensor, [1, 3, HEIGHT, WIDTH]);

  // Run inference
  const feeds = { images: tensor };
  const results = await session!.run(feeds);

  // YOLOv10 usually has a single output tensor
  const outputName = Object.keys(results)[0];
  const output = results[outputName];
  const outputData = output.data as Float32Array;
  const outputDims = output.dims;

  console.log("Model output shape:", outputDims);

  const detections: DetectionResultProps[] = [];
  const confidence_threshold = confidenceThreshold;

  // YOLOv10 format:
  // [1, n, 6] where n is number of filtered detections (4 for bbox, 1 for confidence, 1 for class)

  if (outputDims.length === 3) {
    const num_detections = outputDims[1];
    const detection_size = outputDims[2];

    // Loop through all potential detections
    for (let i = 0; i < num_detections; i++) {
      const base_idx = i * detection_size;

      if (detection_size === 6) {
        // output format seems to be: [x1, y1, x2, y2, confidence, class_id]
        const x1 = outputData[base_idx + 0];
        const y1 = outputData[base_idx + 1];
        const x2 = outputData[base_idx + 2];
        const y2 = outputData[base_idx + 3];
        const confidence = outputData[base_idx + 4];
        const class_idx = Math.round(outputData[base_idx + 5]);

        if (confidence < confidence_threshold) continue;
        if (class_idx < 0 || class_idx >= CLASS_NAMES.length) continue;

        console.log(
          `Detection ${i}:`,
          outputData.slice(base_idx, base_idx + detection_size),
        );

        detections.push({
          label: CLASS_NAMES[class_idx],
          confidence: confidence,
          bbox: [x1, y1, x2 - x1, y2 - y1],
        });
      } else {
        console.error("Unexpected detection size:", detection_size);
      }
    }
  } else {
    console.error("Unexpected output tensor shape:", outputDims);
  }

  console.log(
    `Detected ${detections.length} objects above threshold ${confidence_threshold}`,
  );
  for (const detection of detections) {
    console.log(
      `Label: ${detection.label}, Confidence: ${detection.confidence}, BBox: ${detection.bbox}`,
    );
  }
  return detections;
};

export type { DetectionResultProps };
export { runInference };
