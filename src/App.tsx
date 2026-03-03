const STORAGE_PROJECTS_KEY = 'projects';
const STORAGE_STATS_KEY = 'stats';

function safeJsonParse(value) {
    try {
        return JSON.parse(value);
    } catch (e) {
        return null;
    }
}

async function fetchData() {
    try {
        const response = await fetch('/api/data');
        const data = await response.json();
        return data;
    } catch (error) {
        console.warn('API unavailable, falling back to localStorage');
        const projects = safeJsonParse(localStorage.getItem(STORAGE_PROJECTS_KEY)) || [];
        const stats = safeJsonParse(localStorage.getItem(STORAGE_STATS_KEY)) || {};
        return { projects, stats };
    }
}

// Other component logic remains unchanged