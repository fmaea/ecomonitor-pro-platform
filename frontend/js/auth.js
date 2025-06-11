// Depends on api.js for fetchApi

/**
 * Logs in a user.
 * @param {string} usernameOrEmail - The username or email.
 * @param {string} password - The password.
 * @returns {Promise<object>} The user data from the API upon successful login.
 */
async function loginUser(usernameOrEmail, password) {
    try {
        const data = await fetchApi('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username_or_email: usernameOrEmail, password: password }),
        });
        if (data.access_token) {
            localStorage.setItem('authToken', data.access_token);
            // Optionally store user info, but be mindful of stale data
            if (data.user) {
                localStorage.setItem('currentUser', JSON.stringify(data.user)); // Store basic user info
            }
            console.log('Login successful', data);
            return data; // Contains token and user info
        } else {
            throw new Error(data.message || 'Login failed: No token received.');
        }
    } catch (error) {
        console.error('Login error:', error.message);
        throw error; // Re-throw to be handled by UI
    }
}

/**
 * Registers a new user.
 * @param {object} userData - User registration data (username, email, password, role, etc.).
 * @returns {Promise<object>} The API response.
 */
async function registerUser(userData) {
    try {
        const data = await fetchApi('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
        console.log('Registration successful:', data);
        return data;
    } catch (error) {
        console.error('Registration error:', error.message);
        throw error;
    }
}

/**
 * Logs out the current user.
 */
function logoutUser() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser'); // Clear stored user info
    console.log('User logged out.');
    // In a real app, you would redirect to the login page or update UI state.
    // window.location.hash = '#login'; // Example redirect using hash routing
    // Or call a function from app.js to update UI, e.g., app.showLoginPage();
}

/**
 * Gets the current user's authentication token.
 * @returns {string|null} The token or null if not found.
 */
function getCurrentUserToken() {
    return localStorage.getItem('authToken');
}

/**
 * Gets the current user's role.
 * @returns {string|null} The role or null if not found or user data not stored.
 */
function getCurrentUserRole() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    return user ? user.role : null;
}


/**
 * Checks if a user is currently authenticated.
 * @returns {boolean} True if authenticated, false otherwise.
 */
function isAuthenticated() {
    return !!getCurrentUserToken();
}

/**
 * Fetches the current user's profile information.
 * @returns {Promise<object>} The user's profile data.
 */
async function getUserProfile() {
    if (!isAuthenticated()) {
        console.warn('User not authenticated. Cannot fetch profile.');
        throw new Error('User not authenticated.');
    }
    try {
        const data = await fetchApi('/users/profile');
        console.log('User profile:', data);
        return data.user; // Assuming API returns { message: '...', user: {...} }
    } catch (error) {
        console.error('Error fetching user profile:', error.message);
        if (error.status === 401) { // Token might be invalid/expired
            logoutUser(); // Log out user if token is bad
            // Optionally redirect to login
        }
        throw error;
    }
}

/**
 * Updates the current user's profile information.
 * @param {object} profileData - Data to update (e.g., { first_name, last_name, email }).
 * @returns {Promise<object>} The updated user profile data.
 */
async function updateUserProfile(profileData) {
    if (!isAuthenticated()) {
        console.warn('User not authenticated. Cannot update profile.');
        throw new Error('User not authenticated.');
    }
    try {
        const data = await fetchApi('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(profileData),
        });
        console.log('User profile updated:', data);
        // Update stored user info if necessary
        if (data.user) {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
        }
        return data.user;
    } catch (error) {
        console.error('Error updating user profile:', error.message);
        throw error;
    }
}
