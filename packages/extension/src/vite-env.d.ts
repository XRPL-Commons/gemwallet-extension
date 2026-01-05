/// <reference types="vite/client" />

// WebHID API type definitions
interface HIDDevice {
  opened: boolean;
  vendorId: number;
  productId: number;
  productName: string;
  collections: HIDCollectionInfo[];
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<DataView>;
}

interface HIDCollectionInfo {
  usagePage: number;
  usage: number;
  children?: HIDCollectionInfo[];
  inputReports?: HIDReportInfo[];
  outputReports?: HIDReportInfo[];
  featureReports?: HIDReportInfo[];
}

interface HIDReportInfo {
  reportId: number;
  items: HIDReportItem[];
}

interface HIDReportItem {
  isAbsolute?: boolean;
  isArray?: boolean;
  isRange?: boolean;
  hasNull?: boolean;
  usages?: number[];
  usageMinimum?: number;
  usageMaximum?: number;
  reportSize?: number;
  reportCount?: number;
  unitExponent?: number;
  unitSystem?: number;
  unitFactorLengthExponent?: number;
  unitFactorMassExponent?: number;
  unitFactorTimeExponent?: number;
  unitFactorTemperatureExponent?: number;
  unitFactorCurrentExponent?: number;
  unitFactorLuminousIntensityExponent?: number;
  logicalMinimum?: number;
  logicalMaximum?: number;
  physicalMinimum?: number;
  physicalMaximum?: number;
  strings?: string[];
}

interface HIDDeviceFilter {
  vendorId?: number;
  productId?: number;
  usagePage?: number;
  usage?: number;
}

interface HIDDeviceRequestOptions {
  filters: HIDDeviceFilter[];
}

interface HID extends EventTarget {
  getDevices(): Promise<HIDDevice[]>;
  requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[]>;
  addEventListener(
    type: 'connect' | 'disconnect',
    listener: (this: this, ev: HIDConnectionEvent) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
  removeEventListener(
    type: 'connect' | 'disconnect',
    listener: (this: this, ev: HIDConnectionEvent) => void,
    options?: boolean | EventListenerOptions
  ): void;
}

interface HIDConnectionEvent extends Event {
  device: HIDDevice;
}

interface Navigator {
  hid: HID;
}
