"use client";

import {
  BrushIcon,
  DownloadCloudIcon,
  EraserIcon,
  PaletteIcon,
  PipetteIcon,
  Trash2Icon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { ButtonGroup, ButtonGroupText } from "~/components/ui/button-group";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Slider } from "~/components/ui/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { useEyeDropper } from "~/lib/useEyedrop";

enum Tool {
  Brush,
  Eraser,
}

type ToolSettings = {
  size: number;
  color: string;
};

const colors: { name: string; hex: string }[] = [
  { name: "Black", hex: "#000" },
  { name: "Red", hex: "#f00" },
  { name: "Green", hex: "#0f0" },
  { name: "Blue", hex: "#00f" },
  { name: "Yellow", hex: "#ff0" },
  { name: "Purple", hex: "#800080" },
];

// Reusable component for drawing on a canvas element.
export default function Drawing() {
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<[number, number, number, string][]>([]);
  const [activeTool, setActiveTool] = useState<Tool>(Tool.Brush);
  const [toolSettings, setToolSettings] = useState<ToolSettings>({
    size: 1,
    color: "#000",
  });
  const { color, openPicker } = useEyeDropper();

  useEffect(() => {
    setToolSettings((settings) => ({ ...settings, color: color ?? "#000" }));
  }, [color]);

  useEffect(() => {
    const ctx = drawingCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, 500, 500);
    const previousColor = ctx.fillStyle;
    points.forEach(([x, y, size, color]) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, 2 * Math.PI);
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
      setPoints((prev) => [
        ...prev,
        [x, y, toolSettings.size, toolSettings.color],
      ]);
    } else if (activeTool === Tool.Eraser) {
      setPoints((prev) =>
        prev.filter(([px, py]) => Math.hypot(px - x, py - y) > 10),
      );
    }
  };

  return (
    <div className="m-4 flex h-min w-min flex-col items-center rounded-lg border-2 p-4 shadow">
      <canvas
        width={500}
        height={500}
        ref={drawingCanvasRef}
        onMouseMove={(e) => e.buttons === 1 && handleDraw(e)}
        className="bg-accent rounded-lg"
      />

      <div className="f">
        <ButtonGroup className="mt-4">
          <ButtonGroup>
            <ButtonGroupText asChild>
              <p>Actions</p>
            </ButtonGroupText>
            <Button variant="outline" size="icon" onClick={() => setPoints([])}>
              <Trash2Icon />
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <DownloadCloudIcon />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Not implemented yet, coming soon.</TooltipContent>
            </Tooltip>
          </ButtonGroup>
          <ButtonGroup>
            <ButtonGroupText asChild>
              <p>Tools</p>
            </ButtonGroupText>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setActiveTool(Tool.Brush)}
              className={activeTool === Tool.Brush ? "-translate-y-1" : ""}
            >
              <BrushIcon />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setActiveTool(Tool.Eraser)}
              className={activeTool === Tool.Eraser ? "-translate-y-1" : ""}
            >
              <EraserIcon />
            </Button>
          </ButtonGroup>
          <ButtonGroup>
            <ButtonGroupText asChild>
              <p>Settings</p>
            </ButtonGroupText>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon">
                  <PaletteIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="max-w-max">
                <PopoverHeader>
                  <PopoverTitle className="flex flex-row items-center justify-evenly gap-2">
                    {"Palette"}
                    <div
                      className="h-2 w-full"
                      style={{ backgroundColor: toolSettings.color }}
                    ></div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => openPicker()}
                    >
                      <PipetteIcon />
                    </Button>
                  </PopoverTitle>
                </PopoverHeader>
                <div className="flex flex-row flex-wrap gap-2">
                  {colors.map(({ name, hex }) => (
                    <div
                      key={name}
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: hex }}
                      onClick={() =>
                        setToolSettings((settings) => ({
                          ...settings,
                          color: hex,
                        }))
                      }
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="outline" className="w-32">
              <Slider
                defaultValue={[0]}
                min={0}
                max={5}
                step={0.25}
                value={[toolSettings.size]}
                onValueChange={(v) =>
                  setToolSettings((settings) => ({
                    ...settings,
                    size: v[0] ?? 0,
                  }))
                }
              />
              <div
                className="rounded-full"
                style={{
                  width: toolSettings.size * 2.5,
                  height: toolSettings.size * 2.5,
                  backgroundColor: toolSettings.color,
                }}
              ></div>
            </Button>
          </ButtonGroup>
        </ButtonGroup>
      </div>
    </div>
  );
}
