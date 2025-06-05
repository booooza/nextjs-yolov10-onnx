import { HEIGHT, WIDTH } from "./config";

  const drawTestBoxes = (canvasRef: React.RefObject<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) {
      console.error("Failed to get canvas context for debug drawing");
      return;
    }

    // Clear canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw test boxes with different colors
    const testBoxes = [
      { x: 100, y: 100, w: 200, h: 150, color: "red", label: "Test Box 1" },
      { x: 400, y: 200, w: 150, h: 200, color: "green", label: "Test Box 2" },
      { x: 250, y: 350, w: 120, h: 100, color: "blue", label: "Test Box 3" },
    ];

    console.log("Drawing test boxes:", testBoxes);

    testBoxes.forEach((box) => {
      // Draw box
      ctx.strokeStyle = box.color;
      ctx.lineWidth = 4;
      ctx.strokeRect(box.x, box.y, box.w, box.h);

      // Draw label background
      ctx.fillStyle = box.color;
      const textWidth = ctx.measureText(box.label).width;
      ctx.fillRect(box.x, box.y - 25, textWidth + 10, 25);

      // Draw label text
      ctx.fillStyle = "white";
      ctx.font = "bold 16px Arial";
      ctx.fillText(box.label, box.x + 5, box.y - 7);
    });

    console.log("Test boxes drawing complete");
  };
