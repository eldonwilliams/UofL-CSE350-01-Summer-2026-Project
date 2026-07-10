"use client";

import { useMouse } from "@uidotdev/usehooks";
import { EraserIcon, MoveIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useRef } from "react";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import { lerpClamped } from "~/lib/utils";
import { ThemeToggle } from "~/components/ui/ThemeToggle";

export default function DrawPage() {
  const [mousePosition] = useMouse();
  const buttonGroupRef = useRef<HTMLDivElement>(null);

  return (
    <main className="relative min-h-screen bg-background text-foreground transition-colors duration-300 overflow-hidden">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div
        style={{
          backgroundColor: "var(--grid-bg)",
          backgroundImage:
            "linear-gradient(var(--grid-line-major) 2px, transparent 2px), linear-gradient(90deg, var(--grid-line-major) 2px, transparent 2px), linear-gradient(var(--grid-line-minor) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line-minor) 1px, var(--grid-bg) 1px)",
          backgroundSize: "50px 50px, 50px 50px, 10px 10px, 10px 10px",
          backgroundPosition: "-2px -2px, -2px -2px, -1px -1px, -1px -1px",
        }}
        className="h-[100vh] w-full transition-colors duration-300"
      ></div>
      <div className="drop-shadow-accent absolute top-8 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <ButtonGroup
          ref={buttonGroupRef}
          style={{
            scale: lerpClamped(
              3,
              1,
              Math.hypot(
                mousePosition.x -
                (buttonGroupRef.current?.getBoundingClientRect().left ?? 0),
                mousePosition.y -
                (buttonGroupRef.current?.getBoundingClientRect().top ?? 0),
              ) / 200,
            ),
          }}
        >
          <Button variant="outline" size="icon-lg">
            <MoveIcon />
          </Button>
          <Button variant="outline" size="icon-lg">
            <PencilIcon />
          </Button>
          <Button variant="outline" size="icon-lg">
            <EraserIcon />
          </Button>
          <Button variant="outline" size="icon-lg">
            <TrashIcon />
          </Button>
        </ButtonGroup>
      </div>
    </main>
  );
}
