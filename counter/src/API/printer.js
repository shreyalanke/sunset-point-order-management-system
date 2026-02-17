import apiClient from ".";
import { onBluetoothStateChange, onPrinterStateChange, getBluetoothState, getPrinterState } from ".";

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
async function connect_a() {
    return await (new Promise((resolve)=>{
        const id = crypto?.randomUUID ? crypto.randomUUID() : uuid();
        window.__nativePromises[id] = resolve;
        window.PrinterNativeApi.connectPrinter(
            id
        );
    }))
}

async function printOrder_a(orderId, printType = 'KOT') {
    await (new Promise((resolve)=>{
        const id = crypto?.randomUUID ? crypto.randomUUID() : uuid();
        window.__nativePromises[id] = resolve;
        window.PrinterNativeApi.printOrder(
            id,
            orderId,
            printType 
        );
    }));
}

async function getStatus_a() {
    return await (new Promise((resolve)=>{
        const id = crypto?.randomUUID ? crypto.randomUUID() : uuid();
        window.__nativePromises[id] = resolve;
        window.PrinterNativeApi.getStatus(id);
    }));
}

async function checkConnection_a() {
    return await (new Promise((resolve)=>{
        const id = crypto?.randomUUID ? crypto.randomUUID() : uuid();
        window.__nativePromises[id] = resolve;
        window.PrinterNativeApi.checkConnection(id);
    }));
}


export { 
    connect_a as connectPrinter, 
    printOrder_a as printOrder,
    getStatus_a as getStatus,
    checkConnection_a as checkConnection,
    onBluetoothStateChange,
    onPrinterStateChange,
    getBluetoothState,
    getPrinterState
};