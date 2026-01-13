"""
Behavior Tracker Agent
======================

Agent for tracking and analyzing user learning behaviors.
"""

from typing import Any, Optional
import time
from datetime import datetime, timedelta

from src.agents.base_agent import BaseAgent
from src.api.utils.user_memory import get_user_memory_manager


class BehaviorTrackerAgent(BaseAgent):
    """
    Agent for behavioral analytics and pattern detection.

    Tracks:
    - Session duration and patterns
    - Peak learning hours
    - Topic switching frequency
    - Engagement metrics
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        base_url: Optional[str] = None,
        model: Optional[str] = None,
        language: str = "en",
        config: Optional[dict[str, Any]] = None,
        **kwargs,
    ):
        super().__init__(
            module_name="personalization",
            agent_name="behavior_tracker",
            api_key=api_key,
            base_url=base_url,
            model=model,
            language=language,
            config=config,
            **kwargs,
        )
        self.memory_manager = get_user_memory_manager()

    async def process(
        self,
        action: str,
        user_id: str = "default_user",
        **kwargs,
    ) -> dict[str, Any]:
        """
        Main processing method.

        Args:
            action: Action to perform - "track_session", "analyze_peaks", "get_insights"
            user_id: User identifier
            **kwargs: Additional action-specific parameters

        Returns:
            Action result dictionary
        """
        if action == "track_session":
            session_data = kwargs.get("session_data", {})
            return await self.track_session(user_id, session_data)
        elif action == "analyze_peaks":
            return await self.analyze_peak_hours(user_id)
        elif action == "get_insights":
            return await self.get_behavior_insights(user_id)
        else:
            return {"error": f"Unknown action: {action}"}

    async def track_session(
        self,
        user_id: str,
        session_data: dict[str, Any],
    ) -> dict[str, str]:
        """
        Track a learning session.

        Args:
            user_id: User identifier
            session_data: Session information
                - module: Module used
                - duration_seconds: Session duration
                - topic: Topic studied (optional)
                - success: Whether session was successful (optional)

        Returns:
            Confirmation dictionary
        """
        module = session_data.get("module", "unknown")
        duration = session_data.get("duration_seconds")
        topic = session_data.get("topic")
        success = session_data.get("success", True)

        # Record interaction
        self.memory_manager.record_interaction(
            module=module,
            duration_seconds=duration,
            topic=topic,
            success=success,
            user_id=user_id,
        )

        # Record topic if provided
        if topic:
            self.memory_manager.record_topic(
                topic,
                context=f"Session in {module} module",
                user_id=user_id,
            )

        self.logger.info(
            f"Tracked session: user={user_id}, module={module}, duration={duration}s"
        )

        return {
            "status": "recorded",
            "user_id": user_id,
            "module": module,
        }

    async def analyze_peak_hours(self, user_id: str = "default_user") -> dict[str, Any]:
        """
        Analyze peak learning hours for the user.

        Args:
            user_id: User identifier

        Returns:
            Peak hours analysis with recommendations
        """
        patterns = self.memory_manager.get_learning_patterns(user_id=user_id)
        peak_hours = patterns.get("peak_usage_hours", [])
        hourly_usage = patterns.get("hourly_usage", {})
        interaction_count = patterns.get("interaction_count", 0)

        if interaction_count < 5:
            return {
                "peak_hours": [],
                "confidence": 0.2,
                "message": "Insufficient data. Continue using the platform to identify your peak learning hours.",
                "recommendations": [
                    "Try studying at different times of day",
                    "Track when you feel most focused",
                ],
            }

        # Build analysis prompt
        system_prompt = self.get_prompt(
            "system",
            "You are an expert in learning science and behavioral analytics.",
        )

        hourly_data = [
            f"Hour {hour}: {count} sessions"
            for hour, count in sorted(hourly_usage.items(), key=lambda x: int(x[0]))
        ]

        user_prompt = f"""Analyze this user's learning patterns and provide insights.

Peak usage hours: {peak_hours}

Hourly breakdown:
{chr(10).join(hourly_data)}

Total interactions: {interaction_count}

Provide:
1. Optimal study schedule based on peak hours
2. Energy level recommendations
3. Tips for maintaining focus
4. Suggestions for off-peak productivity

Format as JSON:
{{
    "optimal_schedule": [
        {{"hour": 10, "activity": "Deep focus work", "reason": "Peak energy"}},
        ...
    ],
    "energy_patterns": "description of user's energy throughout day",
    "focus_tips": ["tip 1", "tip 2", ...],
    "recommendations": ["rec 1", "rec 2", ...]
}}"""

        try:
            response = await self.call_llm(
                user_prompt=user_prompt,
                system_prompt=system_prompt,
                response_format={"type": "json_object"},
                temperature=0.6,
                max_tokens=800,
            )

            import json

            result = json.loads(response)

            return {
                "user_id": user_id,
                "peak_hours": peak_hours,
                "confidence": min(0.9, interaction_count / 20),
                "total_sessions": interaction_count,
                **result,
            }

        except Exception as e:
            self.logger.error(f"Peak hours analysis failed: {e}")
            return {
                "user_id": user_id,
                "peak_hours": peak_hours,
                "confidence": 0.5,
                "total_sessions": interaction_count,
                "optimal_schedule": [
                    {"hour": h, "activity": "Focused study", "reason": "High usage time"}
                    for h in peak_hours[:3]
                ],
                "energy_patterns": "Based on your usage patterns, you're most active during certain hours.",
                "focus_tips": [
                    "Study during your peak hours when possible",
                    "Take breaks every 25-30 minutes",
                    "Minimize distractions during focused work",
                ],
                "recommendations": [
                    f"Schedule challenging topics around {peak_hours[0]}:00" if peak_hours else "Track more sessions to identify patterns",
                    "Use off-peak hours for review and light reading",
                ],
                "error": str(e),
            }

    async def get_behavior_insights(self, user_id: str = "default_user") -> dict[str, Any]:
        """
        Get comprehensive behavioral insights for the user.

        Args:
            user_id: User identifier

        Returns:
            Comprehensive behavior analysis
        """
        # Gather all user data
        patterns = self.memory_manager.get_learning_patterns(user_id=user_id)
        topics = self.memory_manager.get_topics(user_id=user_id, limit=20)
        recurring_questions = self.memory_manager.get_recurring_questions(
            user_id=user_id,
            min_frequency=2,
            limit=10,
        )
        preferences = self.memory_manager.get_preferences(user_id=user_id)

        interaction_count = patterns.get("interaction_count", 0)
        preferred_modules = patterns.get("preferred_modules", {})
        learning_velocity = patterns.get("learning_velocity", {})

        # Build comprehensive analysis prompt
        system_prompt = self.get_prompt(
            "system",
            "You are an expert learning analytics consultant.",
        )

        topics_summary = self._format_topics(topics)
        velocity_summary = self._format_velocity(learning_velocity)
        questions_summary = self._format_questions(recurring_questions)

        user_prompt = f"""Analyze this user's complete learning behavior and provide actionable insights.

ACTIVITY SUMMARY:
- Total interactions: {interaction_count}
- Preferred modules: {preferred_modules}
- Current preferences: {preferences}

TOPICS EXPLORED:
{topics_summary}

LEARNING VELOCITY:
{velocity_summary}

RECURRING QUESTIONS:
{questions_summary}

Provide comprehensive insights:
1. Learning strengths (what they're good at)
2. Areas for improvement (where they struggle)
3. Behavioral patterns (procrastination, consistency, focus)
4. Engagement level assessment
5. Personalized recommendations for improvement

Format as JSON:
{{
    "strengths": ["strength 1", "strength 2", ...],
    "improvement_areas": ["area 1", "area 2", ...],
    "patterns": {{
        "consistency": "high|medium|low",
        "focus_duration": "description",
        "topic_diversity": "description"
    }},
    "engagement_score": 0.0-1.0,
    "engagement_level": "high|medium|low",
    "recommendations": [
        {{"category": "study_habits", "suggestion": "...", "impact": "high|medium|low"}},
        ...
    ],
    "next_steps": ["step 1", "step 2", ...]
}}"""

        try:
            response = await self.call_llm(
                user_prompt=user_prompt,
                system_prompt=system_prompt,
                response_format={"type": "json_object"},
                temperature=0.6,
                max_tokens=1200,
            )

            import json

            result = json.loads(response)

            # Update memory with insights
            self.memory_manager.update_preference(
                "custom.last_behavior_analysis",
                time.time(),
                user_id=user_id,
            )

            # Store strengths and improvement areas in memory system
            strengths = result.get("strengths", [])
            improvement_areas = result.get("improvement_areas", [])

            self.memory_manager.update_preference(
                "custom.strength_areas",
                strengths,
                user_id=user_id,
            )
            self.memory_manager.update_preference(
                "custom.improvement_areas",
                improvement_areas,
                user_id=user_id,
            )

            return {
                "user_id": user_id,
                "analyzed_at": time.time(),
                "data_points": {
                    "total_interactions": interaction_count,
                    "topics_explored": len(topics),
                    "recurring_questions": len(recurring_questions),
                },
                **result,
            }

        except Exception as e:
            self.logger.error(f"Behavior insights generation failed: {e}")
            return {
                "user_id": user_id,
                "analyzed_at": time.time(),
                "data_points": {
                    "total_interactions": interaction_count,
                    "topics_explored": len(topics),
                    "recurring_questions": len(recurring_questions),
                },
                "strengths": ["Consistent platform usage" if interaction_count > 10 else "Exploring the platform"],
                "improvement_areas": ["Build more consistent study habits"],
                "patterns": {
                    "consistency": "medium",
                    "focus_duration": "Typical session lengths",
                    "topic_diversity": f"Exploring {len(topics)} different topics",
                },
                "engagement_score": min(1.0, interaction_count / 50),
                "engagement_level": "medium",
                "recommendations": [
                    {
                        "category": "study_habits",
                        "suggestion": "Set regular study times",
                        "impact": "high",
                    },
                    {
                        "category": "content",
                        "suggestion": "Explore topics that interest you",
                        "impact": "medium",
                    },
                ],
                "next_steps": [
                    "Continue tracking your learning sessions",
                    "Focus on building consistent habits",
                ],
                "error": str(e),
            }

    def _format_topics(self, topics: list[dict]) -> str:
        """Format topics into readable summary."""
        if not topics:
            return "No topics explored yet"

        lines = []
        for t in topics[:10]:
            name = t.get("name", "Unknown")
            freq = t.get("frequency", 0)
            lines.append(f"- {name}: {freq} interactions")
        return "\n".join(lines)

    def _format_velocity(self, velocity: dict) -> str:
        """Format learning velocity into readable summary."""
        if not velocity:
            return "No mastery data yet"

        lines = []
        for topic, data in list(velocity.items())[:8]:
            mastery = data.get("mastery_score", 0)
            attempts = data.get("attempts", 0)
            lines.append(f"- {topic}: {mastery:.1%} mastery ({attempts} attempts)")
        return "\n".join(lines)

    def _format_questions(self, questions: list[dict]) -> str:
        """Format recurring questions into readable summary."""
        if not questions:
            return "No recurring questions detected"

        lines = []
        for q in questions[:5]:
            pattern = q.get("normalized", "")[:80]
            freq = q.get("frequency", 0)
            lines.append(f"- [{freq}x] {pattern}")
        return "\n".join(lines)
