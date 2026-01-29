import apiClient from ".";

window.__nativePromises = {};
window.__nativeResolve = function (id, response) {
  if (window.__nativePromises[id]) {
    window.__nativePromises[id](JSON.parse(response));
    delete window.__nativePromises[id];
  }
};

async function getDishes() {
  let result = await (new Promise((resolve) => {
    const id = crypto.randomUUID();

    window.__nativePromises[id] = resolve;

    window.NativeApi.getDishes(
      id
    );
  }));
  return result;
}



// async function getDishes() {
//     const response = await apiClient.get('/dishes');
//     return response.data;
// }

export { getDishes };