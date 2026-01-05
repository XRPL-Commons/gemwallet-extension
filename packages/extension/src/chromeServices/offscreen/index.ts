/*
 * Offscreen Document
 * - Pings the background script to keep it alive, for session management
 * - Handles Ledger HID device events (connect/disconnect)
 */
export {};

// Keep background script alive
setInterval(() => {
  navigator.serviceWorker.ready.then((registration: ServiceWorkerRegistration) => {
    registration.active?.postMessage('keepAlive');
  });
}, 20e3);

/**
 * Ledger Hardware Wallet HID Event Listeners
 */

// Ledger USB Vendor ID
const LEDGER_USB_VENDOR_ID = 0x2c97;

export enum LedgerOffscreenAction {
  DEVICE_CONNECT = 'ledger:device:connect',
  DEVICE_DISCONNECT = 'ledger:device:disconnect',
}

// Initialize Ledger HID event listeners
function initLedgerHIDListeners() {
  // Listen for device connections
  if (navigator.hid) {
    navigator.hid.addEventListener('connect', ({ device }) => {
      if (device.vendorId === LEDGER_USB_VENDOR_ID) {
        // Notify background script
        chrome.runtime.sendMessage({
          action: LedgerOffscreenAction.DEVICE_CONNECT,
          payload: {
            vendorId: device.vendorId,
            productId: device.productId,
            productName: device.productName,
          },
        }).catch((error) => {
          console.error('[Offscreen] Failed to send connect message:', error);
        });
      }
    });

    // Listen for device disconnections
    navigator.hid.addEventListener('disconnect', ({ device }) => {
      if (device.vendorId === LEDGER_USB_VENDOR_ID) {
        // Notify background script
        chrome.runtime.sendMessage({
          action: LedgerOffscreenAction.DEVICE_DISCONNECT,
          payload: {
            vendorId: device.vendorId,
            productId: device.productId,
            productName: device.productName,
          },
        }).catch((error) => {
          console.error('[Offscreen] Failed to send disconnect message:', error);
        });
      }
    });
  } else {
    console.warn('[Offscreen] navigator.hid not available');
  }
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.action) {
    case 'ledger:check-device':
      // Check if Ledger device is connected
      if (navigator.hid) {
        navigator.hid.getDevices().then(devices => {
          const hasLedger = devices.some(device => device.vendorId === LEDGER_USB_VENDOR_ID);
          sendResponse({ connected: hasLedger });
        }).catch(error => {
          console.error('[Offscreen] Failed to get HID devices:', error);
          sendResponse({ connected: false, error: error.message });
        });
      } else {
        sendResponse({ connected: false, error: 'HID not available' });
      }
      return true; // Indicates async response

    default:
      return false;
  }
});

// Initialize Ledger listeners on load
initLedgerHIDListeners();
