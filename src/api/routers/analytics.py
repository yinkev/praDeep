"""
Analytics API router for learning progress and metrics visualization.

Provides endpoints for:
- Learning progress tracking
- Time spent per topic
- Knowledge gaps and strength areas
- Predictive success metrics
- Learning trajectories over time
"""

import time
from collections import defaultdict
from datetime import datetime
from enum import Enum

from fastapi import APIRouter

from src.api.utils.history import history_manager

router = APIRouter()


class TimeRange(str, Enum):
    DAY = "day"
    WEEK = "week"
    MONTH = "month"
    ALL = "all"


def _get_time_cutoff(time_range: TimeRange) -> float:
    """Get the timestamp cutoff for the given time range."""
    now = time.time()
    if time_range == TimeRange.DAY:
        return now - 86400  # 24 hours
    elif time_range == TimeRange.WEEK:
        return now - 604800  # 7 days
    elif time_range == TimeRange.MONTH:
        return now - 2592000  # 30 days
    else:
        return 0  # All time


@router.get("/summary")
async def get_analytics_summary(time_range: TimeRange = TimeRange.WEEK):
    """
    Get a summary of learning analytics.

    Returns:
        - Total activities by type
        - Total tokens used
        - Total cost
        - Topics covered
        - Average session duration
    """
    cutoff = _get_time_cutoff(time_range)
    history = history_manager._load_history()

    # Filter by time range
    filtered_history = [
        entry for entry in history
        if entry.get("timestamp", 0) >= cutoff
    ]

    # Activity counts by type
    activity_counts = defaultdict(int)
    total_tokens = 0
    total_cost = 0.0
    topics = set()

    for entry in filtered_history:
        entry_type = entry.get("type", "unknown")
        activity_counts[entry_type] += 1

        # Extract token stats from content
        content = entry.get("content", {})
        if isinstance(content, dict):
            token_stats = content.get("token_stats", {})
            if isinstance(token_stats, dict):
                total_tokens += token_stats.get("tokens", 0)
                total_cost += token_stats.get("cost", 0)

            # Extract topic/title
            title = entry.get("title", "")
            if title:
                topics.add(title[:50])  # Truncate long titles

    return {
        "time_range": time_range,
        "total_activities": len(filtered_history),
        "activity_breakdown": dict(activity_counts),
        "total_tokens": total_tokens,
        "total_cost": round(total_cost, 4),
        "unique_topics": len(topics),
        "topics_sample": list(topics)[:10],  # Sample of topics
    }


@router.get("/activity-timeline")
async def get_activity_timeline(time_range: TimeRange = TimeRange.WEEK, granularity: str = "day"):
    """
    Get activity counts over time for visualization.

    Args:
        time_range: Time period to analyze
        granularity: 'hour', 'day', or 'week'

    Returns:
        Timeline data suitable for charting
    """
    cutoff = _get_time_cutoff(time_range)
    history = history_manager._load_history()

    # Filter by time range
    filtered_history = [
        entry for entry in history
        if entry.get("timestamp", 0) >= cutoff
    ]

    # Group by time period
    timeline = defaultdict(lambda: defaultdict(int))

    for entry in filtered_history:
        timestamp = entry.get("timestamp", 0)
        entry_type = entry.get("type", "unknown")

        # Convert to datetime and format based on granularity
        dt = datetime.fromtimestamp(timestamp)
        if granularity == "hour":
            key = dt.strftime("%Y-%m-%d %H:00")
        elif granularity == "week":
            key = dt.strftime("%Y-W%W")
        else:  # day
            key = dt.strftime("%Y-%m-%d")

        timeline[key][entry_type] += 1
        timeline[key]["total"] += 1

    # Convert to list sorted by time
    result = []
    for time_key in sorted(timeline.keys()):
        data = {"time": time_key, **dict(timeline[time_key])}
        result.append(data)

    return {
        "time_range": time_range,
        "granularity": granularity,
        "data": result,
    }


@router.get("/learning-progress")
async def get_learning_progress(time_range: TimeRange = TimeRange.MONTH):
    """
    Get learning progress metrics showing improvement over time.

    Returns:
        - Questions attempted vs solved correctly
        - Topic mastery levels
        - Learning streak information
    """
    cutoff = _get_time_cutoff(time_range)
    history = history_manager._load_history()

    # Filter by time range
    filtered_history = [
        entry for entry in history
        if entry.get("timestamp", 0) >= cutoff
    ]

    # Track questions and solving sessions
    question_sessions = []
    solve_sessions = []
    research_sessions = []

    for entry in filtered_history:
        entry_type = entry.get("type", "")
        timestamp = entry.get("timestamp", 0)
        content = entry.get("content", {})

        if entry_type == "question":
            if isinstance(content, dict):
                question_sessions.append({
                    "timestamp": timestamp,
                    "topic": entry.get("title", ""),
                    "count": content.get("count", 1),
                })
        elif entry_type == "solve":
            solve_sessions.append({
                "timestamp": timestamp,
                "topic": entry.get("title", ""),
            })
        elif entry_type == "research":
            research_sessions.append({
                "timestamp": timestamp,
                "topic": entry.get("title", ""),
            })

    # Calculate daily activity for streak
    daily_activity = set()
    for entry in filtered_history:
        timestamp = entry.get("timestamp", 0)
        date = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d")
        daily_activity.add(date)

    # Calculate current streak
    today = datetime.now().strftime("%Y-%m-%d")
    streak = 0
    current_date = datetime.now()

    while True:
        date_str = current_date.strftime("%Y-%m-%d")
        if date_str in daily_activity:
            streak += 1
            current_date = datetime.fromtimestamp(current_date.timestamp() - 86400)
        else:
            break

    return {
        "time_range": time_range,
        "question_sessions": len(question_sessions),
        "solve_sessions": len(solve_sessions),
        "research_sessions": len(research_sessions),
        "total_sessions": len(filtered_history),
        "current_streak": streak,
        "active_days": len(daily_activity),
        "daily_average": round(len(filtered_history) / max(len(daily_activity), 1), 2),
    }


@router.get("/topic-analysis")
async def get_topic_analysis(time_range: TimeRange = TimeRange.MONTH):
    """
    Analyze topics to identify knowledge gaps and strength areas.

    Returns:
        - Topic frequency
        - Topic categorization (strength vs gap based on activity)
        - Recommended focus areas
    """
    cutoff = _get_time_cutoff(time_range)
    history = history_manager._load_history()

    # Filter by time range
    filtered_history = [
        entry for entry in history
        if entry.get("timestamp", 0) >= cutoff
    ]

    # Track topic frequency and recency
    topic_data = defaultdict(lambda: {
        "count": 0,
        "last_accessed": 0,
        "types": defaultdict(int),
    })

    for entry in filtered_history:
        title = entry.get("title", "").strip()
        if not title:
            continue

        # Normalize topic name (first 50 chars)
        topic = title[:50]

        topic_data[topic]["count"] += 1
        topic_data[topic]["last_accessed"] = max(
            topic_data[topic]["last_accessed"],
            entry.get("timestamp", 0)
        )
        topic_data[topic]["types"][entry.get("type", "unknown")] += 1

    # Sort by frequency and categorize
    sorted_topics = sorted(
        topic_data.items(),
        key=lambda x: x[1]["count"],
        reverse=True
    )

    # Top topics are strengths, least frequent are potential gaps
    strength_areas = []
    knowledge_gaps = []

    for topic, data in sorted_topics[:5]:
        strength_areas.append({
            "topic": topic,
            "sessions": data["count"],
            "activity_types": dict(data["types"]),
        })

    # Knowledge gaps: topics accessed only once or very long ago
    now = time.time()
    for topic, data in sorted_topics:
        days_since_last = (now - data["last_accessed"]) / 86400
        if data["count"] == 1 or days_since_last > 14:
            knowledge_gaps.append({
                "topic": topic,
                "sessions": data["count"],
                "days_since_last": round(days_since_last, 1),
            })
            if len(knowledge_gaps) >= 5:
                break

    return {
        "time_range": time_range,
        "total_topics": len(topic_data),
        "strength_areas": strength_areas,
        "knowledge_gaps": knowledge_gaps,
        "all_topics": [
            {
                "topic": topic,
                "count": data["count"],
                "types": dict(data["types"]),
            }
            for topic, data in sorted_topics[:20]
        ],
    }


@router.get("/predictions")
async def get_predictive_metrics(time_range: TimeRange = TimeRange.MONTH):
    """
    Get predictive success metrics based on learning patterns.

    Returns:
        - Predicted engagement level
        - Study consistency score
        - Recommended study time
    """
    cutoff = _get_time_cutoff(time_range)
    history = history_manager._load_history()

    # Filter by time range
    filtered_history = [
        entry for entry in history
        if entry.get("timestamp", 0) >= cutoff
    ]

    if not filtered_history:
        return {
            "time_range": time_range,
            "engagement_score": 0,
            "consistency_score": 0,
            "diversity_score": 0,
            "recommendations": ["Start your learning journey by exploring topics!"],
        }

    # Calculate engagement score (activity frequency)
    days_in_range = max((time.time() - cutoff) / 86400, 1)
    activities_per_day = len(filtered_history) / days_in_range
    engagement_score = min(100, int(activities_per_day * 33))  # 3+ activities/day = 100%

    # Calculate consistency score (spread of activity across days)
    daily_activity = set()
    for entry in filtered_history:
        timestamp = entry.get("timestamp", 0)
        date = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d")
        daily_activity.add(date)

    consistency_score = int((len(daily_activity) / days_in_range) * 100)

    # Calculate diversity score (variety of activity types)
    activity_types = set()
    for entry in filtered_history:
        activity_types.add(entry.get("type", "unknown"))

    diversity_score = min(100, len(activity_types) * 25)  # 4+ types = 100%

    # Generate recommendations
    recommendations = []

    if engagement_score < 50:
        recommendations.append("Try to engage with learning activities more regularly")

    if consistency_score < 50:
        recommendations.append("Establish a daily study routine for better retention")

    if diversity_score < 75:
        recommendations.append("Explore different learning modes (questions, research, solving)")

    if not recommendations:
        recommendations.append("Great progress! Keep up the consistent learning!")

    return {
        "time_range": time_range,
        "engagement_score": engagement_score,
        "consistency_score": consistency_score,
        "diversity_score": diversity_score,
        "overall_score": int((engagement_score + consistency_score + diversity_score) / 3),
        "total_activities": len(filtered_history),
        "active_days": len(daily_activity),
        "recommendations": recommendations,
    }
