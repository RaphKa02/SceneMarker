import logger from '$lib/logger';
import type { ActionArray } from '$lib/useActions';
import { convertFileSrc } from '@tauri-apps/api/core';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, 'child'> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, 'children'> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & {
  ref?: U | null;
  use?: ActionArray;
};

export function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function preventDefault<T extends Event>(fn?: (event: T) => void) {
  return function (event: T) {
    event.preventDefault();
    fn?.(event);
  };
}

export function stopPropagation(fn?: (event: MouseEvent) => void) {
  return function (event: MouseEvent) {
    event.stopPropagation();
    fn?.(event);
  };
}

export function once<T extends Event>(fn?: (event: T) => void) {
  return function (event: T) {
    fn?.(event);
    fn = undefined;
  };
}

export function convertFile(filePath: string) {
  try {
    return convertFileSrc(filePath);
  } catch (e) {
    logger.error(`Fehler bei convertFileSrc: ${e}`);
  }
}
