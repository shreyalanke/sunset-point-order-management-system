import apiClient from "./index.js";

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

let getAnalytics;


async function getAnalytics_w(range) {
    try {
        let response;
        if (range instanceof Object) {
            response = await apiClient.get(`/admin/analytics?start=${range.start}&end=${range.end}`);
        }else{
            response = await apiClient.get(`/admin/analytics?range=${range}`);
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        throw error;
    }
}

async function getAnalytics_a(range) {
    let result = await (new Promise((resolve) => {
        const id = crypto?.randomUUID ? crypto.randomUUID() : uuid();
        window.__nativePromises[id] = resolve;

        if (range instanceof Object) {
            window.NativeApi.getAnalyticsByDateRange(
                id,
                range.start,
                range.end
            );
        } else {
            window.NativeApi.getAnalyticsByPredefinedRange(
                id,
                range
            );
        }
    }));
  return result;
}

let getDishPerformance;

async function getDishPerformance_w(range,type,limit=5) {
    try {
        let response;
        if (range instanceof Object) {
            response = await apiClient.get(`/admin/analytics/dish-performance?start=${range.start}&end=${range.end}&type=${type}&limit=${limit}`);
        }
        else{
            response = await apiClient.get(`/admin/analytics/dish-performance?range=${range}&type=${type}&limit=${limit}`);
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching dish performance data:", error);
        throw error;
    }
}
async function getDishPerformance_a(range,type,limit=5) {
    let result = await (new Promise((resolve) => {
        const id = crypto?.randomUUID ? crypto.randomUUID() : uuid();
        window.__nativePromises[id] = resolve;
        if (range instanceof Object) {
            window.NativeApi.getDishPerformanceByDateRange(
                id,
                range.start,
                range.end,
                type,
                limit
            );
        } else {
            window.NativeApi.getDishPerformanceByPredefinedRange(
                id,
                range,
                type,
                limit
            );
        }
    }));
  return result;
}

let getCategoryPerformance;

async function getCategoryPerformance_w(range) {
    try {
        let response;
        if (range instanceof Object) {
            response = await apiClient.get(`/admin/analytics/category-performance?start=${range.start}&end=${range.end}`);
        }
        else{
            response = await apiClient.get(`/admin/analytics/category-performance?range=${range}`);
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching category performance data:", error);
        throw error;
    }
}

async function getCategoryPerformance_a(range) {
    let result = await (new Promise((resolve) => {
        const id = crypto?.randomUUID ? crypto.randomUUID() : uuid();
        window.__nativePromises[id] = resolve;
        if (range instanceof Object) {
            window.NativeApi.getCategoryPerformanceByDateRange(
                id,
                range.start,
                range.end
            );
        } else {
            window.NativeApi.getCategoryPerformanceByPredefinedRange(
                id,
                range
            );
        }
    }));
  return result;
}

if (window.NativeApi) {
    getAnalytics = getAnalytics_a;
    getDishPerformance = getDishPerformance_a;
    getCategoryPerformance = getCategoryPerformance_a;
} else {
    getAnalytics = getAnalytics_w;
    getDishPerformance = getDishPerformance_w;
    getCategoryPerformance = getCategoryPerformance_w;
}

export { getAnalytics , getDishPerformance , getCategoryPerformance };