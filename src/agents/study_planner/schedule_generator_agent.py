#!/usr/bin/env python
"""
ScheduleGeneratorAgent - Creates personalized study schedules.

This agent takes the analysis from GoalAnalyzerAgent and generates
detailed study schedules with specific time blocks, topic allocations,
and difficulty progression.
"""

import json
from datetime import datetime, timedelta
from pathlib import Path
import sys
from typing import Any

# Add project root to path
_project_root = Path(__file__).parent.parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from src.agents.base_agent import BaseAgent
from src.di import Container


class ScheduleGeneratorAgent(BaseAgent):
    """
    Schedule Generator Agent - Creates personalized study schedules.

    This agent takes the structured analysis from GoalAnalyzerAgent and produces:
    - Daily/weekly study schedules
    - Time block allocations for each topic
    - Difficulty progression curves
    - Session-by-session learning objectives
    - Rest and review periods
    """

    def __init__(
        self,
        language: str = "en",
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
        *,
        container: Container | None = None,
        prompt_manager: Any | None = None,
        metrics_service: Any | None = None,
    ):
        """
        Initialize the ScheduleGeneratorAgent.

        Args:
            language: Language setting ('zh' | 'en'), default 'en'
            api_key: Optional API key (defaults to environment variable)
            base_url: Optional API endpoint (defaults to environment variable)
            model: Optional model name (defaults to environment variable)
        """
        super().__init__(
            module_name="study_planner",
            agent_name="schedule_generator",
            api_key=api_key,
            base_url=base_url,
            model=model,
            language=language,
            container=container,
            prompt_manager=prompt_manager,
            metrics_service=metrics_service,
        )
        # Load prompts using unified PromptManager
        self._prompts = self.prompt_manager.load_prompts(
            module_name="study_planner",
            agent_name="schedule_generator",
            language=language,
        )

    def _format_analysis_context(self, analysis: dict[str, Any]) -> str:
        """
        Format the goal analysis as context for schedule generation.

        Args:
            analysis: Analysis result from GoalAnalyzerAgent containing:
                - validated_topics: List of topics with priorities and hours
                - time_assessment: Time availability assessment
                - topic_relationships: Prerequisites and dependencies
                - difficulty_estimates: Difficulty levels for each topic
                - feasibility: Feasibility assessment
                - recommendations: Optimization suggestions

        Returns:
            Formatted string describing the analysis
        """
        parts = []

        # Format validated topics
        validated_topics = analysis.get("validated_topics", [])
        if validated_topics:
            topics_section = "## Topics to Schedule\n"
            for i, topic in enumerate(validated_topics, 1):
                topic_name = topic.get("topic", f"Topic {i}")
                priority = topic.get("priority", i)
                hours = topic.get("estimated_hours", 2)
                difficulty = topic.get("difficulty", "medium")
                prerequisites = topic.get("prerequisites", [])

                topics_section += f"""
### {i}. {topic_name}
- Priority: {priority}
- Estimated Hours: {hours}
- Difficulty: {difficulty}
- Prerequisites: {', '.join(prerequisites) if prerequisites else 'None'}"""
            parts.append(topics_section)

        # Format time assessment
        time_assessment = analysis.get("time_assessment", {})
        if time_assessment:
            total_hours = time_assessment.get("total_required_hours", 0)
            is_realistic = time_assessment.get("is_realistic", True)
            suggestions = time_assessment.get("adjustment_suggestions", [])

            time_section = f"""
## Time Assessment
- Total Required Hours: {total_hours}
- Is Realistic: {"Yes" if is_realistic else "No"}"""
            if suggestions:
                time_section += f"\n- Suggestions: {'; '.join(suggestions)}"
            parts.append(time_section)

        # Format topic relationships
        relationships = analysis.get("topic_relationships", [])
        if relationships:
            rel_section = "\n## Topic Dependencies\n"
            for rel in relationships:
                from_topic = rel.get("from_topic", "")
                to_topic = rel.get("to_topic", "")
                rel_type = rel.get("relationship", "related")
                rel_section += f"- {from_topic} -> {to_topic} ({rel_type})\n"
            parts.append(rel_section)

        # Format feasibility
        feasibility = analysis.get("feasibility", {})
        if feasibility:
            is_feasible = feasibility.get("is_feasible", True)
            confidence = feasibility.get("confidence", 0.7)
            concerns = feasibility.get("concerns", [])

            feas_section = f"""
## Feasibility Assessment
- Is Feasible: {"Yes" if is_feasible else "No"}
- Confidence: {confidence * 100:.0f}%"""
            if concerns:
                feas_section += f"\n- Concerns: {'; '.join(concerns)}"
            parts.append(feas_section)

        # Format recommendations
        recommendations = analysis.get("recommendations", [])
        if recommendations:
            rec_section = "\n## Recommendations\n"
            for rec in recommendations:
                rec_section += f"- {rec}\n"
            parts.append(rec_section)

        return "\n".join(parts) if parts else "No analysis data provided."

    def _format_constraints(self, constraints: dict[str, Any]) -> str:
        """
        Format user constraints for schedule generation.

        Args:
            constraints: Dictionary containing:
                - total_hours: Total available study hours
                - daily_hours: Preferred daily study hours
                - deadline: Optional deadline date (ISO format)
                - preferred_times: Optional list of preferred time slots
                - excluded_days: Optional list of days to exclude
                - session_duration: Preferred session duration in minutes
                - start_date: Optional start date (ISO format)

        Returns:
            Formatted string describing the constraints
        """
        parts = []

        if "start_date" in constraints:
            parts.append(f"- Start Date: {constraints['start_date']}")
        else:
            # Default to today
            parts.append(f"- Start Date: {datetime.now().strftime('%Y-%m-%d')} (today)")

        if "deadline" in constraints:
            parts.append(f"- Deadline: {constraints['deadline']}")

        if "total_hours" in constraints:
            parts.append(f"- Total Available Hours: {constraints['total_hours']} hours")

        if "daily_hours" in constraints:
            parts.append(f"- Preferred Daily Study Time: {constraints['daily_hours']} hours")

        if "preferred_times" in constraints:
            times = constraints["preferred_times"]
            if times:
                parts.append(f"- Preferred Time Slots: {', '.join(times)}")

        if "excluded_days" in constraints:
            days = constraints["excluded_days"]
            if days:
                parts.append(f"- Days to Exclude: {', '.join(days)}")

        if "session_duration" in constraints:
            parts.append(f"- Preferred Session Duration: {constraints['session_duration']} minutes")

        if not parts:
            return "No specific constraints provided. Generate a reasonable default schedule."

        return "\n".join(parts)

    def _calculate_schedule_duration(self, constraints: dict[str, Any]) -> int:
        """
        Calculate the number of days for the study schedule.

        Args:
            constraints: User constraints including deadline and daily hours

        Returns:
            Number of days for the schedule
        """
        if "deadline" in constraints:
            try:
                deadline = datetime.fromisoformat(constraints["deadline"].replace("Z", "+00:00"))
                start_date = datetime.now()
                if "start_date" in constraints:
                    start_date = datetime.fromisoformat(
                        constraints["start_date"].replace("Z", "+00:00")
                    )
                delta = deadline - start_date
                return max(1, delta.days)
            except (ValueError, TypeError):
                pass

        # Default: 2 weeks
        return 14

    async def process(
        self,
        analysis: dict[str, Any],
        constraints: dict[str, Any],
        notebooks: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """
        Generate a study schedule based on goal analysis and constraints.

        Args:
            analysis: Analysis result from GoalAnalyzerAgent containing:
                - validated_topics: List of topics with priorities and hours
                - time_assessment: Time availability assessment
                - topic_relationships: Prerequisites and dependencies
                - difficulty_estimates: Difficulty levels for each topic
                - feasibility: Feasibility assessment
                - recommendations: Optimization suggestions

            constraints: Dictionary containing:
                - total_hours: Total available study hours
                - daily_hours: Preferred daily study hours
                - deadline: Optional deadline date
                - preferred_times: Optional preferred time slots
                - excluded_days: Optional days to exclude
                - session_duration: Preferred session duration
                - start_date: Optional start date

            notebooks: Optional list of notebook metadata for context

        Returns:
            Dictionary containing:
                - success: Whether generation was successful
                - schedule: Generated schedule including:
                    - id: Unique schedule identifier
                    - created_at: Creation timestamp
                    - start_date: Schedule start date
                    - end_date: Schedule end date
                    - total_sessions: Total number of study sessions
                    - total_hours: Total scheduled hours
                    - daily_schedule: Day-by-day breakdown
                    - sessions: List of individual study sessions
                    - milestones: Key milestones and checkpoints
                    - summary: Overall schedule summary
                - error: Error message if generation failed
        """
        # Validate required inputs
        if not analysis:
            return {
                "success": False,
                "error": "No analysis data provided. Please run GoalAnalyzerAgent first.",
                "schedule": None,
            }

        validated_topics = analysis.get("validated_topics", [])
        if not validated_topics:
            return {
                "success": False,
                "error": "No topics found in analysis. Please provide topics to study.",
                "schedule": None,
            }

        # Get prompts
        system_prompt = self._prompts.get("system") if self._prompts else None
        if not system_prompt:
            self.logger.warning("System prompt not found, using default")
            system_prompt = self._get_default_system_prompt()

        user_template = self._prompts.get("user_template") if self._prompts else None
        if not user_template:
            self.logger.warning("User template not found, using default")
            user_template = self._get_default_user_template()

        # Format inputs for the prompt
        analysis_context = self._format_analysis_context(analysis)
        constraints_text = self._format_constraints(constraints or {})
        schedule_days = self._calculate_schedule_duration(constraints or {})

        # Format notebook context if available
        notebooks_context = ""
        if notebooks:
            notebooks_context = "\n## Available Learning Materials\n"
            for i, nb in enumerate(notebooks, 1):
                nb_name = nb.get("name", "Untitled")
                nb_id = nb.get("id", "unknown")
                topics = nb.get("topics", [])
                notebooks_context += f"- {nb_name} (ID: {nb_id})"
                if topics:
                    notebooks_context += f" - Topics: {', '.join(topics[:3])}"
                notebooks_context += "\n"

        # Get current date for schedule context
        current_date = datetime.now().strftime("%Y-%m-%d")

        # Format the user prompt
        user_prompt = user_template.format(
            analysis_context=analysis_context,
            constraints=constraints_text,
            notebooks_context=notebooks_context if notebooks_context else "No notebooks specified.",
            schedule_days=schedule_days,
            current_date=current_date,
        )

        try:
            self.logger.info(
                f"Generating schedule for {len(validated_topics)} topics over {schedule_days} days..."
            )

            response = await self.call_llm(
                user_prompt=user_prompt,
                system_prompt=system_prompt,
                response_format={"type": "json_object"},
            )

            self.logger.debug(f"LLM response length: {len(response)} chars")

            # Parse the response
            try:
                result = json.loads(response)

                # Validate and normalize the schedule
                schedule = self._validate_schedule_response(
                    result, validated_topics, constraints or {}
                )

                self.logger.info(
                    f"Schedule generated: {schedule.get('total_sessions', 0)} sessions, "
                    f"{schedule.get('total_hours', 0)} hours"
                )

                return {
                    "success": True,
                    "schedule": schedule,
                    "error": None,
                }

            except json.JSONDecodeError as e:
                self.logger.error(f"JSON decode error: {e}")
                self.logger.debug(f"Raw response: {response[:500]}...")

                # Try fallback schedule generation
                fallback_schedule = self._generate_fallback_schedule(
                    validated_topics, constraints or {}
                )
                return {
                    "success": True,
                    "schedule": fallback_schedule,
                    "error": None,
                    "note": "Generated using fallback algorithm due to LLM parsing error.",
                }

        except Exception as e:
            self.logger.error(f"Schedule generation failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "schedule": None,
            }

    def _validate_schedule_response(
        self,
        result: dict[str, Any],
        validated_topics: list[dict[str, Any]],
        constraints: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Validate and normalize the LLM schedule response.

        Args:
            result: Raw parsed JSON from LLM
            validated_topics: List of topics from analysis
            constraints: User constraints

        Returns:
            Normalized schedule dictionary
        """
        import uuid

        schedule = {}

        # Generate unique ID
        schedule["id"] = result.get("id", str(uuid.uuid4())[:8])

        # Timestamps
        schedule["created_at"] = datetime.now().isoformat()

        # Dates
        start_date = constraints.get("start_date", datetime.now().strftime("%Y-%m-%d"))
        schedule["start_date"] = result.get("start_date", start_date)

        end_date = constraints.get("deadline")
        if not end_date:
            # Calculate end date from start date + schedule duration
            try:
                start = datetime.fromisoformat(schedule["start_date"])
                days = self._calculate_schedule_duration(constraints)
                end = start + timedelta(days=days)
                end_date = end.strftime("%Y-%m-%d")
            except (ValueError, TypeError):
                end_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
        schedule["end_date"] = result.get("end_date", end_date)

        # Extract sessions
        sessions = result.get("sessions", [])
        if not sessions:
            # Try alternative keys
            sessions = result.get("study_sessions", [])
            if not sessions:
                sessions = result.get("schedule_sessions", [])

        # Validate and normalize sessions
        validated_sessions = []
        for i, session in enumerate(sessions):
            validated_session = {
                "session_id": session.get("session_id", f"session_{i + 1}"),
                "date": session.get("date", ""),
                "start_time": session.get("start_time", ""),
                "end_time": session.get("end_time", ""),
                "duration_minutes": session.get("duration_minutes", 60),
                "topic": session.get("topic", ""),
                "topic_id": session.get("topic_id", ""),
                "objectives": session.get("objectives", []),
                "difficulty": session.get("difficulty", "medium"),
                "session_type": session.get("session_type", "learning"),  # learning/review/practice
                "notebook_id": session.get("notebook_id", ""),
                "status": session.get("status", "pending"),
            }
            validated_sessions.append(validated_session)

        schedule["sessions"] = validated_sessions

        # Calculate totals
        schedule["total_sessions"] = len(validated_sessions)
        schedule["total_hours"] = sum(
            s.get("duration_minutes", 0) for s in validated_sessions
        ) / 60

        # Extract daily schedule
        daily_schedule = result.get("daily_schedule", {})
        if not daily_schedule and validated_sessions:
            # Build daily schedule from sessions
            daily_schedule = {}
            for session in validated_sessions:
                date = session.get("date", "")
                if date:
                    if date not in daily_schedule:
                        daily_schedule[date] = {
                            "sessions": [],
                            "total_minutes": 0,
                            "topics": [],
                        }
                    daily_schedule[date]["sessions"].append(session["session_id"])
                    daily_schedule[date]["total_minutes"] += session.get("duration_minutes", 0)
                    topic = session.get("topic", "")
                    if topic and topic not in daily_schedule[date]["topics"]:
                        daily_schedule[date]["topics"].append(topic)
        schedule["daily_schedule"] = daily_schedule

        # Extract milestones
        milestones = result.get("milestones", [])
        if not milestones:
            # Generate basic milestones based on topics
            milestones = []
            for i, topic in enumerate(validated_topics):
                topic_name = topic.get("topic", f"Topic {i + 1}")
                milestones.append({
                    "milestone_id": f"milestone_{i + 1}",
                    "name": f"Complete {topic_name}",
                    "target_date": "",
                    "topic": topic_name,
                    "criteria": f"Finish all sessions for {topic_name}",
                    "status": "pending",
                })
        schedule["milestones"] = milestones

        # Extract summary
        schedule["summary"] = result.get("summary", {
            "overview": f"Study plan covering {len(validated_topics)} topics",
            "weekly_hours": schedule["total_hours"] / max(1, (len(daily_schedule) / 7)),
            "difficulty_progression": "gradual",
            "key_focus_areas": [t.get("topic", "") for t in validated_topics[:3]],
        })

        # Extract topic allocations
        topic_allocations = result.get("topic_allocations", [])
        if not topic_allocations:
            # Calculate from sessions
            topic_hours: dict[str, float] = {}
            for session in validated_sessions:
                topic = session.get("topic", "")
                if topic:
                    hours = session.get("duration_minutes", 0) / 60
                    topic_hours[topic] = topic_hours.get(topic, 0) + hours

            topic_allocations = [
                {
                    "topic": topic,
                    "allocated_hours": hours,
                    "percentage": (hours / schedule["total_hours"] * 100)
                    if schedule["total_hours"] > 0
                    else 0,
                }
                for topic, hours in topic_hours.items()
            ]
        schedule["topic_allocations"] = topic_allocations

        return schedule

    def _generate_fallback_schedule(
        self,
        validated_topics: list[dict[str, Any]],
        constraints: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Generate a basic schedule when LLM response parsing fails.

        Args:
            validated_topics: List of topics from analysis
            constraints: User constraints

        Returns:
            Basic schedule dictionary
        """
        import uuid

        schedule = {
            "id": str(uuid.uuid4())[:8],
            "created_at": datetime.now().isoformat(),
        }

        # Calculate dates
        start_date = datetime.now()
        if "start_date" in constraints:
            try:
                start_date = datetime.fromisoformat(
                    constraints["start_date"].replace("Z", "+00:00")
                )
            except (ValueError, TypeError):
                pass

        schedule["start_date"] = start_date.strftime("%Y-%m-%d")

        # Calculate duration
        num_days = self._calculate_schedule_duration(constraints)
        end_date = start_date + timedelta(days=num_days)
        schedule["end_date"] = end_date.strftime("%Y-%m-%d")

        # Get session parameters
        daily_hours = constraints.get("daily_hours", 2)
        session_duration = constraints.get("session_duration", 60)
        excluded_days = constraints.get("excluded_days", [])

        # Map day names to weekday numbers
        day_map = {
            "monday": 0,
            "tuesday": 1,
            "wednesday": 2,
            "thursday": 3,
            "friday": 4,
            "saturday": 5,
            "sunday": 6,
        }
        excluded_weekdays = {
            day_map.get(day.lower(), -1) for day in excluded_days if day.lower() in day_map
        }

        # Generate sessions
        sessions = []
        current_date = start_date
        session_id = 1
        topic_index = 0

        # Calculate sessions per day
        sessions_per_day = max(1, int(daily_hours * 60 / session_duration))

        while current_date <= end_date and topic_index < len(validated_topics):
            # Skip excluded days
            if current_date.weekday() in excluded_weekdays:
                current_date += timedelta(days=1)
                continue

            current_topic = validated_topics[topic_index]
            topic_name = current_topic.get("topic", f"Topic {topic_index + 1}")
            topic_hours = current_topic.get("estimated_hours", 2)

            # Calculate remaining hours for this topic
            topic_sessions_created = sum(
                1 for s in sessions if s.get("topic") == topic_name
            )
            topic_hours_created = topic_sessions_created * session_duration / 60

            for _ in range(sessions_per_day):
                if topic_hours_created >= topic_hours:
                    # Move to next topic
                    topic_index += 1
                    if topic_index >= len(validated_topics):
                        break
                    current_topic = validated_topics[topic_index]
                    topic_name = current_topic.get("topic", f"Topic {topic_index + 1}")
                    topic_hours = current_topic.get("estimated_hours", 2)
                    topic_hours_created = 0

                session = {
                    "session_id": f"session_{session_id}",
                    "date": current_date.strftime("%Y-%m-%d"),
                    "start_time": "09:00",
                    "end_time": f"{9 + session_duration // 60}:{session_duration % 60:02d}",
                    "duration_minutes": session_duration,
                    "topic": topic_name,
                    "topic_id": str(topic_index + 1),
                    "objectives": [f"Study {topic_name}"],
                    "difficulty": current_topic.get("difficulty", "medium"),
                    "session_type": "learning",
                    "notebook_id": "",
                    "status": "pending",
                }
                sessions.append(session)
                session_id += 1
                topic_hours_created += session_duration / 60

            current_date += timedelta(days=1)

        schedule["sessions"] = sessions
        schedule["total_sessions"] = len(sessions)
        schedule["total_hours"] = sum(s.get("duration_minutes", 0) for s in sessions) / 60

        # Build daily schedule
        daily_schedule: dict[str, dict[str, Any]] = {}
        for session in sessions:
            date = session.get("date", "")
            if date:
                if date not in daily_schedule:
                    daily_schedule[date] = {
                        "sessions": [],
                        "total_minutes": 0,
                        "topics": [],
                    }
                daily_schedule[date]["sessions"].append(session["session_id"])
                daily_schedule[date]["total_minutes"] += session.get("duration_minutes", 0)
                topic = session.get("topic", "")
                if topic and topic not in daily_schedule[date]["topics"]:
                    daily_schedule[date]["topics"].append(topic)
        schedule["daily_schedule"] = daily_schedule

        # Generate milestones
        milestones = [
            {
                "milestone_id": f"milestone_{i + 1}",
                "name": f"Complete {topic.get('topic', f'Topic {i + 1}')}",
                "target_date": "",
                "topic": topic.get("topic", ""),
                "criteria": f"Finish all sessions for {topic.get('topic', '')}",
                "status": "pending",
            }
            for i, topic in enumerate(validated_topics)
        ]
        schedule["milestones"] = milestones

        # Generate summary
        schedule["summary"] = {
            "overview": f"Fallback study plan covering {len(validated_topics)} topics over {num_days} days",
            "weekly_hours": schedule["total_hours"] / max(1, num_days / 7),
            "difficulty_progression": "gradual",
            "key_focus_areas": [t.get("topic", "") for t in validated_topics[:3]],
        }

        # Calculate topic allocations
        topic_hours_map: dict[str, float] = {}
        for session in sessions:
            topic = session.get("topic", "")
            if topic:
                hours = session.get("duration_minutes", 0) / 60
                topic_hours_map[topic] = topic_hours_map.get(topic, 0) + hours

        schedule["topic_allocations"] = [
            {
                "topic": topic,
                "allocated_hours": hours,
                "percentage": (hours / schedule["total_hours"] * 100)
                if schedule["total_hours"] > 0
                else 0,
            }
            for topic, hours in topic_hours_map.items()
        ]

        return schedule

    def _get_default_system_prompt(self) -> str:
        """Get default system prompt when YAML prompts are not available."""
        return """You are an expert study planner and learning coach. Your task is to generate detailed, personalized study schedules based on analyzed goals and user constraints.

Your schedules should:
1. Respect user time constraints and preferences
2. Follow logical prerequisite relationships between topics
3. Include appropriate difficulty progression (start easier, gradually increase)
4. Balance intensive study with review sessions
5. Be realistic and achievable

Output your schedule as a JSON object with the following structure:
{
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "sessions": [
    {
      "session_id": "session_1",
      "date": "YYYY-MM-DD",
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "duration_minutes": 60,
      "topic": "Topic name",
      "topic_id": "1",
      "objectives": ["Objective 1", "Objective 2"],
      "difficulty": "easy|medium|hard",
      "session_type": "learning|review|practice",
      "notebook_id": "",
      "status": "pending"
    }
  ],
  "daily_schedule": {
    "YYYY-MM-DD": {
      "sessions": ["session_1", "session_2"],
      "total_minutes": 120,
      "topics": ["Topic A", "Topic B"]
    }
  },
  "milestones": [
    {
      "milestone_id": "milestone_1",
      "name": "Complete fundamentals",
      "target_date": "YYYY-MM-DD",
      "topic": "Topic name",
      "criteria": "Complete all foundation sessions",
      "status": "pending"
    }
  ],
  "topic_allocations": [
    {
      "topic": "Topic name",
      "allocated_hours": 10,
      "percentage": 25
    }
  ],
  "summary": {
    "overview": "Brief overview of the schedule",
    "weekly_hours": 10,
    "difficulty_progression": "gradual",
    "key_focus_areas": ["Area 1", "Area 2"]
  }
}"""

    def _get_default_user_template(self) -> str:
        """Get default user template when YAML prompts are not available."""
        return """## Schedule Generation Request

### Current Date
{current_date}

### Goal Analysis
{analysis_context}

### Time Constraints
{constraints}

### Learning Materials
{notebooks_context}

### Schedule Duration
Generate a schedule covering approximately {schedule_days} days.

---

Please generate a detailed study schedule based on this information. Include:
1. Specific study sessions with dates, times, and durations
2. Topic allocations and progression
3. Review and practice sessions
4. Milestones to track progress
5. An overall summary

Ensure the schedule:
- Respects the user's time constraints
- Follows prerequisite relationships between topics
- Has a gradual difficulty progression
- Includes regular review sessions
- Is achievable and realistic

Output your schedule as a valid JSON object."""


__all__ = ["ScheduleGeneratorAgent"]
