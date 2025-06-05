[![Publish to GitHub Pages](https://github.com/booooza/nextjs-yolov10-onnx/actions/workflows/nextjs.yml/badge.svg)](https://github.com/booooza/nextjs-yolov10-onnx/actions/workflows/nextjs.yml)

# YOLOv10 Real-Time Object Detection Demo

This project is a web-based real-time object detection and classification app built with React, ONNX Runtime Web, and YOLOv10 models (n, s, m variants). It captures webcam frames, processes them with a selected YOLO model in the browser, and displays detections with bounding boxes and labels.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Features

- Real-time webcam inference using ONNX models
- Switchable YOLOv10 models (nano, small, medium)
- Adjustable confidence threshold
- Live performance metrics (inference time, FPS, detection count)
- Visual overlay of bounding boxes and labels on a canvas
- Classes: COCO dataset

## Stack

- React + TypeScript + Tailwind CSS
- onnxruntime-web for client-side inference
- react-webcam for video input
- Yolo v10 ONNX models for face detection and classification (from https://huggingface.co/onnx-community/yolov10n)

## Credits

Inference code is based on
https://onnxruntime.ai/docs/tutorials/web/build-web-app.html

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000/nextjs-yolov10-onnx](http://localhost:3000/nextjs-yolov10-onnx) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Build

```bash
npm run build
```

Builds a static export for production to the `out` directory.
Preview the production build locally with `npm run preview`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!
