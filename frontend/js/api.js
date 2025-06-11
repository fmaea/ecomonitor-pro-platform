const API_BASE_URL = 'http://localhost:5000'; // Assuming backend runs on Flask's default port 5000

/**
 * Fetches data from the API.
 * @param {string} endpoint - The API endpoint (e.g., '/auth/login').
 * @param {object} options - Optional fetch options (method, body, headers, etc.).
 * @returns {Promise<any>} - The JSON response from the API.
 */
async function fetchApi(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('authToken');

    const defaultHeaders = {
        'Content-Type': 'application/json',
    };

    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    options.headers = {
        ...defaultHeaders,
        ...options.headers,
    };

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            let errorMessage = `API Error: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                // Could not parse error JSON, stick with status text
            }
            console.error('Fetch API Error:', errorMessage, 'URL:', url, 'Options:', options);
            // Throw an error object that can be caught and inspected by the caller
            const error = new Error(errorMessage);
            error.status = response.status;
            error.response = response; // Store the full response for more context if needed
            throw error;
        }

        // Handle cases where response might be empty (e.g., 204 No Content)
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Network or other error in fetchApi:', error.message, 'URL:', url);
        // Re-throw the error so UI can handle it (e.g. show generic network error message)
        throw error;
    }
}
