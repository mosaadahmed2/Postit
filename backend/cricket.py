import os
from datetime import datetime, timedelta
import random
import json

RAPIDAPI_KEY = os.getenv("RAPIDAPI_KEY", "9d64622ef2mshde86b4283a358c9p1485ddjsn4ed618915cf2")
RAPIDAPI_HOST = "cricbuzz-cricket.p.rapidapi.com"

# Use mock data until API limit resets
USE_MOCK_DATA = True  # Set to False when API limit resets

async def get_current_matches():
    """Fetch current matches - using mock data due to rate limits"""
    
    if USE_MOCK_DATA:
        return await get_mock_matches()
    
    # Real API code would go here (commented out for now)
    # ... your existing API code ...

async def get_mock_matches():
    """Generate realistic mock cricket matches"""
    
    matches_data = [
        {
            "teams": ["India", "Australia"],
            "series": "Border-Gavaskar Trophy 2026",
            "venue": "Melbourne Cricket Ground",
            "format": "Test",
            "state": "In Progress",
            "status": "India trail by 89 runs",
            "team1_score": "245/8",
            "team1_overs": "78.4",
            "team2_score": "334/10",
            "team2_overs": "102.0",
            "hours_ago": 2
        },
        {
            "teams": ["England", "Pakistan"],
            "series": "England vs Pakistan T20I Series",
            "venue": "Lord's Cricket Ground, London",
            "format": "T20",
            "state": "Complete",
            "status": "England won by 7 wickets",
            "team1_score": "167/3",
            "team1_overs": "18.2",
            "team2_score": "165/8",
            "team2_overs": "20.0",
            "hours_ago": 5
        },
        {
            "teams": ["South Africa", "New Zealand"],
            "series": "ICC Cricket World Cup 2026",
            "venue": "Newlands, Cape Town",
            "format": "ODI",
            "state": "In Progress",
            "status": "South Africa 234/5 (42 ov)",
            "team1_score": "234/5",
            "team1_overs": "42.0",
            "team2_score": "-",
            "team2_overs": "-",
            "hours_ago": 1
        },
        {
            "teams": ["Sri Lanka", "Bangladesh"],
            "series": "Asia Cup 2026",
            "venue": "R. Premadasa Stadium, Colombo",
            "format": "T20",
            "state": "Complete",
            "status": "Sri Lanka won by 25 runs",
            "team1_score": "178/6",
            "team1_overs": "20.0",
            "team2_score": "153/9",
            "team2_overs": "20.0",
            "hours_ago": 8
        },
        {
            "teams": ["West Indies", "Afghanistan"],
            "series": "West Indies vs Afghanistan ODI Series",
            "venue": "Kensington Oval, Bridgetown",
            "format": "ODI",
            "state": "Preview",
            "status": "Match starts in 2 hours",
            "team1_score": "-",
            "team1_overs": "-",
            "team2_score": "-",
            "team2_overs": "-",
            "hours_ago": -2
        },
        {
            "teams": ["India", "England"],
            "series": "IPL 2026",
            "venue": "Wankhede Stadium, Mumbai",
            "format": "T20",
            "state": "Complete",
            "status": "India won by 36 runs",
            "team1_score": "195/5",
            "team1_overs": "20.0",
            "team2_score": "159/8",
            "team2_overs": "20.0",
            "hours_ago": 12
        },
        {
            "teams": ["Australia", "Pakistan"],
            "series": "Australia vs Pakistan Test Series",
            "venue": "The Gabba, Brisbane",
            "format": "Test",
            "state": "In Progress",
            "status": "Australia 187/3 (55 ov), trail by 98 runs",
            "team1_score": "187/3",
            "team1_overs": "55.0",
            "team2_score": "285/10",
            "team2_overs": "89.3",
            "hours_ago": 3
        }
    ]
    
    matches = []
    now = datetime.utcnow()
    
    for i, match_data in enumerate(matches_data):
        match_time = now - timedelta(hours=match_data["hours_ago"])
        
        match = {
            "id": f"mock_match_{i}",
            "name": f"{match_data['teams'][0]} vs {match_data['teams'][1]}",
            "matchType": match_data["format"],
            "status": match_data["status"],
            "state": match_data["state"],
            "teams": match_data["teams"],
            "venue": match_data["venue"],
            "series": match_data["series"],
            "matchStarted": match_data["state"] != "Preview",
            "matchEnded": match_data["state"] == "Complete",
            "timestamp": match_time.timestamp(),
            "score": [
                {"inning": f"{match_data['team1_score']} ({match_data['team1_overs']} ov)" if match_data['team1_score'] != '-' else '-'},
                {"inning": f"{match_data['team2_score']} ({match_data['team2_overs']} ov)" if match_data['team2_score'] != '-' else '-'}
            ]
        }
        matches.append(match)
    
    # Sort by timestamp - newest first
    matches.sort(key=lambda x: x.get("timestamp", 0), reverse=True)
    
    return matches

async def get_match_info(match_id: str):
    """Return mock match info"""
    return {
        "id": match_id,
        "name": "India vs Australia",
        "venue": "Melbourne Cricket Ground",
        "series": "Border-Gavaskar Trophy 2026",
        "date": datetime.utcnow().isoformat(),
        "status": "In Progress",
        "matchType": "Test",
        "teams": ["India", "Australia"],
        "state": "In Progress"
    }

async def get_match_scorecard(match_id: str):
    """Return mock scorecard"""
    return {
        "id": match_id,
        "innings": [
            {
                "team": "India",
                "score": "245/8",
                "overs": "78.4",
                "batsmen": [
                    {"name": "Rohit Sharma", "runs": 65, "balls": 98, "fours": 8, "sixes": 2},
                    {"name": "Virat Kohli", "runs": 48, "balls": 87, "fours": 6, "sixes": 0},
                    {"name": "Shubman Gill", "runs": 34, "balls": 56, "fours": 4, "sixes": 1}
                ],
                "bowlers": [
                    {"name": "Pat Cummins", "overs": "18.4", "runs": 52, "wickets": 3},
                    {"name": "Mitchell Starc", "overs": "16.0", "runs": 48, "wickets": 2}
                ]
            },
            {
                "team": "Australia",
                "score": "334/10",
                "overs": "102.0",
                "batsmen": [
                    {"name": "Steve Smith", "runs": 121, "balls": 195, "fours": 14, "sixes": 1},
                    {"name": "Marnus Labuschagne", "runs": 78, "balls": 142, "fours": 10, "sixes": 0}
                ],
                "bowlers": [
                    {"name": "Jasprit Bumrah", "overs": "24.0", "runs": 68, "wickets": 4},
                    {"name": "Mohammed Shami", "overs": "22.0", "runs": 71, "wickets": 3}
                ]
            }
        ]
    }   