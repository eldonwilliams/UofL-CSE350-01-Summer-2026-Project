import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t;
}

export function lerpClamped(start: number, end: number, t: number) {
  return start + (end - start) * Math.max(0, Math.min(1, t));
}
