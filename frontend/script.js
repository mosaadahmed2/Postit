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





// ======================= ANALYTICS =======================
let analyticsRefreshInterval;

async function loadAnalytics() {
    try {
        const response = await fetch('/analytics/matches');
        const data = await response.json();
        
        displayMostComments(data.most_comments);
        displayMostPositive(data.most_positive);
        displayMostNegative(data.most_negative);
    } catch (error) {
        console.error('Failed to load analytics:', error);
        displayEmptyAnalytics();
    }
}

function displayMostComments(matches) {
    const container = document.getElementById('most-comments-list');
    
    if (!matches || matches.length === 0) {
        container.innerHTML = `
            <div class="empty-analytics">
                <div class="empty-analytics-icon">💬</div>
                <div>No data yet. Start tweeting!</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    matches.forEach((match, index) => {
        const maxTweets = matches[0].total_tweets;
        const percentage = (match.total_tweets / maxTweets) * 100;
        
        const card = document.createElement('div');
        card.className = 'analytics-card';
        card.onclick = () => filterByHashtag(match.match_hashtag);
        
        card.innerHTML = `
            <div class="analytics-card-header">
                <span class="analytics-hashtag">#${match.match_hashtag}</span>
                <span class="analytics-badge comments">#${index + 1}</span>
            </div>
            <div class="analytics-stats">
                <span class="analytics-stat">
                    💬 ${match.total_tweets} tweets
                </span>
            </div>
            <div class="analytics-mini-bar">
                <div class="analytics-mini-bar-fill comments" style="width: ${percentage}%"></div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function displayMostPositive(matches) {
    const container = document.getElementById('most-positive-list');
    
    if (!matches || matches.length === 0) {
        container.innerHTML = `
            <div class="empty-analytics">
                <div class="empty-analytics-icon">😊</div>
                <div>No data yet</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    matches.forEach((match, index) => {
        const card = document.createElement('div');
        card.className = 'analytics-card';
        card.onclick = () => filterByHashtag(match.match_hashtag);
        
        card.innerHTML = `
            <div class="analytics-card-header">
                <span class="analytics-hashtag">#${match.match_hashtag}</span>
                <span class="analytics-badge positive">${match.positive_percentage}%</span>
            </div>
            <div class="analytics-stats">
                <span class="analytics-stat">
                    😊 ${match.positive_count} positive
                </span>
                <span class="analytics-stat">
                    💬 ${match.total_tweets} total
                </span>
            </div>
            <div class="analytics-mini-bar">
                <div class="analytics-mini-bar-fill positive" style="width: ${match.positive_percentage}%"></div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function displayMostNegative(matches) {
    const container = document.getElementById('most-negative-list');
    
    if (!matches || matches.length === 0) {
        container.innerHTML = `
            <div class="empty-analytics">
                <div class="empty-analytics-icon">😞</div>
                <div>No data yet</div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    matches.forEach((match, index) => {
        const card = document.createElement('div');
        card.className = 'analytics-card';
        card.onclick = () => filterByHashtag(match.match_hashtag);
        
        card.innerHTML = `
            <div class="analytics-card-header">
                <span class="analytics-hashtag">#${match.match_hashtag}</span>
                <span class="analytics-badge negative">${match.negative_percentage}%</span>
            </div>
            <div class="analytics-stats">
                <span class="analytics-stat">
                    😞 ${match.negative_count} negative
                </span>
                <span class="analytics-stat">
                    💬 ${match.total_tweets} total
                </span>
            </div>
            <div class="analytics-mini-bar">
                <div class="analytics-mini-bar-fill negative" style="width: ${match.negative_percentage}%"></div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

function displayEmptyAnalytics() {
    const sections = ['most-comments-list', 'most-positive-list', 'most-negative-list'];
    sections.forEach(id => {
        const container = document.getElementById(id);
        container.innerHTML = `
            <div class="empty-analytics">
                <div class="empty-analytics-icon">📊</div>
                <div>Unable to load analytics</div>
            </div>
        `;
    });
}

function filterByHashtag(hashtag) {
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Find the match in cricket carousel and open comments
    // You can enhance this to highlight the match or auto-open comments
    alert(`Showing tweets for #${hashtag}`);
    // TODO: Implement filtering tweets by hashtag in main timeline
}

// Auto-refresh analytics every 2 minutes
function startAnalyticsRefresh() {
    loadAnalytics();
    analyticsRefreshInterval = setInterval(loadAnalytics, 120000); // 2 minutes
}

function stopAnalyticsRefresh() {
    if (analyticsRefreshInterval) {
        clearInterval(analyticsRefreshInterval);
    }
}

// Start analytics when page loads
startAnalyticsRefresh();


        // ======================= CRICKET SCORES =======================
        // ======================= CRICKET SCORES =======================
let cricketRefreshInterval;

async function loadCricketMatches() {
    try {
        const response = await fetch('http://127.0.0.1:8086/cricket/matches');
        const data = await response.json();
        
        displayCricketMatches(data.matches);
    } catch (error) {
        console.error('Failed to load cricket matches:', error);
        document.getElementById('cricket-matches').innerHTML = 
            '<p style="padding: 40px; text-align: center; color: #666;">Unable to load matches</p>';
    }
}

function displayCricketMatches(matches) {
    const container = document.getElementById('cricket-matches');
    if (!container) return;
    
    if (!matches || matches.length === 0) {
        container.innerHTML = '<p style="padding: 40px; text-align: center; color: #666;">No matches available</p>';
        return;
    }
    
    // Sort: Live first, then completed, then upcoming
    const sortedMatches = matches.sort((a, b) => {
        const stateOrder = { 
            'In Progress': 0, 
            'Innings Break': 0, 
            'Complete': 1, 
            'Preview': 2, 
            'Upcoming': 2 
        };
        const stateA = stateOrder[a.state] ?? 3;
        const stateB = stateOrder[b.state] ?? 3;
        
        if (stateA !== stateB) return stateA - stateB;
        return (b.timestamp || 0) - (a.timestamp || 0);
    });
    
    container.innerHTML = '';
    
    sortedMatches.forEach(match => {
        const matchCard = createMatchCard(match);
        container.appendChild(matchCard);
    });
}

function createMatchCard(match) {
    const card = document.createElement('div');
    
    const state = match.state || '';
    const isLive = state === 'In Progress' || state === 'Innings Break';
    const isCompleted = state === 'Complete';
    const isUpcoming = state === 'Preview' || state === 'Upcoming';
    
    card.className = 'cricket-match-card fade-in';
    if (isLive) card.classList.add('live');
    
    let statusBadge = '';
    if (isLive) {
        statusBadge = '<span class="live-indicator">🔴 LIVE</span>';
    } else if (isCompleted) {
        statusBadge = '<span class="completed-indicator">✅ ENDED</span>';
    } else {
        statusBadge = '<span class="upcoming-indicator">🕐 UPCOMING</span>';
    }
    
    const matchDate = match.timestamp ? new Date(match.timestamp * 1000) : null;
    const timeAgo = matchDate ? getTimeAgo(matchDate) : '';
    const matchHashtag = generateMatchHashtag(match);
    
    card.innerHTML = `
        <div class="match-header">
            <div class="match-title">${match.name || 'Cricket Match'}</div>
            ${statusBadge}
        </div>
        <div class="match-series">${match.series || match.matchType || ''}</div>
        ${matchHashtag ? `<div class="match-hashtag">#${matchHashtag}</div>` : ''}
        ${timeAgo ? `<div class="match-time">${timeAgo}</div>` : ''}
        <div class="match-teams">
            <div class="team">
                <div class="team-name">${match.teams?.[0] || 'Team 1'}</div>
                <div class="team-score">${match.score?.[0]?.inning || '-'}</div>
            </div>
            <div class="vs">VS</div>
            <div class="team">
                <div class="team-name">${match.teams?.[1] || 'Team 2'}</div>
                <div class="team-score">${match.score?.[1]?.inning || '-'}</div>
            </div>
        </div>
        <div class="match-status">${match.status || 'Scheduled'}</div>
        <div class="match-venue">📍 ${match.venue || 'Venue TBA'}</div>
        <div class="match-actions">
            <button onclick="viewMatchComments('${matchHashtag}', '${match.name}')" class="comments-btn">
                💬 Comments
            </button>
            <button onclick="tweetAboutMatch('${matchHashtag}', '${match.name}')" class="tweet-match-btn">
                🐦 Tweet
            </button>
        </div>
    `;
    
    return card;
}

// Carousel scroll function
function scrollCarousel(direction) {
    const container = document.getElementById('cricket-matches');
    const scrollAmount = 320; // card width + gap
    
    container.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
}

async function viewMatchDetails(matchId) {
    try {
        const response = await fetch(`http://127.0.0.1:8086/cricket/match/${matchId}`);
        const matchData = await response.json();
        
        alert(`Match Details:\n${JSON.stringify(matchData, null, 2)}`);
    } catch (error) {
        console.error('Failed to load match details:', error);
    }
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) {
        return '🔴 Live now';
    } else if (diffMins < 60) {
        return diffMins === 1 ? '1 minute ago' : `${diffMins} minutes ago`;
    } else if (diffHours < 24) {
        return diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`;
    } else {
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }
}

function startCricketRefresh() {
    loadCricketMatches();
    cricketRefreshInterval = setInterval(loadCricketMatches, 300000); // 5 minutes
}

function stopCricketRefresh() {
    if (cricketRefreshInterval) {
        clearInterval(cricketRefreshInterval);
    }
}

// Helper function to generate match hashtag
function generateMatchHashtag(match) {
    if (!match.teams || match.teams.length < 2) return null;
    
    // Get first 3 letters of each team, uppercase
    const team1 = match.teams[0].substring(0, 3).toUpperCase();
    const team2 = match.teams[1].substring(0, 3).toUpperCase();
    
    return `${team1}vs${team2}`;
}

// View comments for a specific match
async function viewMatchComments(matchHashtag, matchName) {
    if (!matchHashtag) {
        alert('Unable to load comments for this match');
        return;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'match-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>💬 ${matchName}</h2>
                <button class="close-modal" onclick="closeMatchModal()">×</button>
            </div>
            
            <div class="tweet-form-modal">
                <textarea id="match-tweet-content" placeholder="Share your thoughts about this match... #${matchHashtag}"></textarea>
                <button onclick="postMatchTweet('${matchHashtag}')">Post Comment</button>
            </div>
            
            <div class="match-tweets-list" id="match-tweets">
                <p style="text-align: center; color: #657786;">Loading comments...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load tweets for this match
    loadMatchTweets(matchHashtag);
    
    // Close modal when clicking outside
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeMatchModal();
        }
    });
}

// Tweet about a specific match (just opens the modal)
function tweetAboutMatch(matchHashtag, matchName) {
    viewMatchComments(matchHashtag, matchName);
}

// Close match modal
function closeMatchModal() {
    const modal = document.getElementById('match-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

// Load tweets for a specific match
async function loadMatchTweets(matchHashtag) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://127.0.0.1:8086/tweet/match/${matchHashtag}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to load tweets');
        }
        
        const tweets = await response.json();
        displayMatchTweets(tweets, matchHashtag);
    } catch (error) {
        console.error('Failed to load match tweets:', error);
        document.getElementById('match-tweets').innerHTML = 
            '<p class="no-tweets-message">Unable to load comments</p>';
    }
}

// Display tweets for a match
function displayMatchTweets(tweets, matchHashtag) {
    const container = document.getElementById('match-tweets');
    
    if (!tweets || tweets.length === 0) {
        container.innerHTML = `
            <p class="no-tweets-message">
                No comments yet. Be the first to share your thoughts!<br>
                <span style="font-size: 14px; color: #1da1f2;">#${matchHashtag}</span>
            </p>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    tweets.reverse().forEach(tweet => {
        const tweetElement = generateTweetHTML(tweet);
        container.innerHTML += tweetElement;
    });
}

// Post a tweet about a match
async function postMatchTweet(matchHashtag) {
    const content = document.getElementById('match-tweet-content').value;
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
            body: JSON.stringify({ 
                content: content,
                match_hashtag: matchHashtag
            })
        });

        if (response.status === 401) {
            alert('Session expired. Please login again.');
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Clear the input
        document.getElementById('match-tweet-content').value = '';
        
        // Reload match tweets
        loadMatchTweets(matchHashtag);
        
        // Also reload main timeline
        loadTweets();
    } catch (err) {
        console.error('Failed to post tweet:', err);
        alert('Failed to post comment. Please try again.');
    }
}

// Load and display match sentiment
async function loadMatchSentiment(matchHashtag) {
    try {
        const response = await fetch(`http://127.0.0.1:8086/sentiment/match/${matchHashtag}`);
        
        if (!response.ok) {
            console.log('No sentiment data available');
            return;
        }
        
        const sentimentData = await response.json();
        displaySentimentDashboard(sentimentData);
    } catch (error) {
        console.error('Failed to load sentiment:', error);
    }
}

function displaySentimentDashboard(data) {
    const dashboardHTML = `
        <div class="sentiment-dashboard">
            <div class="sentiment-header">
                <h3>📊 Fan Sentiment Analysis</h3>
                <div class="overall-sentiment">${data.emoji}</div>
                <div class="sentiment-label ${data.overall_sentiment}">
                    ${data.overall_sentiment.toUpperCase()}
                </div>
            </div>
            
            <div class="sentiment-bars">
                <div class="sentiment-bar-container">
                    <div class="sentiment-bar-label positive">
                        😊 Positive
                    </div>
                    <div class="sentiment-bar-track">
                        <div class="sentiment-bar-fill positive" style="width: ${data.positive_percentage}%">
                            ${data.positive_percentage}%
                        </div>
                    </div>
                </div>
                
                <div class="sentiment-bar-container">
                    <div class="sentiment-bar-label neutral">
                        😐 Neutral
                    </div>
                    <div class="sentiment-bar-track">
                        <div class="sentiment-bar-fill neutral" style="width: ${data.neutral_percentage}%">
                            ${data.neutral_percentage}%
                        </div>
                    </div>
                </div>
                
                <div class="sentiment-bar-container">
                    <div class="sentiment-bar-label negative">
                        😞 Negative
                    </div>
                    <div class="sentiment-bar-track">
                        <div class="sentiment-bar-fill negative" style="width: ${data.negative_percentage}%">
                            ${data.negative_percentage}%
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="sentiment-stats">
                <div class="sentiment-stat">
                    <div class="sentiment-stat-value" style="color: #10b981;">${data.positive_count}</div>
                    <div class="sentiment-stat-label">Positive</div>
                </div>
                <div class="sentiment-stat">
                    <div class="sentiment-stat-value" style="color: #f59e0b;">${data.neutral_count}</div>
                    <div class="sentiment-stat-label">Neutral</div>
                </div>
                <div class="sentiment-stat">
                    <div class="sentiment-stat-value" style="color: #ef4444;">${data.negative_count}</div>
                    <div class="sentiment-stat-label">Negative</div>
                </div>
            </div>
        </div>
    `;
    
    // Insert sentiment dashboard before tweet form
    const tweetForm = document.querySelector('.tweet-form-modal');
    if (tweetForm) {
        tweetForm.insertAdjacentHTML('beforebegin', dashboardHTML);
    }
}

// Update viewMatchComments function to include sentiment
async function viewMatchComments(matchHashtag, matchName) {
    if (!matchHashtag) {
        alert('Unable to load comments for this match');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'match-modal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>💬 ${matchName}</h2>
                <button class="close-modal" onclick="closeMatchModal()">×</button>
            </div>
            
            <!-- Sentiment dashboard will be inserted here -->
            
            <div class="tweet-form-modal">
                <textarea id="match-tweet-content" placeholder="Share your thoughts about this match... #${matchHashtag}"></textarea>
                <button onclick="postMatchTweet('${matchHashtag}')">Post Comment</button>
            </div>
            
            <div class="match-tweets-list" id="match-tweets">
                <p style="text-align: center; color: #657786;">Loading comments...</p>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Load sentiment analysis
    await loadMatchSentiment(matchHashtag);
    
    // Load tweets
    await loadMatchTweets(matchHashtag);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeMatchModal();
        }
    });
}

// Update displayMatchTweets to show sentiment badges
function displayMatchTweets(tweets, matchHashtag) {
    const container = document.getElementById('match-tweets');
    
    if (!tweets || tweets.length === 0) {
        container.innerHTML = `
            <p class="no-tweets-message">
                No comments yet. Be the first to share your thoughts!<br>
                <span style="font-size: 14px; color: #1da1f2;">#${matchHashtag}</span>
            </p>
        `;
        return;
    }
    
    container.innerHTML = '';
    
    tweets.reverse().forEach(tweet => {
        const sentimentBadge = tweet.sentiment ? 
            `<span class="tweet-sentiment ${tweet.sentiment}">
                ${tweet.sentiment === 'positive' ? '😊' : tweet.sentiment === 'negative' ? '😞' : '😐'}
                ${tweet.sentiment}
            </span>` : '';
        
        const tweetHTML = `
            <div class="tweet fade-in">
                <img class="avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(tweet.user)}&background=1da1f2&color=fff" alt="${tweet.user}">
                <div class="tweet-content">
                    <div class="tweet-header">
                        <span class="tweet-user">${tweet.user}</span>
                        ${sentimentBadge}
                    </div>
                    <div class="tweet-text">${tweet.content}</div>
                    <div class="tweet-actions">
                        <button class="like-btn" onclick="likeTweet(${tweet.id}, this)">
                            ❤️ ${tweet.likes}
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML += tweetHTML;
    });
}

// Update postMatchTweet to reload sentiment after posting
async function postMatchTweet(matchHashtag) {
    const content = document.getElementById('match-tweet-content').value;
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
            body: JSON.stringify({ 
                content: content,
                match_hashtag: matchHashtag
            })
        });

        if (response.status === 401) {
            alert('Session expired. Please login again.');
            logout();
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        document.getElementById('match-tweet-content').value = '';
        
        // Reload sentiment and tweets
        await loadMatchSentiment(matchHashtag);
        await loadMatchTweets(matchHashtag);
        loadTweets();
    } catch (err) {
        console.error('Failed to post tweet:', err);
        alert('Failed to post comment. Please try again.');
    }
}

startCricketRefresh();
