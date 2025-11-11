// src/api.ts — auto-detect dev endpoint (USB, emulator, Wi-Fi)
import { Platform } from 'react-native';

// Your LAN API (Wi-Fi)
const LAN_IP = 'http://10.220.114.91:5000';

// Candidates checked in order
const CANDIDATES: string[] = [
  'http://127.0.0.1:5000',                       // USB via adb reverse
  ...(Platform.OS === 'android' ? ['http://10.0.2.2:5000'] : []), // Android emulator
  ...(Platform.OS === 'ios' ? ['http://127.0.0.1:5000'] : []),    // iOS simulator
  LAN_IP,                                                      // Wi-Fi
];

async function fetchWithTimeout(url: string, ms = 1200): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

let resolvedBase: string | null = null;
let resolving: Promise<string> | null = null;

export async function getApiBase(): Promise<string> {
  if (resolvedBase) return resolvedBase;
  if (resolving) return resolving;

  resolving = (async () => {
    if (!__DEV__) return (resolvedBase = LAN_IP);
    for (const base of CANDIDATES) {
      try {
        const res = await fetchWithTimeout(`${base}/products`, 1200);
        if (res.ok) {
          resolvedBase = base;
          return base;
        }
      } catch {}
    }
    resolvedBase = LAN_IP;
    return LAN_IP;
  })();

  return resolving;
}

export async function getProductsUrl(): Promise<string> {
  const base = await getApiBase();
  return `${base}/products`;
}

export async function fetchProducts<T = unknown>(): Promise<T> {
  const url = await getProductsUrl();
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${res.statusText}${text ? ` – ${text.slice(0,180)}…` : ''}`);
  }
  return (await res.json()) as T;
}
