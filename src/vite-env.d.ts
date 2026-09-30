/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

declare module 'virtual:pwa-register' {
  export type RegisterSWOptions = {
    immediate?: boolean;
    onNeedRefresh?: () => void;
    onOfflineReady?: () => void;
    onRegistered?: (registration?: ServiceWorkerRegistration) => void;
    onRegisterError?: (error: unknown) => void;
  };
  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>;
}

interface Navigator {
  wakeLock?: {
    request(type: 'screen'): Promise<WakeLockSentinel>;
  };
  bluetooth?: Bluetooth;
}

interface WakeLockSentinel extends EventTarget {
  readonly released: boolean;
  readonly type: 'screen';
  release(): Promise<void>;
  onrelease: ((this: WakeLockSentinel, ev: Event) => unknown) | null;
}

interface DeviceOrientationEvent {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
}

interface DeviceLightEvent extends Event {
  value: number;
}

interface WindowEventMap {
  devicelight: DeviceLightEvent;
}

interface BluetoothLEScan extends EventTarget {
  active: boolean;
  stop(): void;
}

interface BluetoothLEScanOptions {
  keepRepeatedDevices?: boolean;
  acceptAllAdvertisements?: boolean;
}

interface BluetoothDevice extends EventTarget {
  readonly id: string;
  readonly name?: string;
}

interface RequestDeviceOptions {
  filters?: Array<Record<string, unknown>>;
  optionalServices?: string[];
  acceptAllDevices?: boolean;
}

interface Bluetooth extends EventTarget {
  getAvailability?: () => Promise<boolean>;
  requestDevice(options: RequestDeviceOptions): Promise<BluetoothDevice>;
  requestLEScan?: (options?: BluetoothLEScanOptions) => Promise<BluetoothLEScan>;
}
