/* eslint-disable @typescript-eslint/no-unsafe-member-access */
"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import type { ConnectionData } from "~/lib/useRoom";

type JoinRoomDialogProps = {
  onConfirm: (data: ConnectionData) => void;
  triggerLabel?: string;
};

export default function JoinRoomDialog({
  onConfirm,
  triggerLabel = "Join room",
}: JoinRoomDialogProps) {
  const [open, setOpen] = useState(false);
  const [localUser, setLocalUser] = useState("");
  const [room, setRoom] = useState("");

  const canConfirm = localUser.trim().length > 0 && room.trim().length > 0;

  const handleConfirm = () => {
    if (!canConfirm) return;
    onConfirm({ localUser: localUser.trim(), room: room.trim() });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join a room</DialogTitle>
          <DialogDescription>
            Enter a username and room key to connect.
          </DialogDescription>
        </DialogHeader>

        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={localUser}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          onChange={(e) => setLocalUser(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          placeholder="e.g. eldon"
          autoFocus
        />
        <Label htmlFor="room-key">Room key</Label>
        <Input
          id="room-key"
          value={room}
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          onChange={(e) => setRoom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          placeholder="e.g. lobby"
        />

        <DialogFooter>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
