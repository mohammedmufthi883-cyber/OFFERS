// DOM Elements
const pages = {
    home: document.getElementById('home'),
    about: document.getElementById('about'),
    privacy: document.getElementById('privacy'),
    contact: document.getElementById('contact')
};

// Navigation
function showPage(pageId) {
    Object.values(pages).forEach(page => {
        page.classList.add('hidden');
        page.classList.remove('active');
    });

    if (pages[pageId]) {
        pages[pageId].classList.remove('hidden');
        pages[pageId].classList.add('active');
    }

    document.querySelector('.nav-links').classList.remove('active');
}

function toggleMobileMenu() {
    document.querySelector('.nav-links').classList.toggle('active');
}

// Render Functions
function renderBlogs() {
    const container = document.getElementById('blog-container');
    container.innerHTML = '<p>Loading posts...</p>';

    db.collection("blogs").orderBy("createdAt", "desc").get()
        .then((querySnapshot) => {
            container.innerHTML = ''; // Clear loading

            if (querySnapshot.empty) {
                container.innerHTML = '<p>No posts yet.</p>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const blog = doc.data();
                const card = document.createElement('div');
                card.className = 'blog-card';

                card.innerHTML = `
                <img src="${blog.image}" alt="Blog Image" class="blog-image">
                <h3 class="blog-title">${escapeHtml(blog.title)}</h3>
                <h4 class="blog-subtitle">${escapeHtml(blog.subtitle)}</h4>
                <div class="blog-text">${escapeHtml(blog.content)}</div>
                <a href="${blog.link}" target="_blank" class="btn btn-primary">Check Now</a>
            `;

                container.appendChild(card);
            });
        })
        .catch((error) => {
            // If sorting index is missing, try default get() and sort locally
            console.warn("Index needed or permissions issue:", error);
            if (error.code === 'failed-precondition') {
                // Fallback: Client-side Sort
                fallbackRenderBlogs(container);
            } else {
                console.error("Error getting blogs: ", error);
                container.innerHTML = '<p>Error loading content.</p>';
            }
        });
}

// Fallback if composite index is missing for orderBy
function fallbackRenderBlogs(container) {
    db.collection("blogs").get().then((querySnapshot) => {
        container.innerHTML = '';
        let blogs = [];
        querySnapshot.forEach((doc) => blogs.push(doc.data()));

        // localized sort (reverse insertion roughly)
        // Since we can't easily rely on serverTimestamp for client sort without conversion, we just reverse list
        blogs.reverse();

        blogs.forEach(blog => {
            const card = document.createElement('div');
            card.className = 'blog-card';
            card.innerHTML = `
                <img src="${blog.image}" alt="Blog Image" class="blog-image">
                <h3 class="blog-title">${escapeHtml(blog.title)}</h3>
                <h4 class="blog-subtitle">${escapeHtml(blog.subtitle)}</h4>
                <div class="blog-text">${escapeHtml(blog.content)}</div>
                <a href="${blog.link}" target="_blank" class="btn btn-primary">Check Now</a>
            `;
            container.appendChild(card);
        });
    });
}

function renderContent() {
    db.collection("settings").doc("config").get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();

            // About
            document.getElementById('about-content').innerHTML = `<p>${escapeHtml(data.about)}</p>`;

            // Privacy
            document.getElementById('privacy-content').innerHTML = `<p>${escapeHtml(data.privacy)}</p>`;

            // Contact
            document.getElementById('contact-display').textContent = data.email;
            document.getElementById('message-btn').href = `mailto:${data.email}`;
        } else {
            // Fallback if no settings saved yet
            document.getElementById('about-content').innerHTML = `<p>Welcome to Affiliate World.</p>`;
            document.getElementById('privacy-content').innerHTML = `<p>Privacy Policy not yet set.</p>`;
        }
    }).catch((error) => {
        console.error("Error getting document:", error);
    });
}

// Utility: Prevent XSS
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    renderBlogs();
    renderContent();
});
