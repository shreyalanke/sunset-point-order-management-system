import apiClient from ".";


async function getDishes() {
    
    const response = await apiClient.get('/dishes');
    return response.data;
}

export { getDishes };