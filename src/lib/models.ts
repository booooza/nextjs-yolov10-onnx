type Model = {
  key: string;
  name: string;
  url: string;
};

const MODELS: Model[] = [
  {
    key: "yolo-v10-n",
    name: "Yolo v10 Nano",
    url: "https://huggingface.co/onnx-community/yolov10n/resolve/main/onnx/model.onnx?download=true",
  },
  {
    key: "yolo-v10-s",
    name: "Yolo v10 Small",
    url: "https://huggingface.co/onnx-community/yolov10s/resolve/main/onnx/model.onnx?download=true",
  },
  {
    key: "yolo-v10-m",
    name: "Yolo v10 Medium",
    url: "https://huggingface.co/onnx-community/yolov10m/resolve/main/onnx/model.onnx?download=true",
  },
  // Local models
  // {
  //   key: "yolo-v10-n-local",
  //   name: "Yolo v10 Nano (Locally hosted)",
  //   url: "/nextjs-yolov10-onnx/models/yolov10n.onnx",
  // },
];

export { MODELS };
export type { Model };
