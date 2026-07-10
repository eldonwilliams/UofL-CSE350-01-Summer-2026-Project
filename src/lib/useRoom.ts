"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "./supabase/client";
import {
  REALTIME_SUBSCRIBE_STATES,
  type RealtimeChannel,
} from "@supabase/supabase-js";

export type ConnectionData = {
  localUser: string;
  room: string;
  defaultState?: unknown;
};

type Presence = { user: string };

export default function useRoom<T>({
  localUser,
  room,
  defaultState,
}: ConnectionData) {
  const [users, setUsers] = useState<string[]>([]);
  const [roomState, setRoomState] = useState<T>(defaultState as T);
  const [connectionState, setConnectionState] =
    useState<REALTIME_SUBSCRIBE_STATES>(REALTIME_SUBSCRIBE_STATES.CLOSED);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const channel = createClient().channel(`rooms:${room}:paint`, {
      config: {
        // private: true,
        presence: { key: localUser }, // ties the presence key to the username
      },
    });
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "update" }, ({ payload }) => {
        setRoomState(payload as T);
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<Presence>();
        setUsers(
          Object.values(state).flatMap((presences) =>
            presences.map((p) => p.user),
          ),
        );
      });

    return () => {
      void createClient().removeChannel(channel); // unsubscribes + cleans up
      channelRef.current = null;
    };
  }, [room, localUser]);

  const sendUpdate = useCallback((data: T) => {
    setRoomState(data);
    void channelRef.current?.send({
      type: "broadcast",
      event: "update",
      payload: data,
    });
  }, []);

  return {
    users,
    roomState,
    sendUpdate,
    connectionState,
    connect: () => {
      const channel = channelRef.current;
      channel?.subscribe((status) => {
        setConnectionState(status);
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          void channel.track({ user: localUser });
        }
      });
    },
  };
}
