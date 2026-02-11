// Auth Credentials
const CREDENTIALS = {
    username: "mufaffi78affi56",
    password: "12affi bh67hf5&"
};

// Check Session
function checkSession() {
    return sessionStorage.getItem('isOwnerLoggedIn') === 'true';
}

// Login
function attemptLogin() {
    const userIn = document.getElementById('username').value;
    const passIn = document.getElementById('password').value;
    const errorMsg = document.getElementById('login-error');

    if (userIn.trim() === CREDENTIALS.username && passIn.trim() === CREDENTIALS.password) {
        sessionStorage.setItem('isOwnerLoggedIn', 'true');
        showDashboard();
    } else {
        errorMsg.style.display = 'block';
    }
}

// Logout
function logout() {
    sessionStorage.removeItem('isOwnerLoggedIn');
    window.location.reload();
}

// Show Dashboard & Load Data
function showDashboard() {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    loadCurrentData();
    renderAdminBlogList(); // Load list for deletion
}

// Load Data from Firestore (Settings)
function loadCurrentData() {
    db.collection("settings").doc("config").get().then((doc) => {
        if (doc.exists) {
            const data = doc.data();
            document.getElementById('edit-about').value = data.about || "";
            document.getElementById('edit-privacy').value = data.privacy || "";
            document.getElementById('edit-email').value = data.email || "";
        }
    }).catch((error) => {
        console.error("Error getting document:", error);
    });
}

// Render Admin Blog List (for deletion)
function renderAdminBlogList() {
    const container = document.getElementById('admin-blog-list');
    container.innerHTML = '<p>Loading...</p>';

    db.collection("blogs").orderBy("createdAt", "desc").get()
        .then((querySnapshot) => {
            container.innerHTML = '';

            if (querySnapshot.empty) {
                container.innerHTML = '<p>No blogs found.</p>';
                return;
            }

            querySnapshot.forEach((doc) => {
                const blog = doc.data();
                const id = doc.id;

                const item = document.createElement('div');
                item.style.borderBottom = '1px solid #eee';
                item.style.padding = '10px 0';
                item.style.display = 'flex';
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';

                item.innerHTML = `
                <div style="flex: 1; margin-right: 10px;">
                    <strong>${escapeHtml(blog.title)}</strong><br>
                    <small style="color: #666;">${escapeHtml(blog.subtitle)}</small>
                </div>
                <button onclick="deleteBlog('${id}')" 
                    style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                    Delete
                </button>
            `;
                container.appendChild(item);
            });
        })
        .catch((error) => {
            // Fallback if index missing
            if (error.code === 'failed-precondition') {
                db.collection("blogs").get().then((qs) => {
                    container.innerHTML = '';
                    qs.forEach((doc) => {
                        const blog = doc.data();
                        const item = document.createElement('div');
                        item.style.borderBottom = '1px solid #eee';
                        item.style.padding = '10px 0';
                        item.style.display = 'flex';
                        item.style.justifyContent = 'space-between';
                        item.style.alignItems = 'center';
                        item.innerHTML = `
                        <div style="flex: 1; margin-right: 10px;">
                            <strong>${escapeHtml(blog.title)}</strong><br>
                        </div>
                        <button onclick="deleteBlog('${doc.id}')" style="background: #ef4444; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">Delete</button>
                    `;
                        container.appendChild(item);
                    });
                });
            } else {
                console.error(error);
                container.innerHTML = '<p>Error loading list.</p>';
            }
        });
}

// Delete Blog
function deleteBlog(id) {
    if (confirm("Are you sure you want to delete this blog post?")) {
        db.collection("blogs").doc(id).delete().then(() => {
            alert("Blog deleted successfully!");
            renderAdminBlogList(); // Refresh list
        }).catch((error) => {
            console.error("Error removing document: ", error);
            alert("Error deleting blog: " + error.message);
        });
    }
}

// Save Content (About, Privacy, Email)
function saveContent(type) {
    const about = document.getElementById('edit-about').value;
    const privacy = document.getElementById('edit-privacy').value;
    const email = document.getElementById('edit-email').value;

    db.collection("settings").doc("config").set({
        about: about,
        privacy: privacy,
        email: email
    }, { merge: true })
        .then(() => {
            alert(type.charAt(0).toUpperCase() + type.slice(1) + " updated successfully!");
        })
        .catch((error) => {
            console.error("Error writing document: ", error);
            alert("Error updating content: " + error.message);
        });
}

// Handle Image Preview & Base64 Conversion
function previewImage() {
    const fileInput = document.getElementById('blog-image-input');
    const file = fileInput.files[0];
    const preview = document.getElementById('image-preview');
    const hiddenBase64 = document.getElementById('blog-image-base64');

    if (file) {
        const reader = new FileReader();

        reader.onloadend = function () {
            // Check size to prevent Firestore document limit (1MB) - Base64 overhead ~33%
            if (reader.result.length > 700 * 1024) { // Warning around 700KB
                alert("Warning: This image is large and might exceed the database document limit. Please use compressed images under 700KB.");
            }
            preview.src = reader.result;
            preview.style.display = 'block';
            hiddenBase64.value = reader.result;
        }

        reader.readAsDataURL(file);
    } else {
        preview.src = "";
        preview.style.display = 'none';
        hiddenBase64.value = "";
    }
}

// Add Blog
function addBlog() {
    const title = document.getElementById('blog-title').value;
    const subtitle = document.getElementById('blog-subtitle').value;
    const imageBase64 = document.getElementById('blog-image-base64').value;
    const content = document.getElementById('blog-content').value;
    const link = document.getElementById('blog-link').value;

    if (!title || !content || !link) {
        alert("Please fill in key fields (Title, Content, Link).");
        return;
    }

    db.collection("blogs").add({
        title: title,
        subtitle: subtitle,
        image: imageBase64 || "https://via.placeholder.com/150",
        content: content,
        link: link,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    })
        .then(() => {
            // Reset Form
            document.getElementById('blog-title').value = '';
            document.getElementById('blog-subtitle').value = '';
            document.getElementById('blog-image-input').value = '';
            document.getElementById('blog-image-base64').value = '';
            document.getElementById('image-preview').style.display = 'none';
            document.getElementById('blog-content').value = '';
            document.getElementById('blog-link').value = '';

            alert("Blog published successfully!");
            renderAdminBlogList(); // Refresh list to show new blog
        })
        .catch((error) => {
            console.error("Error adding document: ", error);
            alert("Error publishing blog: " + error.message);
        });
}

// Utility
function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Init
document.addEventListener('DOMContentLoaded', () => {
    if (checkSession()) {
        showDashboard();
    }
});
