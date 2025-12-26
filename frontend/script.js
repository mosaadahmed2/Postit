// Connect to WebSocket server
const ws = new WebSocket("ws://127.0.0.1:8086/ws");

// When a message is received
ws.onmessage = function(event) {
    console.log("WebSocket message:", event.data);
    loadTweets(); // Refresh timeline automatically
};

// Optionally, send a message to server
// ws.send("Hello from client");

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
}


document.getElementById("theme-toggle").onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
};

// Restore theme on page load
if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark");
}

async function likeTweet(tweetId) {
    const userInput = document.getElementById("user");

    if (!userInput) {
        alert("Username input is not found in DOM");
        return;
    }

    const user = userInput.value.trim();

    if (!user) {
        alert("Please enter your username first!");
        return;
    }

    try {
        const res = await fetch(`http://127.0.0.1:8086/tweet/${tweetId}/like`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user })
        });

        if (res.ok) {
            loadTweets(); // refresh likes
        } else {
            const err = await res.text();
            alert("Like failed: " + err);
        }
    } catch (err) {
        console.error("Failed to like tweet:", err);
    }
}




function generateTweetHTML(tweet) {
    const avatar = `https://ui-avatars.com/api/?name=${tweet.user}&background=1da1f2&color=fff`;

    return `
    <div class="tweet fade-in">
        <img class="avatar" src="${avatar}" alt="${tweet.user}">
        <div class="tweet-content">
            <div class="tweet-header">
                <span class="tweet-user">${tweet.user}</span>
            </div>
            <div class="tweet-text">${tweet.content}</div>

            <div class="tweet-actions">
                <button class="like-btn" onclick="likeTweet(${tweet.id})">
  ❤️ ${tweet.likes}
</button>


                <button onclick="updateTweetPrompt(${tweet.id})">✏️ Edit</button>
                <button onclick="deleteTweet(${tweet.id})">🗑 Delete</button>
            </div>
        </div>
    </div>
    `;
}





// Load tweets (optionally by username)
function loadTweets() {
    const tweetsContainer = document.getElementById("tweets");
    if (!tweetsContainer) return;

    fetch("http://127.0.0.1:8086/tweet/all")
        .then(res => res.json())
        .then(data => {
            tweetsContainer.innerHTML = "";
            // ⭐ Reverse so newest tweets appear first
            data.reverse();
            data.forEach(tweet => {
                tweetsContainer.innerHTML += generateTweetHTML(tweet);
            });
        });
}


// Search tweets by username
async function loadTweetsByUser(user) {
    const tweetsContainer = document.getElementById("tweets");
    if (!tweetsContainer) return;

    try {
        const res = await fetch(`http://127.0.0.1:8086/tweet/${user}`);
        const data = await res.json();

        tweetsContainer.innerHTML = "";
        // ⭐ Reverse so newest tweets appear first
        data.reverse();
        data.forEach(tweet => {
            tweetsContainer.innerHTML += generateTweetHTML(tweet);
        });
    } catch (err) {
        console.error("Failed to load tweets by user:", err);
    }
}




async function loadUsers() {
    try {
        const res = await fetch("http://127.0.0.1:8086/users");
        const users = await res.json();

        const usersList = document.getElementById("users");
        usersList.innerHTML = "";

        users.forEach(user => {
            const li = document.createElement("li");
            li.textContent = user;
            li.onclick = () => {
                loadTweetsByUser(user);   // 👈 filter tweets
            };
            usersList.appendChild(li);
        });
    } catch (err) {
        console.error("Failed to load users:", err);
    }
}

// Call this on page load
loadUsers();

// Post a new tweet
async function postTweet() {
    const user = document.getElementById("user").value;
    const content = document.getElementById("content").value;
  
    try {
      const res = await fetch("http://127.0.0.1:8086/tweets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, content })
      });
  
      if (res.ok) {
        document.getElementById("content").value = "";
        loadTweets(); // 👈 reload tweets instantly
      }
    } catch (err) {
      console.error("Failed to post tweet:", err);
    }
  }
  



// Edit tweet
function updateTweetPrompt(id) {
    const newContent = prompt("Update your tweet:");
    if (newContent) updateTweet(id, newContent);
}

async function updateTweet(id, content) {
    const user = "ignored"; // FastAPI expects user field
    try {
        await fetch(`http://127.0.0.1:8086/tweet/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user, content })
        });
        loadTweets(); // refresh timeline
    } catch (err) {
        console.error("Failed to update tweet:", err);
    }
}

// Delete tweet
async function deleteTweet(id) {
    if (!confirm("Are you sure you want to delete this tweet?")) return;
    try {
        await fetch(`http://127.0.0.1:8086/tweet/${id}`, { method: "DELETE" });
        loadTweets(); // refresh timeline
    } catch (err) {
        console.error("Failed to delete tweet:", err);
    }
}




// Load all tweets on page load
loadTweets();
