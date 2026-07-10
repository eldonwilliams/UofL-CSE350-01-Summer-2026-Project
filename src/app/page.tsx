"use client";

import { Link2Icon, LogInIcon, LogOutIcon } from "lucide-react";
import Drawing, { type CanvasData } from "./_components/Drawing";
import { Button } from "~/components/ui/button";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
} from "~/components/ui/avatar";
import { ThemeToggle } from "~/components/ui/ThemeToggle";
import useRoom, { type ConnectionData } from "~/lib/useRoom";
import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import JoinRoomDialog from "./_components/JoinRoomDialog";
import { useState } from "react";

export default function Home() {
  const [connectionData, setConnectionData] = useState<ConnectionData>({
    localUser: "",
    room: "",
  });

  const { roomState, sendUpdate, users, connectionState, connect } =
    useRoom<CanvasData>({ ...connectionData, defaultState: [] });


  return (
    <main className="bg-background text-foreground min-h-screen transition-colors duration-300">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="flex flex-col items-center">
        <p className="pt-4 text-2xl font-bold">Drawing Demo</p>
        <Drawing
          {...(connectionState === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED && {
            canvas: roomState,
            canvasUpdate: sendUpdate,
          })}
        />
        <div className="flex w-1/2 flex-col">
          <div className="flex flex-row items-center justify-items-start gap-2">
            <p className="text-xl font-bold">My Board</p>
            <p className="text-accent-foreground font-light">{`${users.length}/10`}</p>
            {connectionState === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED && (
              <>
                <Button>
                  <Link2Icon /> Share
                </Button>
                <Button variant="destructive">
                  <LogOutIcon /> Leave
                </Button>
              </>
            )}
            {connectionState === REALTIME_SUBSCRIBE_STATES.CLOSED && (
              <>
                <JoinRoomDialog
                  onConfirm={(connectionData) => {
                    setConnectionData({ ...connectionData, defaultState: [] });
                    connect();
                  }}
                  triggerLabel="Join Room"
                />
              </>
            )}
          </div>
          <AvatarGroup>
            {users.map((user) => (
              <Avatar key={user}>
                <AvatarFallback>
                  {user
                    .split(" ")
                    .map((p) => p.slice(0, 1))
                    .join("")}
                </AvatarFallback>
                <AvatarBadge className="bg-green-500" />
              </Avatar>
            ))}
          </AvatarGroup>
        </div>
      </div>
    </main>
  );
}
