import axios from 'axios';

window.__nativePromises = {};
window.__nativeResolve = function (id, response) {
  if (window.__nativePromises[id]) {
    window.__nativePromises[id](response? JSON.parse(response) : null);
    delete window.__nativePromises[id];
  }
};

const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
  timeout: 10000,
    headers: {
    'Content-Type': 'application/json',
    },  
});

export default apiClient;