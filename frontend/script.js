// ======================= AUTH GUARD =======================
const token = localStorage.getItem("token");

if (!token) {
    window.location.href = "/login.html";
}

// ======================= WEBSOCKET =======================
const ws = new WebSocket("ws://127.0.0.1:8086/ws");

ws.onmessage = function () {
    loadTweets(); // refresh on realtime update
};

// ======================= UI HELPERS =======================
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// Dark mode toggle
document.getElementById("theme-toggle")?.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(
        "theme",
        document.body.classList.contains("dark") ? "dark" : "light"
    );
});

// Restore theme
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
}

// ======================= LIKE TWEET =======================
async function likeTweet(tweetId, btn) {
    btn.classList.add("liked");
    setTimeout(() => btn.classList.remove("liked"), 300);

    try {
        const res = await fetch(
            `http://127.0.0.1:8086/tweet/${tweetId}/like`,
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        if (res.ok) loadTweets();
    } catch (err) {
        console.error("Failed to like tweet:", err);
    }
}

// ======================= TWEET HTML =======================
function generateTweetHTML(tweet) {
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
        tweet.user
    )}&background=1da1f2&color=fff`;

    return `
    <div class="tweet fade-in">
        <img class="avatar" src="${avatar}" alt="${tweet.user}">
        <div class="tweet-content">
            <div class="tweet-header">
                <span class="tweet-user">${tweet.user}</span>
            </div>
            <div class="tweet-text">${tweet.content}</div>

            <div class="tweet-actions">
                <button class="like-btn" onclick="likeTweet(${tweet.id}, this)">
                    ❤️ ${tweet.likes}
                </button>
                <button onclick="updateTweetPrompt(${tweet.id})">✏️ Edit</button>
                <button onclick="deleteTweet(${tweet.id})">🗑 Delete</button>
            </div>
        </div>
    </div>
    `;
}

// ======================= LOAD ALL TWEETS =======================
function loadTweets() {
    const tweetsContainer = document.getElementById("tweets");
    if (!tweetsContainer) return;

    fetch("http://127.0.0.1:8086/tweet/all", {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })
        .then((res) => res.json())
        .then((data) => {
            tweetsContainer.innerHTML = "";
            data.reverse(); // newest first
            data.forEach((tweet) => {
                tweetsContainer.innerHTML += generateTweetHTML(tweet);
            });
        });
}

// ======================= SEARCH BY USER =======================
async function loadTweetsByUser(user) {
    const tweetsContainer = document.getElementById("tweets");
    if (!tweetsContainer) return;

    // ✅ Check if user is empty or whitespace
    user = user?.trim();
    if (!user) {
        console.log("No username provided, loading all tweets");
        loadTweets(); // Load all tweets instead
        return;
    }

    try {
        const res = await fetch(`http://127.0.0.1:8086/tweet/${user}`);
        
        if (!res.ok) {
            console.error(`Failed to load tweets for ${user}:`, res.status);
            tweetsContainer.innerHTML = `<p>No tweets found for user: ${user}</p>`;
            return;
        }
        
        const data = await res.json();
        
        // ✅ Check if data is an array before calling reverse
        if (!Array.isArray(data)) {
            console.error("Response is not an array:", data);
            tweetsContainer.innerHTML = `<p>Error loading tweets</p>`;
            return;
        }

        tweetsContainer.innerHTML = "";
        
        if (data.length === 0) {
            tweetsContainer.innerHTML = `<p>No tweets found for user: ${user}</p>`;
            return;
        }

        // ✅ Now safe to use reverse
        data.reverse().forEach(tweet => {
            tweetsContainer.innerHTML += `
                <div class="tweet">
                    <b>${tweet.user}</b>: ${tweet.content}
                    <button onclick="deleteTweet(${tweet.id})">Delete</button>
                    <button onclick="updateTweetPrompt(${tweet.id})">Edit</button>
                </div>
            `;
        });
    } catch (err) {
        console.error("Failed to load tweets by user:", err);
        tweetsContainer.innerHTML = `<p>Error loading tweets</p>`;
    }
}

// ======================= LOAD USERS =======================
async function loadUsers() {
    try {
        const res = await fetch("http://127.0.0.1:8086/users", {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });

        const users = await res.json();
        const usersList = document.getElementById("users");
        usersList.innerHTML = "";

        users.forEach((user) => {
            const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                user
            )}&background=random&color=fff`;

            const li = document.createElement("li");
            li.innerHTML = `
                <img class="avatar-small" src="${avatar}">
                <span>${user}</span>
            `;

            li.onclick = () => loadTweetsByUser(user);
            usersList.appendChild(li);
        });
    } catch (err) {
        console.error("Failed to load users:", err);
    }
}

// ======================= POST TWEET =======================
// ======================= POST TWEET =======================
async function postTweet() {
    const content = document.getElementById('content').value;
    const token = localStorage.getItem('token');
    
    if (!content.trim()) {
        alert('Please enter some content!');
        return;
    }
    
    try {
        const response = await fetch('http://127.0.0.1:8086/tweet/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: content })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error response:', errorText);
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Tweet created:', data);
        
        // Clear the input
        document.getElementById('content').value = '';
        
        // Reload tweets
        loadTweets();
    } catch (err) {
        console.error('Failed to post tweet:', err);
        alert('Failed to post tweet. Please try again.');
    }
}

// ======================= EDIT TWEET =======================
function updateTweetPrompt(id) {
    const newContent = prompt("Update your tweet:");
    if (newContent) updateTweet(id, newContent);
}

async function updateTweet(id, content) {
    try {
        await fetch(`http://127.0.0.1:8086/tweet/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ content }),
        });
        loadTweets();
    } catch (err) {
        console.error("Failed to update tweet:", err);
    }
}

// ======================= DELETE TWEET =======================
async function deleteTweet(id) {
    if (!confirm("Delete this tweet?")) return;

    try {
        await fetch(`http://127.0.0.1:8086/tweet/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        loadTweets();
    } catch (err) {
        console.error("Failed to delete tweet:", err);
    }
}

// ======================= LOGOUT =======================
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('theme');
    window.location.href = '/login.html';
}

// ======================= INIT =======================
loadUsers();
loadTweets();
