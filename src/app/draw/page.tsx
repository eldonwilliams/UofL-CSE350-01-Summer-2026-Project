"use client";

import { useMouse } from "@uidotdev/usehooks";
import { EraserIcon, MoveIcon, PencilIcon, TrashIcon } from "lucide-react";
import { useRef } from "react";
import { Button } from "~/components/ui/button";
import { ButtonGroup } from "~/components/ui/button-group";
import { lerpClamped } from "~/lib/utils";

export default function DrawPage() {
  const [mousePosition] = useMouse();
  const buttonGroupRef = useRef<HTMLDivElement>(null);

  return (
    <main>
      <div
        style={{
          backgroundColor: "#ffffff",
          opacity: 0.5,
          backgroundImage:
            "linear-gradient(#000000 2px, transparent 2px), linear-gradient(90deg, #000000 2px, transparent 2px), linear-gradient(#000000 1px, transparent 1px), linear-gradient(90deg, #000000 1px, #ffffff 1px)",
          backgroundSize: "50px 50px, 50px 50px, 10px 10px, 10px 10px",
          backgroundPosition: "-2px -2px, -2px -2px, -1px -1px, -1px -1px",
        }}
        className="h-[100vh] w-full"
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
