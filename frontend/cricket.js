// ======================= CRICKET SCORES =======================
let cricketRefreshInterval;

async function loadCricketMatches() {
    try {
        const response = await fetch('http://127.0.0.1:8086/cricket/matches');
        const data = await response.json();
        
        displayCricketMatches(data.matches);
    } catch (error) {
        console.error('Failed to load cricket matches:', error);
    }
}

function displayCricketMatches(matches) {
    const container = document.getElementById('cricket-matches');
    if (!container) return;
    
    if (!matches || matches.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">No live matches at the moment</p>';
        return;
    }
    
    container.innerHTML = '';
    
    // Filter only live and recent matches
    const liveMatches = matches.filter(m => 
        m.matchType === 'live' || m.status === 'Live' || m.matchStarted
    ).slice(0, 5);
    
    liveMatches.forEach(match => {
        const matchCard = createMatchCard(match);
        container.appendChild(matchCard);
    });
}

function createMatchCard(match) {
    const card = document.createElement('div');
    card.className = 'cricket-match-card';
    
    const isLive = match.matchType === 'live' || match.status === 'Live';
    const liveIndicator = isLive ? '<span class="live-indicator">🔴 LIVE</span>' : '';
    
    card.innerHTML = `
        <div class="match-header">
            <div class="match-title">${match.name || 'Cricket Match'}</div>
            ${liveIndicator}
        </div>
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
        <div class="match-status">${match.status || 'Match in progress'}</div>
        <button onclick="viewMatchDetails('${match.id}')" class="view-details-btn">
            View Details
        </button>
    `;
    
    return card;
}

async function viewMatchDetails(matchId) {
    try {
        const response = await fetch(`http://127.0.0.1:8086/cricket/match/${matchId}`);
        const matchData = await response.json();
        
        // You can show this in a modal or navigate to a details page
        alert(`Match Details:\n${JSON.stringify(matchData, null, 2)}`);
        // TODO: Create a proper modal/details view
    } catch (error) {
        console.error('Failed to load match details:', error);
    }
}

// Auto-refresh scores every 30 seconds
function startCricketRefresh() {
    loadCricketMatches(); // Load immediately
    cricketRefreshInterval = setInterval(loadCricketMatches, 30000); // Refresh every 30s
}

function stopCricketRefresh() {
    if (cricketRefreshInterval) {
        clearInterval(cricketRefreshInterval);
    }
}

// Start when page loads
startCricketRefresh();