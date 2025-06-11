// Depends on api.js and auth.js

const appRoot = document.getElementById('app-root');
const mainNav = document.getElementById('main-nav').querySelector('ul');

const routes = {
    '#home': { page: 'pages/home.html', controller: showHomePage, requiresAuth: false },
    '#login': { page: 'pages/login.html', controller: showLoginPage, requiresAuth: false },
    '#register': { page: 'pages/register.html', controller: showRegisterPage, requiresAuth: false },
    '#profile': { page: 'pages/profile.html', controller: showProfilePage, requiresAuth: true },
    '#student-dashboard': { page: 'pages/student_dashboard.html', controller: showStudentDashboard, requiresAuth: true, roles: ['student'] },
    '#teacher-dashboard': { page: 'pages/teacher_dashboard.html', controller: showTeacherDashboard, requiresAuth: true, roles: ['teacher'] },
    // Dynamic routes will need more sophisticated handling
    // Example: '#course-detail/:id': { page: 'pages/course_detail_student.html', controller: showCourseDetail, requiresAuth: true },
    // Example: '#manage-course/:id': { page: 'pages/course_manage_teacher.html', controller: showManageCourse, requiresAuth: true, roles: ['teacher'] },
};

async function fetchPageContent(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to load page content: ${url}`);
        return await response.text();
    } catch (error) {
        console.error('Error fetching page content:', error);
        return '<p>Error loading page. Please try again.</p>';
    }
}

function updateNavigation() {
    mainNav.innerHTML = ''; // Clear existing links

    const baseLinks = [
        { href: '#home', text: 'Home' }
    ];

    if (isAuthenticated()) {
        const userRole = getCurrentUserRole();
        if (userRole === 'student') {
            baseLinks.push({ href: '#student-dashboard', text: 'My Courses' });
        } else if (userRole === 'teacher') {
            baseLinks.push({ href: '#teacher-dashboard', text: 'My Teaching' });
        }
        baseLinks.push({ href: '#profile', text: 'Profile' });
        baseLinks.push({ href: '#logout', text: 'Logout' }); // Special link for logout action
    } else {
        baseLinks.push({ href: '#login', text: 'Login' });
        baseLinks.push({ href: '#register', text: 'Register' });
    }

    baseLinks.forEach(link => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = link.href;
        a.textContent = link.text;
        if (link.href === '#logout') {
            a.addEventListener('click', (e) => {
                e.preventDefault();
                logoutUser();
                handleRouteChange(); // Update UI after logout
            });
        }
        li.appendChild(a);
        mainNav.appendChild(li);
    });
}


async function handleRouteChange() {
    const hash = window.location.hash || '#home';
    let routeConfig = routes[hash];

    // Basic dynamic route handling for course detail (example)
    // A more robust router would be better for complex apps
    if (!routeConfig) {
        if (hash.startsWith('#course-detail/')) {
            routeConfig = { page: 'pages/course_detail_student.html', controller: showCourseDetailPage, requiresAuth: true };
        } else if (hash.startsWith('#manage-course/')) {
             routeConfig = { page: 'pages/course_manage_teacher.html', controller: showManageCoursePage, requiresAuth: true, roles: ['teacher'] };
        } else if (hash.startsWith('#create-course')) {
            routeConfig = { page: 'pages/course_create_teacher.html', controller: showCreateCoursePage, requiresAuth: true, roles: ['teacher'] };
        } else {
            appRoot.innerHTML = '<h2>404 Not Found</h2><p>Page does not exist.</p>';
            updateNavigation();
            return;
        }
    }


    if (routeConfig.requiresAuth && !isAuthenticated()) {
        console.log('Authentication required, redirecting to login.');
        window.location.hash = '#login';
        return;
    }

    if (routeConfig.roles && !routeConfig.roles.includes(getCurrentUserRole())) {
        appRoot.innerHTML = '<h2>403 Forbidden</h2><p>You do not have permission to access this page.</p>';
        updateNavigation();
        return;
    }

    const pageContent = await fetchPageContent(routeConfig.page);
    appRoot.innerHTML = pageContent;
    if (routeConfig.controller) {
        routeConfig.controller(); // Call the page-specific controller
    }
    updateNavigation();
}

// --- Page Specific Controllers (stubs) ---
function showHomePage() {
    console.log("Home page loaded/controller called.");
    // Could fetch dynamic content for home if needed
}

function showLoginPage() {
    console.log("Login page loaded/controller called.");
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const usernameOrEmail = event.target.username_or_email.value;
            const password = event.target.password.value;
            const errorDiv = document.getElementById('login-error');
            try {
                await loginUser(usernameOrEmail, password);
                window.location.hash = '#home'; // Or role-specific dashboard
                handleRouteChange(); // Update UI
            } catch (error) {
                errorDiv.textContent = error.message || 'Login failed. Please try again.';
                console.error('Login submission error:', error);
            }
        });
    }
}

function showRegisterPage() {
    console.log("Register page loaded/controller called.");
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const userData = {
                username: event.target.username.value,
                email: event.target.email.value,
                password: event.target.password.value,
                first_name: event.target.first_name.value,
                last_name: event.target.last_name.value,
                role: event.target.role.value,
            };
            const errorDiv = document.getElementById('register-error');
            const successDiv = document.getElementById('register-success');
            try {
                await registerUser(userData);
                successDiv.textContent = 'Registration successful! Please login.';
                errorDiv.textContent = '';
                registerForm.reset();
                // window.location.hash = '#login'; // Optionally redirect
            } catch (error) {
                errorDiv.textContent = error.message || 'Registration failed. Please try again.';
                successDiv.textContent = '';
                console.error('Registration submission error:', error);
            }
        });
    }
}

async function showProfilePage() {
    console.log("Profile page loaded/controller called.");
    try {
        const user = await getUserProfile();
        // Populate form (ensure profile.html has these form elements)
        const profileForm = document.getElementById('profile-form');
        if (profileForm && user) {
            profileForm.first_name.value = user.first_name || '';
            profileForm.last_name.value = user.last_name || '';
            profileForm.email.value = user.email || '';
            profileForm.username.value = user.username || ''; // Display username, typically not editable

            profileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const updatedData = {
                    first_name: profileForm.first_name.value,
                    last_name: profileForm.last_name.value,
                    email: profileForm.email.value,
                    // Password updates should be handled in a separate form/flow for security
                };
                const errorDiv = document.getElementById('profile-error');
                const successDiv = document.getElementById('profile-success');
                try {
                    await updateUserProfile(updatedData);
                    successDiv.textContent = 'Profile updated successfully!';
                    errorDiv.textContent = '';
                } catch (error) {
                    errorDiv.textContent = error.message || 'Failed to update profile.';
                    successDiv.textContent = '';
                }
            });
        }
    } catch (error) {
        appRoot.innerHTML = `<p>Error loading profile: ${error.message}</p>`;
    }
}

function showStudentDashboard() {
    console.log("Student dashboard loaded.");
    // JS in student.js (or here) will fetch courses from GET /courses/my-courses
    // and render them into #student-courses-list
    // For now, just a log.
}

function showTeacherDashboard() {
    console.log("Teacher dashboard loaded.");
    // JS in teacher.js (or here) will fetch courses from GET /courses/teaching
    // and render them into #teacher-courses-list
    // A "Create New Course" button here could link to #create-course
}

function showCourseDetailPage() {
    const hash = window.location.hash;
    const courseId = hash.split('/')[1]; // Very basic parsing
    console.log(`Course Detail page for course ID: ${courseId} loaded.`);
    // Fetch course details, chapters, assignments
}

function showManageCoursePage() {
    const hash = window.location.hash;
    const courseId = hash.split('/')[1]; // Very basic parsing
    console.log(`Manage Course page for course ID: ${courseId} loaded.`);
    // Fetch course details, students, chapters, assignments for management
}
function showCreateCoursePage() {
    console.log("Create course page loaded.");
    // Logic for handling course creation form will go here or in teacher.js
}


// Listen for hash changes to handle routing
window.addEventListener('hashchange', handleRouteChange);
// Initial page load handling
document.addEventListener('DOMContentLoaded', () => {
    handleRouteChange(); // Load initial page based on hash or default
});
