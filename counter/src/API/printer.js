import apiClient from ".";
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

async function printOrder_a(orderId) {
    await (new Promise((resolve)=>{
        const id = crypto?.randomUUID ? crypto.randomUUID() : uuid();
        window.__nativePromises[id] = resolve;
        window.PrinterNativeApi.printOrder(
            id,
            orderId
        );
    }));
}


export { connect_a as connectPrinter, printOrder_a as printOrder };