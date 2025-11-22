// Connect to WebSocket server
const ws = new WebSocket("ws://127.0.0.1:8086/ws");

// When a message is received
ws.onmessage = function(event) {
    console.log("WebSocket message:", event.data);
    loadTweets(); // Refresh timeline automatically
};

// Optionally, send a message to server
// ws.send("Hello from client");



// Load tweets (optionally by username)
function loadTweets() {
    const tweetsContainer = document.getElementById("tweets");
    if (!tweetsContainer) return; // avoids null error

    fetch("http://127.0.0.1:8086/tweet/all")
        .then(res => res.json())
        .then(data => {
            tweetsContainer.innerHTML = "";
            data.forEach(tweet => {
                tweetsContainer.innerHTML += `
                    <div class="tweet">
                        <b>${tweet.user}</b>: ${tweet.content}
                        <button onclick="deleteTweet(${tweet.id})">Delete</button>
                        <button onclick="updateTweetPrompt(${tweet.id})">Edit</button>
                    </div>
                `;
                
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
        data.forEach(tweet => {
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
                document.getElementById("filter-user").value = user;
                loadTweets();
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
