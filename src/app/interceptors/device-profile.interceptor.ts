import {
  HttpInterceptorFn, HttpRequest, HttpHandlerFn,
} from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DeviceMetabolismService } from '../services/device-metabolism.service';

/**
 * deviceProfileInterceptor — Layer 15: Regenerative Device Metabolism (Prompt 16)
 *
 * Injects device profile headers on every API request so the server can:
 *   1. Gate energy-intensive module activations on low-battery devices (C3).
 *   2. Record device context in UCE hardware lineage.
 *   3. Apply appropriate delta compression and payload size limits.
 *
 * Headers injected:
 *   X-Battery-Level  — 0-1 float, from Battery Status API (Chrome) or omitted
 *   X-Network-Type   — 'wifi' | 'cellular' | 'unknown', from Navigator Connection API
 *
 * Both APIs degrade gracefully — if unavailable, no header is sent and the server
 * falls back to its client-type defaults (desktop = full energy, WiFi).
 *
 * C3: the server uses these to enforce the low-bandwidth mandate per device class.
 * C6: battery level is device state, not identity — safe to transmit.
 */
export const deviceProfileInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const platform  = inject(PLATFORM_ID);
  const metabol   = inject(DeviceMetabolismService);

  if (!isPlatformBrowser(platform) || !req.urlWithParams.includes('/api/')) {
    return next(req);
  }

  const headers: Record<string, string> = {};

  // Battery Level (Battery Status API — Chrome only)
  const batteryLevel = metabol.batteryLevel();
  if (batteryLevel !== null) {
    headers['X-Battery-Level'] = String(batteryLevel.toFixed(2));
  }

  // Network Type (Navigator Connection API)
  const networkType = metabol.networkType();
  if (networkType) {
    headers['X-Network-Type'] = networkType;
  }

  if (Object.keys(headers).length === 0) return next(req);

  return next(req.clone({ setHeaders: headers }));
};
