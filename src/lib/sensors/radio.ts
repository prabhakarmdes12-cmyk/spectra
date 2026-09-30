import type { RadioBeacon, RadioSample } from './types';
import { hashString, monotonicNow } from '../utils';

export class RadioAdapter {
  private beacons = new Map<string, RadioBeacon>();
  private scan: BluetoothLEScan | null = null;
  private previousIds = new Set<string>();
  private lastChurn = 0;
  private readonly onAdvertisement = (event: Event) => {
    const adv = event as Event & { device?: BluetoothDevice; rssi?: number; txPower?: number; name?: string };
    const rawId = adv.device?.id ?? adv.device?.name ?? adv.name ?? `bluetooth-${Date.now()}`;
    const id = hashString(rawId);
    this.beacons.set(id, {
      id,
      label: adv.device?.name ? `BLE ${adv.device.name}` : `BLE ${id.slice(0, 6)}`,
      rssi: adv.rssi,
      lastSeen: monotonicNow(),
      source: 'bluetooth',
    });
  };

  get supported() {
    return Boolean(navigator.bluetooth);
  }

  async startPassiveScan() {
    if (!navigator.bluetooth?.requestLEScan) return false;
    try {
      this.scan = await navigator.bluetooth.requestLEScan({ acceptAllAdvertisements: true, keepRepeatedDevices: true });
      navigator.bluetooth.addEventListener('advertisementreceived', this.onAdvertisement as EventListener);
      return true;
    } catch {
      return false;
    }
  }

  async requestOneDevice() {
    if (!navigator.bluetooth?.requestDevice) return false;
    try {
      const device = await navigator.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: [] });
      const id = hashString(device.id || device.name || String(Date.now()));
      this.beacons.set(id, {
        id,
        label: device.name ? `BLE ${device.name}` : `BLE ${id.slice(0, 6)}`,
        lastSeen: monotonicNow(),
        source: 'bluetooth',
      });
      return true;
    } catch {
      return false;
    }
  }

  stop() {
    try {
      this.scan?.stop();
    } catch {
      // ignore
    }
    navigator.bluetooth?.removeEventListener?.('advertisementreceived', this.onAdvertisement as EventListener);
    this.scan = null;
  }

  read(): RadioSample {
    const now = monotonicNow();
    for (const [id, beacon] of this.beacons) {
      if (now - beacon.lastSeen > 120_000) this.beacons.delete(id);
    }
    const ids = new Set(this.beacons.keys());
    let changed = 0;
    for (const id of ids) if (!this.previousIds.has(id)) changed += 1;
    for (const id of this.previousIds) if (!ids.has(id)) changed += 1;
    this.previousIds = ids;
    this.lastChurn = this.lastChurn * 0.85 + changed * 0.15;
    return {
      timestamp: now,
      supported: this.supported,
      scanning: Boolean(this.scan?.active),
      density: this.beacons.size,
      churn: this.lastChurn,
      beacons: [...this.beacons.values()],
      mode: this.supported ? 'live' : 'simulation-disabled',
    };
  }
}
