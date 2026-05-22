"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import { BrushIcon, EraserIcon, Trash2Icon } from "lucide-react";

enum Tool {
	Brush,
	Eraser,
}

// Reusable component for drawing on a canvas element.
export default function Drawing() {
	const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
	const [points, setPoints] = useState<[number, number, string][]>([]);
	const [activeTool, setActiveTool] = useState<Tool>(Tool.Brush);

	useEffect(() => {
		const ctx = drawingCanvasRef.current?.getContext("2d");
		if (!ctx) return;
		ctx.clearRect(0, 0, 500, 500);
		const previousColor = ctx.fillStyle;
		points.forEach(([x, y, color]) => {
			ctx.fillStyle = color;
			ctx.beginPath();
			ctx.arc(x, y, 5, 0, 2 * Math.PI);
			ctx.fill();
		});
		ctx.fillStyle = previousColor;
	}, [points, setPoints, drawingCanvasRef]);

	const handleDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
		const rect = drawingCanvasRef.current?.getBoundingClientRect();
		if (!rect) return;
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		if (activeTool === Tool.Brush) {
			setPoints((prev) => [...prev, [x, y, "#000"]]);
		} else if (activeTool === Tool.Eraser) {
			setPoints((prev) => prev.filter(([px, py]) => Math.hypot(px - x, py - y) > 10));
		}
	};

  return (
    <div className="m-4 flex h-min w-min flex-col items-center rounded-lg border-2 p-4 shadow">
      <canvas
        width={500}
        height={500}
				ref={drawingCanvasRef}
				onMouseMove={(e) => e.buttons === 1 && handleDraw(e)}
        className="rounded-lg bg-accent"
      />
      <ButtonGroup className="mt-4">
        <ButtonGroup>
          <Button variant="outline" size="icon" onClick={() => setPoints([])}>
            <Trash2Icon />
          </Button>
        </ButtonGroup>
        <ButtonGroup>
          <Button variant="outline" size="icon" onClick={() => setActiveTool(Tool.Brush)} className={activeTool === Tool.Brush ? "-translate-y-1" : ""}>
            <BrushIcon />
          </Button>
          <Button variant="outline" size="icon" onClick={() => setActiveTool(Tool.Eraser)} className={activeTool === Tool.Eraser ? "-translate-y-1" : ""}>
            <EraserIcon />
          </Button>
        </ButtonGroup>
      </ButtonGroup>
    </div>
  );
}
