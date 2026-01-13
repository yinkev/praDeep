"""
Learning Path Agent
====================

Agent for generating personalized learning paths based on user's learning style,
difficulty level, and behavioral patterns.
"""

from typing import Any, Optional
import time

from src.agents.base_agent import BaseAgent
from src.api.utils.user_memory import get_user_memory_manager


class LearningPathAgent(BaseAgent):
    """
    Agent for personalized learning path generation.

    Features:
    - Learning style detection (visual, auditory, kinesthetic)
    - Difficulty calibration based on user history
    - Personalized learning path generation
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
            agent_name="learning_path",
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
            action: Action to perform - "detect_style", "calibrate_difficulty", "generate_path"
            user_id: User identifier
            **kwargs: Additional action-specific parameters

        Returns:
            Action result dictionary
        """
        if action == "detect_style":
            return await self.detect_learning_style(user_id)
        elif action == "calibrate_difficulty":
            topic = kwargs.get("topic", "")
            return await self.calibrate_difficulty(topic, user_id)
        elif action == "generate_path":
            topic = kwargs.get("topic", "")
            target_level = kwargs.get("target_level", "intermediate")
            return await self.generate_learning_path(topic, user_id, target_level)
        else:
            return {"error": f"Unknown action: {action}"}

    async def detect_learning_style(self, user_id: str = "default_user") -> dict[str, Any]:
        """
        Detect user's learning style based on interaction history.

        Analyzes:
        - Topic preferences and patterns
        - Interaction frequency with different content types
        - Success rates with various learning materials

        Args:
            user_id: User identifier

        Returns:
            Dictionary with style, confidence, and recommendations
        """
        # Get user history
        topics = self.memory_manager.get_topics(user_id=user_id, limit=20)
        patterns = self.memory_manager.get_learning_patterns(user_id=user_id)
        preferences = self.memory_manager.get_preferences(user_id=user_id)

        # Build analysis prompt
        system_prompt = self.get_prompt(
            "system",
            "You are an expert educational psychologist specializing in learning style analysis.",
        )

        topics_summary = self._format_topics_summary(topics)
        patterns_summary = self._format_patterns_summary(patterns)

        user_prompt = f"""Analyze this user's learning patterns and determine their primary learning style.

Topics explored:
{topics_summary}

Learning patterns:
{patterns_summary}

Current preferences:
{preferences}

Based on this data, determine if the user is primarily:
- Visual (learns best through diagrams, charts, visual representations)
- Auditory (learns best through explanations, discussions, verbal content)
- Kinesthetic (learns best through hands-on practice, examples, application)

Provide:
1. Primary learning style
2. Confidence level (0-1)
3. Supporting evidence
4. Personalized recommendations

Format as JSON:
{{
    "style": "visual|auditory|kinesthetic",
    "confidence": 0.0-1.0,
    "evidence": ["point 1", "point 2", ...],
    "recommendations": ["rec 1", "rec 2", ...]
}}"""

        try:
            response = await self.call_llm(
                user_prompt=user_prompt,
                system_prompt=system_prompt,
                response_format={"type": "json_object"},
                temperature=0.5,
                max_tokens=800,
            )

            import json

            result = json.loads(response)

            # Store detected style in preferences
            self.memory_manager.update_preference(
                "custom.learning_style",
                result.get("style"),
                user_id=user_id,
            )
            self.memory_manager.update_preference(
                "custom.learning_style_confidence",
                result.get("confidence"),
                user_id=user_id,
            )

            return result

        except Exception as e:
            self.logger.error(f"Learning style detection failed: {e}")
            # Return fallback based on interaction count
            interaction_count = patterns.get("interaction_count", 0)
            if interaction_count < 5:
                return {
                    "style": "adaptive",
                    "confidence": 0.3,
                    "evidence": ["Insufficient data for accurate detection"],
                    "recommendations": [
                        "Continue using the platform to build learning history",
                        "Try different types of content to discover your preferences",
                    ],
                }
            return {
                "style": "balanced",
                "confidence": 0.5,
                "evidence": ["Mixed interaction patterns detected"],
                "recommendations": [
                    "Explore visual diagrams and flowcharts",
                    "Review textual explanations",
                    "Practice with hands-on examples",
                ],
                "error": str(e),
            }

    async def calibrate_difficulty(
        self,
        topic: str,
        user_id: str = "default_user",
    ) -> dict[str, Any]:
        """
        Calibrate difficulty level for a specific topic based on user history.

        Args:
            topic: Topic to calibrate for
            user_id: User identifier

        Returns:
            Dictionary with recommended difficulty level and confidence
        """
        patterns = self.memory_manager.get_learning_patterns(user_id=user_id)
        learning_velocity = patterns.get("learning_velocity", {})

        topic_lower = topic.lower().strip()
        topic_data = learning_velocity.get(topic_lower, {})

        # Calculate mastery score
        mastery_score = topic_data.get("mastery_score", 0.0)
        attempts = topic_data.get("attempts", 0)

        # Get related topics
        topics = self.memory_manager.get_topics(user_id=user_id, limit=50)
        related_topics = [
            t
            for t in topics
            if topic_lower in t.get("name", "").lower()
            or t.get("name", "").lower() in topic_lower
        ]

        # Build calibration prompt
        system_prompt = self.get_prompt(
            "system",
            "You are an expert educational assessment specialist.",
        )

        user_prompt = f"""Calibrate the appropriate difficulty level for this topic based on user history.

Topic: {topic}

User's performance on this topic:
- Mastery score: {mastery_score:.2f} (0-1 scale)
- Number of attempts: {attempts}

Related topics explored:
{self._format_topics_summary(related_topics[:5])}

Determine the appropriate difficulty level:
- beginner: New to the topic, needs foundational concepts
- intermediate: Has basic understanding, ready for deeper exploration
- advanced: Strong grasp, ready for cutting-edge research

Provide confidence level (0-1) and reasoning.

Format as JSON:
{{
    "level": "beginner|intermediate|advanced",
    "confidence": 0.0-1.0,
    "reasoning": "explanation",
    "suggested_next_steps": ["step 1", "step 2", ...]
}}"""

        try:
            response = await self.call_llm(
                user_prompt=user_prompt,
                system_prompt=system_prompt,
                response_format={"type": "json_object"},
                temperature=0.4,
                max_tokens=600,
            )

            import json

            result = json.loads(response)
            return {
                "topic": topic,
                "user_id": user_id,
                **result,
            }

        except Exception as e:
            self.logger.error(f"Difficulty calibration failed: {e}")
            # Fallback based on mastery score
            if mastery_score < 0.3 or attempts < 2:
                level = "beginner"
            elif mastery_score < 0.7:
                level = "intermediate"
            else:
                level = "advanced"

            return {
                "topic": topic,
                "user_id": user_id,
                "level": level,
                "confidence": 0.6,
                "reasoning": f"Based on mastery score ({mastery_score:.2f}) and attempts ({attempts})",
                "suggested_next_steps": [
                    f"Start with {level}-level materials",
                    "Build consistent practice habits",
                ],
                "error": str(e),
            }

    async def generate_learning_path(
        self,
        topic: str,
        user_id: str = "default_user",
        target_level: str = "intermediate",
    ) -> dict[str, Any]:
        """
        Generate a personalized learning path for a topic.

        Args:
            topic: Topic to create path for
            user_id: User identifier
            target_level: Target difficulty level (beginner/intermediate/advanced)

        Returns:
            Structured learning path with milestones
        """
        # Get user context
        learning_style_data = await self.detect_learning_style(user_id)
        learning_style = learning_style_data.get("style", "balanced")

        difficulty_data = await self.calibrate_difficulty(topic, user_id)
        current_level = difficulty_data.get("level", "beginner")

        patterns = self.memory_manager.get_learning_patterns(user_id=user_id)
        peak_hours = patterns.get("peak_usage_hours", [])

        # Build learning path prompt
        system_prompt = self.get_prompt(
            "system",
            "You are an expert curriculum designer specializing in personalized learning paths.",
        )

        user_prompt = f"""Design a personalized learning path for this user.

Topic: {topic}
Current level: {current_level}
Target level: {target_level}
Learning style: {learning_style}
Peak study hours: {peak_hours}

Create a structured learning path with:
1. Clear milestones (5-7 milestones)
2. Estimated time for each milestone
3. Recommended resources/paper types
4. Practice activities
5. Success criteria for each milestone

Adapt the path for a {learning_style} learner:
- Visual: Include diagrams, flowcharts, visual representations
- Auditory: Include explanations, discussions, lecture-style content
- Kinesthetic: Include hands-on examples, code, practical applications

Format as JSON:
{{
    "overview": "brief description of the learning path",
    "estimated_total_hours": 20,
    "milestones": [
        {{
            "title": "Milestone 1",
            "description": "what to learn",
            "estimated_hours": 4,
            "resources": ["type of papers/materials needed"],
            "activities": ["what to do"],
            "success_criteria": ["how to know you've mastered it"]
        }}
    ],
    "tips": ["personalized tips for success"]
}}"""

        try:
            response = await self.call_llm(
                user_prompt=user_prompt,
                system_prompt=system_prompt,
                response_format={"type": "json_object"},
                temperature=0.7,
                max_tokens=1500,
            )

            import json

            result = json.loads(response)

            # Record topic for tracking
            self.memory_manager.record_topic(
                topic,
                context=f"Generated learning path to {target_level} level",
                user_id=user_id,
            )

            return {
                "topic": topic,
                "user_id": user_id,
                "current_level": current_level,
                "target_level": target_level,
                "learning_style": learning_style,
                "generated_at": time.time(),
                **result,
            }

        except Exception as e:
            self.logger.error(f"Learning path generation failed: {e}")
            return {
                "topic": topic,
                "user_id": user_id,
                "error": str(e),
                "overview": f"Unable to generate detailed path. Start with {current_level}-level materials.",
                "estimated_total_hours": 20,
                "milestones": [
                    {
                        "title": "Foundation",
                        "description": f"Build foundational knowledge in {topic}",
                        "estimated_hours": 8,
                        "resources": ["Introductory papers and tutorials"],
                        "activities": ["Read 3-5 foundational papers"],
                        "success_criteria": ["Can explain core concepts"],
                    },
                    {
                        "title": "Practice",
                        "description": "Apply concepts through examples",
                        "estimated_hours": 12,
                        "resources": ["Case studies and examples"],
                        "activities": ["Work through 5+ examples"],
                        "success_criteria": ["Can solve related problems independently"],
                    },
                ],
                "tips": ["Study during your peak hours", "Take regular breaks"],
            }

    def _format_topics_summary(self, topics: list[dict]) -> str:
        """Format topics list into readable summary."""
        if not topics:
            return "No topics recorded yet"

        lines = []
        for t in topics[:10]:
            name = t.get("name", "Unknown")
            freq = t.get("frequency", 0)
            lines.append(f"- {name} (explored {freq} times)")
        return "\n".join(lines)

    def _format_patterns_summary(self, patterns: dict) -> str:
        """Format learning patterns into readable summary."""
        interaction_count = patterns.get("interaction_count", 0)
        preferred_modules = patterns.get("preferred_modules", {})
        peak_hours = patterns.get("peak_usage_hours", [])

        modules_str = ", ".join([f"{k} ({v})" for k, v in list(preferred_modules.items())[:3]])

        return f"""Total interactions: {interaction_count}
Most used modules: {modules_str or "None yet"}
Peak learning hours: {', '.join(map(str, peak_hours)) or "Not determined"}"""
