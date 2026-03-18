import axios from 'axios';

window.__nativePromises = {};
window.__nativeResolve = function (id, response) {
  if (window.__nativePromises[id]) {
    window.__nativePromises[id](response? JSON.parse(response) : null);
    delete window.__nativePromises[id];
  }
};

export function invokeNativeApi(methodName, ...args) {
  if (!window.NativeApi || typeof window.NativeApi[methodName] !== 'function') {
    return Promise.reject(new Error('Native API is not available'));
  }

  const requestId = `${methodName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return new Promise((resolve, reject) => {
    window.__nativePromises[requestId] = (response) => {
      if (response?.success === false) {
        reject(new Error(response.message || `${methodName} failed`));
        return;
      }

      resolve(response);
    };

    try {
      window.NativeApi[methodName](requestId, ...args);
    } catch (error) {
      delete window.__nativePromises[requestId];
      reject(error);
    }
  });
}

const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
    headers: {
    'Content-Type': 'application/json',
    },  
});

export default apiClient;