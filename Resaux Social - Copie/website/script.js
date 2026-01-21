// Variables d'état
let currentUser = null;
let currentChatUser = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        loadApp();
    } else {
        showSection('auth');
    }

    // Auth Forms
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);

    // Check mobile view for messages
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            document.getElementById('users-container').style.display = 'block';
            if (currentChatUser) document.getElementById('chat-box').classList.remove('hidden');
        }
    });
});

function loadApp() {
    showSection('feed');
    loadPosts();
    updateNavbarProfile();
}

function updateNavbarProfile() {
    // Optional: update navbar with tiny avatar if needed
}

// Navigation
window.showSection = function (sectionId) {
    // Cacher toutes les sections
    document.querySelectorAll('.section-content').forEach(el => el.classList.add('hidden'));
    document.getElementById('auth-section').classList.add('hidden');

    // Update Navbar visibility
    const navbar = document.getElementById('navbar');

    if (sectionId === 'auth') {
        navbar.classList.add('hidden');
        document.getElementById('auth-section').classList.remove('hidden');
    } else {
        navbar.classList.remove('hidden');
        document.getElementById(`${sectionId}-section`).classList.remove('hidden');

        if (sectionId === 'profile') loadProfile();
        if (sectionId === 'messages') loadUsers();
    }
}

// Highlight active nav item
window.activateNav = function (element) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
}

window.showAuth = function (type) {
    const loginForm = document.getElementById('login-form');
    const regForm = document.getElementById('register-form');
    const btns = document.querySelectorAll('.tab-btn');

    if (type === 'login') {
        loginForm.classList.remove('hidden');
        regForm.classList.add('hidden');
        btns[0].classList.add('active');
        btns[1].classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        regForm.classList.remove('hidden');
        btns[0].classList.remove('active');
        btns[1].classList.add('active');
    }
}

// API Calls
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();

        if (res.ok) {
            currentUser = data.user;
            localStorage.setItem('user', JSON.stringify(currentUser));
            loadApp();
            e.target.reset();
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error(err);
        alert('Erreur de connexion au serveur');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const password = document.getElementById('reg-password').value;
    const bio = document.getElementById('reg-bio').value;

    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, bio })
        });
        const data = await res.json();

        if (res.ok) {
            alert('Compte créé ! Connectez-vous.');
            showAuth('login');
            e.target.reset();
        } else {
            alert(data.error);
        }
    } catch (err) {
        console.error(err);
        alert('Erreur inscription');
    }
}

window.createPost = async function () {
    const content = document.getElementById('post-content').value;
    if (!content.trim()) return;

    try {
        const res = await fetch('/api/posts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: currentUser.id,
                content: content
            })
        });

        if (res.ok) {
            document.getElementById('post-content').value = '';
            loadPosts();
        }
    } catch (err) {
        console.error(err);
    }
}

async function loadPosts() {
    try {
        const res = await fetch('/api/posts');
        const data = await res.json();
        const container = document.getElementById('posts-container');
        container.innerHTML = '';

        data.posts.forEach(post => {
            const date = new Date(post.timestamp).toLocaleDateString(undefined, {
                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
            });
            const html = `
                <div class="post">
                    <div class="post-header">
                        <img src="${post.profile_pic || 'https://via.placeholder.com/48'}" class="avatar">
                        <div>
                            <div class="username">${post.username}</div>
                            <div class="date">${date}</div>
                        </div>
                    </div>
                    <div class="post-content">${post.content}</div>
                </div>
            `;
            container.innerHTML += html;
        });
    } catch (err) {
        console.error(err);
    }
}

function loadProfile() {
    if (!currentUser) return;
    document.getElementById('profile-name').textContent = currentUser.username;
    document.getElementById('profile-bio').textContent = currentUser.bio || 'Aucune bio renseignée.';
    document.getElementById('profile-pic').src = currentUser.profile_pic || 'https://via.placeholder.com/150';
}

window.logout = function () {
    currentUser = null;
    localStorage.removeItem('user');
    showSection('auth');
    document.getElementById('navbar').classList.add('hidden');
}

// --- MESSAGERIE LOGIC ---

async function loadUsers() {
    try {
        const res = await fetch('/api/users');
        const data = await res.json();
        const container = document.getElementById('users-container');
        container.innerHTML = '';

        data.users.forEach(user => {
            if (user.id === currentUser.id) return;

            const html = `
                <div class="user-item" onclick="openChat(${user.id}, '${user.username}')">
                    <img src="${user.profile_pic || 'https://via.placeholder.com/40'}" class="avatar">
                    <span class="username">${user.username}</span>
                </div>
            `;
            container.innerHTML += html;
        });

        // Reset view state
        document.getElementById('chat-empty-state').classList.remove('hidden');
        document.getElementById('chat-box').classList.add('hidden');
        currentChatUser = null;

    } catch (err) {
        console.error(err);
    }
}

window.openChat = function (userId, username) {
    currentChatUser = userId;

    // UI Updates
    document.getElementById('chat-with-name').textContent = username;
    document.getElementById('chat-empty-state').classList.add('hidden');
    const chatBox = document.getElementById('chat-box');
    chatBox.classList.remove('hidden');

    // Mobile handling
    if (window.innerWidth <= 768) {
        chatBox.classList.add('active'); // Full screen on mobile
    }

    loadMessages();
}

window.closeChatMobile = function () {
    const chatBox = document.getElementById('chat-box');
    chatBox.classList.remove('active');
    chatBox.classList.add('hidden');
    document.getElementById('chat-empty-state').classList.remove('hidden');
    currentChatUser = null;
}

async function loadMessages() {
    if (!currentChatUser) return;

    try {
        const res = await fetch(`/api/messages/${currentUser.id}/${currentChatUser}`);
        const data = await res.json();
        const container = document.getElementById('messages-container');
        container.innerHTML = '';

        data.messages.forEach(msg => {
            const isMe = msg.sender_id === currentUser.id;
            const html = `
                <div class="message-bubble ${isMe ? 'sent' : 'received'}">
                    ${msg.content}
                </div>
            `;
            container.innerHTML += html;
        });

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    } catch (err) {
        console.error(err);
    }
}

window.sendMessage = async function () {
    const input = document.getElementById('msg-input');
    const content = input.value;
    if (!content.trim() || !currentChatUser) return;

    try {
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                sender_id: currentUser.id,
                receiver_id: currentChatUser,
                content: content
            })
        });

        if (res.ok) {
            input.value = '';
            loadMessages();
        }
    } catch (err) {
        console.error(err);
    }
}

// Allow Enter key to send message
document.getElementById('msg-input')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});
