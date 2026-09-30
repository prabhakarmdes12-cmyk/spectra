import type { CapabilityDescriptor } from './types';

async function queryPermission(name: PermissionName): Promise<PermissionState | 'unknown'> {
  if (!('permissions' in navigator)) return 'unknown';
  try {
    const status = await navigator.permissions.query({ name } as PermissionDescriptor);
    return status.state;
  } catch {
    return 'unknown';
  }
}

export async function detectCapabilities(): Promise<CapabilityDescriptor[]> {
  const hasDeviceMotion = 'DeviceMotionEvent' in window;
  const hasDeviceOrientation = 'DeviceOrientationEvent' in window;
  const hasGenericMagnetometer = 'Magnetometer' in window;
  const hasMedia = !!navigator.mediaDevices?.getUserMedia;
  const micPermission = await queryPermission('microphone' as PermissionName);
  const cameraPermission = await queryPermission('camera' as PermissionName);
  const bluetoothAvailability = navigator.bluetooth?.getAvailability ? await navigator.bluetooth.getAvailability().catch(() => false) : Boolean(navigator.bluetooth);
  const hasWakeLock = Boolean(navigator.wakeLock?.request);
  const hasVibration = 'vibrate' in navigator;
  const hasAmbientLight = 'AmbientLightSensor' in window || 'ondevicelight' in window;

  return [
    {
      id: 'motion',
      label: 'Motion / Vibration',
      state: hasDeviceMotion ? 'available' : 'unavailable',
      detail: hasDeviceMotion ? 'DeviceMotionEvent stream can estimate vibration and steps.' : 'Motion events are not exposed by this browser.',
      quality: hasDeviceMotion ? 0.82 : 0,
    },
    {
      id: 'orientation',
      label: 'Compass / Orientation',
      state: hasDeviceOrientation ? 'available' : 'unavailable',
      detail: hasDeviceOrientation ? 'DeviceOrientationEvent heading, pitch and roll available.' : 'Orientation stream unavailable.',
      quality: hasDeviceOrientation ? 0.74 : 0,
    },
    {
      id: 'magnetometer',
      label: 'Magnetometer',
      state: hasGenericMagnetometer ? 'available' : hasDeviceOrientation ? 'limited' : 'unavailable',
      detail: hasGenericMagnetometer
        ? 'Generic Sensor magnetometer can read three-axis field magnitude.'
        : hasDeviceOrientation
          ? 'Compass heading exists, but raw magnetic µT is not available.'
          : 'No magnetometer-compatible API detected.',
      quality: hasGenericMagnetometer ? 0.9 : hasDeviceOrientation ? 0.38 : 0,
    },
    {
      id: 'microphone',
      label: 'Microphone / Audio FFT',
      state: hasMedia ? (micPermission === 'granted' ? 'available' : 'permission-required') : 'unavailable',
      permission: micPermission,
      detail: hasMedia ? 'Microphone enables waveform, transient and spectrogram analysis.' : 'Media capture unavailable.',
      quality: hasMedia ? 0.86 : 0,
    },
    {
      id: 'camera',
      label: 'Camera AR HUD',
      state: hasMedia ? (cameraPermission === 'granted' ? 'available' : 'permission-required') : 'unavailable',
      permission: cameraPermission,
      detail: hasMedia ? 'Environment camera can power AR reticle view with explicit permission.' : 'Camera capture unavailable.',
      quality: hasMedia ? 0.68 : 0,
    },
    {
      id: 'light',
      label: 'Ambient Light',
      state: hasAmbientLight ? 'available' : 'limited',
      detail: hasAmbientLight ? 'Ambient light sensor event detected.' : 'Direct lux is often blocked; camera luminance can be used only in AR mode.',
      quality: hasAmbientLight ? 0.7 : 0.22,
    },
    {
      id: 'bluetooth',
      label: 'Bluetooth / RF Beacons',
      state: bluetoothAvailability ? 'permission-required' : 'unavailable',
      detail: bluetoothAvailability ? 'Web Bluetooth can discover user-approved devices; RSSI is signal trend, not distance.' : 'Web Bluetooth unavailable; live RF layer disabled.',
      quality: bluetoothAvailability ? 0.55 : 0,
    },
    {
      id: 'wake-lock',
      label: 'Screen Wake Lock',
      state: hasWakeLock ? 'available' : 'limited',
      detail: hasWakeLock ? 'Screen can stay awake during active scans.' : 'Wake Lock API not available; OS sleep settings may apply.',
      quality: hasWakeLock ? 1 : 0.25,
    },
    {
      id: 'haptics',
      label: 'Haptic Feedback',
      state: hasVibration ? 'available' : 'limited',
      detail: hasVibration ? 'Vibration API can provide subtle anomaly ticks.' : 'Haptic feedback unavailable in this browser.',
      quality: hasVibration ? 0.8 : 0.1,
    },
  ];
}
