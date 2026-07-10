"use client";

import {
  BrushIcon,
  DownloadCloudIcon,
  EraserIcon,
  PaletteIcon,
  PipetteIcon,
  Trash2Icon,
  Undo2Icon,
  Redo2Icon,
  MinusIcon,
  SquareIcon,
  CircleIcon,
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
import { useEyeDropper } from "~/lib/useEyedrop";
import { jsPDF } from "jspdf";

/**
 * Supported canvas drawing tools.
 */
enum Tool {
  Brush,
  Line,
  Rectangle,
  Circle,
  Eraser,
}

/**
 * Brush size and color settings.
 */
type ToolSettings = {
  size: number;
  color: string;
};

/**
 * Data structure representing a stroke or geometric shape drawn on the canvas.
 */
type DrawingItem = {
  type: "brush" | "line" | "rectangle" | "circle";
  points: [number, number][];
  size: number;
  color: string;
};

// Represents all the data needed to reender to the canvas, collection of drawing items. May be reworked
export type CanvasData = DrawingItem[];

/**
 * Preset colors for the palette picker grid.
 */
const colors: { name: string; hex: string }[] = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#ffffff" },
  { name: "Red", hex: "#ef4444" },
  { name: "Orange", hex: "#f97316" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Yellow", hex: "#eab308" },
  { name: "Lime", hex: "#84cc16" },
  { name: "Green", hex: "#22c55e" },
];

function resolveColor(original: string, isDark: boolean): string {
  if (isDark && (original === "#000000" || original === "#000"))
    return "#ffffff";
  if (!isDark && (original === "#ffffff" || original === "#fff"))
    return "#000000";
  return original;
}

function distToSegment(
  [px, py]: [number, number],
  [x1, y1]: [number, number],
  [x2, y2]: [number, number],
) {
  const l2 = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function renderDrawingItems(
  ctx: CanvasRenderingContext2D,
  items: DrawingItem[],
  isDark: boolean,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const item of items) {
    if (item.points.length === 0) continue;

    const renderColor = resolveColor(item.color, isDark);
    ctx.strokeStyle = renderColor;
    ctx.fillStyle = renderColor;
    ctx.lineWidth = item.size * 2;

    const [startX, startY] = item.points[0]!;
    const lastPoint = item.points[item.points.length - 1]!;
    const [endX, endY] = lastPoint;

    if (item.type === "brush") {
      if (item.points.length === 1) {
        ctx.beginPath();
        ctx.arc(startX, startY, item.size, 0, 2 * Math.PI);
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        for (let i = 1; i < item.points.length; i++) {
          const [x, y] = item.points[i]!;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    } else if (item.type === "line") {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    } else if (item.type === "rectangle") {
      ctx.beginPath();
      const rectWidth = endX - startX;
      const rectHeight = endY - startY;
      ctx.strokeRect(startX, startY, rectWidth, rectHeight);
    } else if (item.type === "circle") {
      ctx.beginPath();
      const radius = Math.hypot(endX - startX, endY - startY);
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
}

export type DrawingProps = {
  canvas?: [CanvasData, (data: CanvasData) => void]; // The canvas to be rendered onto the drawing
};

// Reusable component for drawing on a canvas element.
export default function Drawing({ canvas }: DrawingProps) {
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const [localCanvasData, setLocalCanvasData] = useState<CanvasData>([]);
  const [canvasData, setCanvasData] = canvas ?? [localCanvasData, setLocalCanvasData];
  const [redoStack, setRedoStack] = useState<DrawingItem[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>(Tool.Brush);
  const [selectedShapeTool, setSelectedShapeTool] = useState<
    Tool.Line | Tool.Rectangle | Tool.Circle
  >(Tool.Rectangle);
  const [toolSettings, setToolSettings] = useState<ToolSettings>({
    size: 1,
    color: "#000000",
  });
  const { color, openPicker } = useEyeDropper();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setToolSettings((settings) => {
      if (
        isDark &&
        (settings.color === "#000000" || settings.color === "#000")
      ) {
        return { ...settings, color: "#ffffff" };
      }
      if (
        !isDark &&
        (settings.color === "#ffffff" || settings.color === "#fff")
      ) {
        return { ...settings, color: "#000000" };
      }
      return settings;
    });
  }, [isDark]);

  useEffect(() => {
    setToolSettings((settings) => ({
      ...settings,
      color: color ?? (isDark ? "#ffffff" : "#000000"),
    }));
  }, [color, isDark]);

  useEffect(() => {
    const ctx = drawingCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    renderDrawingItems(ctx, canvasData, isDark, 500, 500);
  }, [canvasData, drawingCanvasRef, isDark]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = drawingCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === Tool.Eraser) {
      setRedoStack([]);
      setCanvasData(
        canvasData.filter((item) => {
          if (item.points.length === 0) return true;

          const [startX, startY] = item.points[0]!;
          const [endX, endY] = item.points[item.points.length - 1]!;

          if (item.type === "brush") {
            return !item.points.some(
              ([px, py]) => Math.hypot(px - x, py - y) <= 10,
            );
          }
          if (item.type === "line") {
            const dist = distToSegment([x, y], [startX, startY], [endX, endY]);
            return dist > 10;
          }
          if (item.type === "rectangle") {
            const onBorder =
              (Math.abs(x - startX) <= 10 &&
                y >= Math.min(startY, endY) &&
                y <= Math.max(startY, endY)) ||
              (Math.abs(x - endX) <= 10 &&
                y >= Math.min(startY, endY) &&
                y <= Math.max(startY, endY)) ||
              (Math.abs(y - startY) <= 10 &&
                x >= Math.min(startX, endX) &&
                x <= Math.max(startX, endX)) ||
              (Math.abs(y - endY) <= 10 &&
                x >= Math.min(startX, endX) &&
                x <= Math.max(startX, endX));
            return !onBorder;
          }
          if (item.type === "circle") {
            const radius = Math.hypot(endX - startX, endY - startY);
            const distFromCenter = Math.hypot(x - startX, y - startY);
            return Math.abs(distFromCenter - radius) > 10;
          }
          return true;
        }),
      );
    } else {
      setIsDrawing(true);
      setRedoStack([]);

      let itemType: "brush" | "line" | "rectangle" | "circle" = "brush";
      if (activeTool === Tool.Line) itemType = "line";
      else if (activeTool === Tool.Rectangle) itemType = "rectangle";
      else if (activeTool === Tool.Circle) itemType = "circle";

      setCanvasData([
        ...canvasData,
        {
          type: itemType,
          points: [[x, y]],
          size: toolSettings.size,
          color: toolSettings.color,
        },
      ]);
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const rect = drawingCanvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const updated = [...canvasData];
    const last = updated[updated.length - 1];
    if (last) {
      if (last.type === "brush") {
        updated[updated.length - 1] = {
          ...last,
          points: [...last.points, [x, y]],
        };
      } else {
        updated[updated.length - 1] = {
          ...last,
          points: [last.points[0]!, [x, y]],
        };
      }
    }
    setCanvasData(updated);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  const handleUndo = () => {
    if (canvasData.length === 0) return;
    const last = canvasData[canvasData.length - 1]!;
    setRedoStack((redo) => [...redo, last]);
    setCanvasData(canvasData.slice(0, -1));
  };

  const handleRedo = () => {
    setRedoStack((redo) => {
      if (redo.length === 0) return redo;
      const last = redo[redo.length - 1]!;
      setCanvasData([...canvasData, last]);
      return redo.slice(0, -1);
    });
  };

  const getExportDataUrl = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 500;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    let bgColor = "#f3f4f6";
    if (isDark) {
      bgColor = "#1e293b";
    }
    if (drawingCanvasRef.current) {
      const computed = window.getComputedStyle(drawingCanvasRef.current);
      bgColor = computed.backgroundColor || bgColor;
    }

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 500, 500);

    renderDrawingItems(ctx, canvasData, isDark, 500, 500);

    return canvas.toDataURL("image/png");
  };

  const handleDownloadPNG = () => {
    const dataUrl = getExportDataUrl();
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.download = "drawing.png";
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    const dataUrl = getExportDataUrl();
    if (!dataUrl) return;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: [500, 550],
    });

    pdf.addImage(dataUrl, "PNG", 0, 0, 500, 500);
    pdf.save("drawing.pdf");
  };

  return (
    <div className="bg-card text-card-foreground m-4 flex h-min w-min flex-col items-center rounded-lg border-2 p-4 shadow">
      <div className="flex flex-row items-start gap-2">
        <canvas
          width={500}
          height={500}
          ref={drawingCanvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="bg-accent touch-none rounded-lg"
        />
        <div className="flex flex-col gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleUndo}
            disabled={canvasData.length === 0}
            aria-label="Undo"
          >
            <Undo2Icon className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            aria-label="Redo"
          >
            <Redo2Icon className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="f">
        <ButtonGroup className="mt-4">
          <ButtonGroup>
            <ButtonGroupText asChild>
              <p>Actions</p>
            </ButtonGroupText>
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                setCanvasData([]);
                setRedoStack([]);
              }}
            >
              <Trash2Icon />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Export drawing"
                >
                  <DownloadCloudIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="flex w-40 flex-col gap-1 p-2">
                <Button
                  variant="ghost"
                  className="w-full cursor-pointer justify-start text-xs font-medium"
                  onClick={handleDownloadPNG}
                >
                  Download PNG
                </Button>
                <Button
                  variant="ghost"
                  className="w-full cursor-pointer justify-start text-xs font-medium"
                  onClick={handleDownloadPDF}
                >
                  Download PDF
                </Button>
              </PopoverContent>
            </Popover>
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
              title="Brush"
            >
              <BrushIcon />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={
                    activeTool === Tool.Line ||
                    activeTool === Tool.Rectangle ||
                    activeTool === Tool.Circle
                      ? "border-primary bg-accent -translate-y-1"
                      : ""
                  }
                  title="Shapes"
                >
                  {selectedShapeTool === Tool.Line && <MinusIcon />}
                  {selectedShapeTool === Tool.Rectangle && <SquareIcon />}
                  {selectedShapeTool === Tool.Circle && <CircleIcon />}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-card border-border flex w-36 flex-row justify-center gap-1 border p-1">
                <Button
                  variant={activeTool === Tool.Line ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => {
                    setSelectedShapeTool(Tool.Line);
                    setActiveTool(Tool.Line);
                  }}
                  title="Line"
                >
                  <MinusIcon className="size-4" />
                </Button>
                <Button
                  variant={activeTool === Tool.Rectangle ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => {
                    setSelectedShapeTool(Tool.Rectangle);
                    setActiveTool(Tool.Rectangle);
                  }}
                  title="Rectangle"
                >
                  <SquareIcon className="size-4" />
                </Button>
                <Button
                  variant={activeTool === Tool.Circle ? "default" : "ghost"}
                  size="icon-sm"
                  onClick={() => {
                    setSelectedShapeTool(Tool.Circle);
                    setActiveTool(Tool.Circle);
                  }}
                  title="Circle"
                >
                  <CircleIcon className="size-4" />
                </Button>
              </PopoverContent>
            </Popover>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setActiveTool(Tool.Eraser)}
              className={activeTool === Tool.Eraser ? "-translate-y-1" : ""}
              title="Eraser"
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
              <PopoverContent className="w-56">
                <PopoverHeader>
                  <PopoverTitle className="flex flex-row items-center justify-evenly gap-2">
                    {"Palette"}
                    <div
                      className="h-2 w-full rounded"
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
                <div className="grid grid-cols-8 gap-1.5 pb-2">
                  {colors.map(({ name, hex }) => (
                    <div
                      key={name}
                      className="border-border h-4 w-4 cursor-pointer rounded-full border transition-transform hover:scale-125"
                      style={{
                        backgroundColor: hex,
                        outline:
                          toolSettings.color === hex
                            ? "2px solid var(--ring)"
                            : undefined,
                        outlineOffset: "1px",
                      }}
                      title={name}
                      onClick={() =>
                        setToolSettings((settings) => ({
                          ...settings,
                          color: hex,
                        }))
                      }
                    />
                  ))}
                </div>
                <div className="border-border flex items-center gap-2 border-t pt-1">
                  <label className="text-muted-foreground text-xs whitespace-nowrap">
                    Custom
                  </label>
                  <input
                    type="color"
                    value={toolSettings.color}
                    onChange={(e) =>
                      setToolSettings((settings) => ({
                        ...settings,
                        color: e.target.value,
                      }))
                    }
                    className="border-border h-6 w-8 cursor-pointer rounded border bg-transparent"
                  />
                  <span className="text-muted-foreground font-mono text-xs">
                    {toolSettings.color}
                  </span>
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
