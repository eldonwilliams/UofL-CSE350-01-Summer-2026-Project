"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "./supabase/client";
import {
  REALTIME_SUBSCRIBE_STATES,
  type RealtimeChannel,
} from "@supabase/supabase-js";

export type ConnectionData<T> = {
  localUser: string;
  room: string;
  defaultState?: T;
  /**
   * How a patch is applied to the current state.
   * Defaults to a shallow object merge — override this if T isn't a flat
   * object (e.g. deep-merge, array ops, CRDT apply, etc.)
   */
  merge?: (current: T, patch: Partial<T>) => T;
  /**
   * How long (ms) a fresh joiner waits for a state_sync reply before
   * assuming the room is empty/new and using defaultState.
   */
  syncTimeoutMs?: number;
};

type Presence = { user: string };

type UpdatePayload<T> = { state: T };
type PatchPayload<T> = { patch: Partial<T> };
type SyncRequestPayload = { requester: string };
type SyncReplyPayload<T> = { target: string; state: T };

const defaultMerge = <T>(current: T, patch: Partial<T>): T =>
  ({ ...(current as object), ...(patch as object) }) as T;

export default function useRoom<T>({
  localUser,
  room,
  defaultState,
  merge = defaultMerge,
  syncTimeoutMs = 2000,
}: ConnectionData<T>) {
  const [users, setUsers] = useState<string[]>([]);
  const [roomState, setRoomState] = useState<T>(defaultState as T);
  const [connectionState, setConnectionState] =
    useState<REALTIME_SUBSCRIBE_STATES>(REALTIME_SUBSCRIBE_STATES.CLOSED);
  // true once we either received the room's state or established we're first in
  const [isSynced, setIsSynced] = useState(false);

  const channelRef = useRef<RealtimeChannel | null>(null);

  // Broadcast handlers are registered once per channel, so they'd close over
  // stale React state. Mirror everything they need into refs.
  const stateRef = useRef<T>(defaultState as T);
  const syncedRef = useRef(false);
  const pendingPatchesRef = useRef<Partial<T>[]>([]);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mergeRef = useRef(merge);
  mergeRef.current = merge;

  useEffect(() => {
    const channel = createClient().channel(`rooms:${room}:paint`, {
      config: {
        // private: true,
        presence: { key: localUser },
        // note: broadcast.self defaults to false, so we never receive our
        // own broadcasts back — local state is updated optimistically instead
      },
    });
    channelRef.current = channel;

    // reset sync bookkeeping whenever the room/channel changes
    syncedRef.current = false;
    setIsSynced(false);
    stateRef.current = defaultState as T;
    setRoomState(defaultState as T);
    pendingPatchesRef.current = [];

    const applyState = (next: T) => {
      stateRef.current = next;
      setRoomState(next);
    };

    /**
     * Marks us as having authoritative state and flushes any patches that
     * arrived while we were still waiting for the initial sync.
     */
    const markSynced = () => {
      if (syncedRef.current) return;
      syncedRef.current = true;
      setIsSynced(true);
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      let next = stateRef.current;
      for (const patch of pendingPatchesRef.current) {
        next = mergeRef.current(next, patch);
      }
      pendingPatchesRef.current = [];
      applyState(next);
    };

    channel
      // full-state replacement (also doubles as an implicit sync)
      .on("broadcast", { event: "update" }, ({ payload }) => {
        const { state } = payload as UpdatePayload<T>;
        stateRef.current = state;
        markSynced(); // flushes pending patches on top, sets React state
        applyState(stateRef.current);
      })
      // partial update
      .on("broadcast", { event: "patch" }, ({ payload }) => {
        const { patch } = payload as PatchPayload<T>;
        if (!syncedRef.current) {
          // We joined mid-session and haven't received the base state yet;
          // buffer the patch and replay it once state_sync arrives.
          pendingPatchesRef.current.push(patch);
          return;
        }
        applyState(mergeRef.current(stateRef.current, patch));
      })
      // a newcomer is asking for the current state
      .on("broadcast", { event: "request_state" }, ({ payload }) => {
        const { requester } = payload as SyncRequestPayload;
        if (requester === localUser) return;
        if (!syncedRef.current) return; // we don't have authoritative state either

        // Deterministically pick ONE responder so the newcomer isn't
        // flooded: the alphabetically-first present user (excluding the
        // requester) answers.
        const present = Object.keys(channel.presenceState<Presence>())
          .filter((key) => key !== requester)
          .sort();
        if (present[0] !== localUser) return;

        void channel.send({
          type: "broadcast",
          event: "state_sync",
          payload: {
            target: requester,
            state: stateRef.current,
          } satisfies SyncReplyPayload<T>,
        });
      })
      // an existing member sent us the current state
      .on("broadcast", { event: "state_sync" }, ({ payload }) => {
        const { target, state } = payload as SyncReplyPayload<T>;
        if (target !== localUser) return; // meant for someone else
        if (syncedRef.current) return; // already have state; ignore stragglers
        stateRef.current = state;
        markSynced(); // replays any patches that raced ahead of the sync
      })
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<Presence>();
        const names = Object.values(state).flatMap((presences) =>
          presences.map((p) => p.user),
        );
        setUsers(names);
        // If we're provably alone in the room, there's no one to sync from —
        // our defaultState IS the room state. No need to wait for the timeout.
        if (
          !syncedRef.current &&
          names.length === 1 &&
          names[0] === localUser
        ) {
          markSynced();
        }
      });

    return () => {
      if (syncTimerRef.current) {
        clearTimeout(syncTimerRef.current);
        syncTimerRef.current = null;
      }
      void createClient().removeChannel(channel);
      channelRef.current = null;
    };
    // defaultState intentionally omitted: it's an initial value, and objects
    // passed inline would re-create the channel every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [room, localUser]);

  /** Replace the entire room state (broadcast full snapshot). */
  const sendUpdate = useCallback((data: T) => {
    stateRef.current = data;
    syncedRef.current = true; // producing state makes us authoritative
    setIsSynced(true);
    setRoomState(data);
    void channelRef.current?.send({
      type: "broadcast",
      event: "update",
      payload: { state: data } satisfies UpdatePayload<T>,
    });
  }, []);

  /** Send only what changed; everyone (including us) merges it in. */
  const sendPatch = useCallback((patch: Partial<T>) => {
    const next = mergeRef.current(stateRef.current, patch);
    stateRef.current = next;
    syncedRef.current = true;
    setIsSynced(true);
    setRoomState(next);
    void channelRef.current?.send({
      type: "broadcast",
      event: "patch",
      payload: { patch } satisfies PatchPayload<T>,
    });
  }, []);

  return {
    users,
    roomState,
    /** false until we've received the room's state (or confirmed we're first) */
    isSynced,
    sendUpdate,
    sendPatch,
    connectionState,
    connect: () => {
      const channel = channelRef.current;
      channel?.subscribe((status) => {
        setConnectionState(status);
        if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
          void channel.track({ user: localUser });

          // Ask existing members for the current state...
          void channel.send({
            type: "broadcast",
            event: "request_state",
            payload: { requester: localUser } satisfies SyncRequestPayload,
          });

          // ...and if nobody answers (empty room, or the only other member
          // hasn't synced either), fall back to defaultState after a beat.
          if (!syncedRef.current && !syncTimerRef.current) {
            syncTimerRef.current = setTimeout(() => {
              syncTimerRef.current = null;
              if (!syncedRef.current) {
                syncedRef.current = true;
                setIsSynced(true);
                // flush anything that trickled in
                let next = stateRef.current;
                for (const p of pendingPatchesRef.current) {
                  next = mergeRef.current(next, p);
                }
                pendingPatchesRef.current = [];
                stateRef.current = next;
                setRoomState(next);
              }
            }, syncTimeoutMs);
          }
        }
      });
    },
  };
}
