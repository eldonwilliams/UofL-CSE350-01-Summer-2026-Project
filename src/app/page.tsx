"use client";

import { REALTIME_SUBSCRIBE_STATES } from "@supabase/supabase-js";
import { Link2Icon, LogOutIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
} from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/ui/ThemeToggle";
import useRoom from "~/lib/useRoom";
import Drawing, { type CanvasData } from "./_components/Drawing";
import JoinRoomDialog from "./_components/JoinRoomDialog";

export default function Home() {
  const [connectionData, setConnectionData] = useState<{
    localUser: string;
    room: string;
  }>({
    localUser: "",
    room: "",
  });

  const { roomState, users, connectionState, connect, sendUpdate } =
    useRoom<CanvasData>({ ...connectionData, defaultState: [], });

  useEffect(() => {
    if (connectionData.localUser !== "" && connectionData.room !== "")
      connect();
  }, [connectionData, connect]);

  useEffect(() => {
    console.log(Array.from(roomState))
  }, [roomState])

  return (
    <main className="bg-background text-foreground min-h-screen transition-colors duration-300">
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="flex flex-col items-center">
        <p className="pt-4 text-2xl font-bold">Drawing Demo</p>
        {connectionState === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED && (
          <Drawing canvas={[Array.from(roomState) ?? [], sendUpdate]} />
        )}
        {connectionState !== REALTIME_SUBSCRIBE_STATES.SUBSCRIBED && (
          <Drawing />
        )}
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
                  onConfirm={(localUser, room) => {
                    setConnectionData({ localUser, room });
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
