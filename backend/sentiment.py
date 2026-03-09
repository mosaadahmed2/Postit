from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re

# Initialize VADER sentiment analyzer
vader_analyzer = SentimentIntensityAnalyzer()

def clean_text(text):
    """Clean text for sentiment analysis"""
    # Remove URLs
    text = re.sub(r'http\S+|www\S+|https\S+', '', text, flags=re.MULTILINE)
    # Remove mentions and hashtags for cleaner analysis
    text = re.sub(r'@\w+|#\w+', '', text)
    # Remove special characters but keep emojis
    text = re.sub(r'[^\w\s😀-🙏]', '', text)
    return text.strip()

def analyze_sentiment_textblob(text):
    """Analyze sentiment using TextBlob"""
    cleaned = clean_text(text)
    if not cleaned:
        return {
            "polarity": 0.0,
            "subjectivity": 0.0,
            "sentiment": "neutral"
        }
    
    blob = TextBlob(cleaned)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity
    
    # Classify sentiment
    if polarity > 0.1:
        sentiment = "positive"
    elif polarity < -0.1:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
    return {
        "polarity": round(polarity, 3),
        "subjectivity": round(subjectivity, 3),
        "sentiment": sentiment
    }

def analyze_sentiment_vader(text):
    """Analyze sentiment using VADER (better for social media)"""
    cleaned = clean_text(text)
    if not cleaned:
        return {
            "compound": 0.0,
            "positive": 0.0,
            "neutral": 1.0,
            "negative": 0.0,
            "sentiment": "neutral"
        }
    
    scores = vader_analyzer.polarity_scores(cleaned)
    
    # Classify based on compound score
    compound = scores['compound']
    if compound >= 0.05:
        sentiment = "positive"
    elif compound <= -0.05:
        sentiment = "negative"
    else:
        sentiment = "neutral"
    
    return {
        "compound": round(compound, 3),
        "positive": round(scores['pos'], 3),
        "neutral": round(scores['neu'], 3),
        "negative": round(scores['neg'], 3),
        "sentiment": sentiment
    }

def get_emoji_for_sentiment(sentiment):
    """Get emoji representation of sentiment"""
    emoji_map = {
        "positive": "😊",
        "negative": "😞",
        "neutral": "😐"
    }
    return emoji_map.get(sentiment, "😐")

def analyze_tweet_sentiment(text):
    """Comprehensive sentiment analysis combining both methods"""
    textblob_result = analyze_sentiment_textblob(text)
    vader_result = analyze_sentiment_vader(text)
    
    # Use VADER for primary sentiment (better for social media)
    primary_sentiment = vader_result['sentiment']
    
    return {
        "sentiment": primary_sentiment,
        "emoji": get_emoji_for_sentiment(primary_sentiment),
        "vader": vader_result,
        "textblob": textblob_result,
        "confidence": abs(vader_result['compound'])
    }

def analyze_match_sentiment(tweets):
    """Analyze overall sentiment for a match based on all tweets"""
    if not tweets:
        return {
            "overall_sentiment": "neutral",
            "positive_percentage": 0,
            "negative_percentage": 0,
            "neutral_percentage": 0,
            "total_tweets": 0,
            "sentiment_score": 0
        }
    
    sentiments = {"positive": 0, "negative": 0, "neutral": 0}
    total_compound = 0
    
    for tweet in tweets:
        analysis = analyze_tweet_sentiment(tweet['content'])
        sentiments[analysis['sentiment']] += 1
        total_compound += analysis['vader']['compound']
    
    total = len(tweets)
    avg_compound = total_compound / total if total > 0 else 0
    
    # Determine overall sentiment
    if avg_compound > 0.2:
        overall = "positive"
    elif avg_compound < -0.2:
        overall = "negative"
    else:
        overall = "neutral"
    
    return {
        "overall_sentiment": overall,
        "emoji": get_emoji_for_sentiment(overall),
        "positive_percentage": round((sentiments["positive"] / total) * 100, 1),
        "negative_percentage": round((sentiments["negative"] / total) * 100, 1),
        "neutral_percentage": round((sentiments["neutral"] / total) * 100, 1),
        "total_tweets": total,
        "sentiment_score": round(avg_compound, 3),
        "positive_count": sentiments["positive"],
        "negative_count": sentiments["negative"],
        "neutral_count": sentiments["neutral"]
    }