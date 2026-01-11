#!/usr/bin/env python
"""
ProgressTrackerAgent - Analyzes performance and suggests schedule adjustments.

This agent tracks user progress through their study plan, analyzes performance
metrics from completed sessions, and provides recommendations for adjusting
the remaining schedule.
"""

import json
from datetime import datetime
from pathlib import Path
import sys
from typing import Any

# Add project root to path
_project_root = Path(__file__).parent.parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from src.agents.base_agent import BaseAgent
from src.services.prompt import get_prompt_manager


class ProgressTrackerAgent(BaseAgent):
    """
    Progress Tracker Agent - Analyzes performance and suggests schedule adjustments.

    This agent takes performance data from completed study sessions and produces:
    - Progress metrics and statistics
    - Performance analysis by topic
    - Pace assessment (ahead/behind/on-track)
    - Schedule adjustment recommendations
    - Motivational insights and encouragement
    """

    def __init__(
        self,
        language: str = "en",
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
    ):
        """
        Initialize the ProgressTrackerAgent.

        Args:
            language: Language setting ('zh' | 'en'), default 'en'
            api_key: Optional API key (defaults to environment variable)
            base_url: Optional API endpoint (defaults to environment variable)
            model: Optional model name (defaults to environment variable)
        """
        super().__init__(
            module_name="study_planner",
            agent_name="progress_tracker",
            api_key=api_key,
            base_url=base_url,
            model=model,
            language=language,
        )
        # Load prompts using unified PromptManager
        self._prompts = get_prompt_manager().load_prompts(
            module_name="study_planner",
            agent_name="progress_tracker",
            language=language,
        )

    def _format_schedule_context(self, schedule: dict[str, Any]) -> str:
        """
        Format the study schedule as context for progress analysis.

        Args:
            schedule: The study schedule containing:
                - id: Schedule identifier
                - start_date: Schedule start date
                - end_date: Schedule end date
                - sessions: List of study sessions
                - milestones: List of milestones
                - topic_allocations: Topic allocation data

        Returns:
            Formatted string describing the schedule
        """
        parts = []

        # Basic schedule info
        schedule_id = schedule.get("id", "unknown")
        start_date = schedule.get("start_date", "")
        end_date = schedule.get("end_date", "")
        total_sessions = schedule.get("total_sessions", 0)
        total_hours = schedule.get("total_hours", 0)

        parts.append(f"""## Schedule Overview
- Schedule ID: {schedule_id}
- Start Date: {start_date}
- End Date: {end_date}
- Total Sessions: {total_sessions}
- Total Hours: {total_hours:.1f}""")

        # Topic allocations
        topic_allocations = schedule.get("topic_allocations", [])
        if topic_allocations:
            topics_section = "\n## Topic Allocations\n"
            for alloc in topic_allocations:
                topic = alloc.get("topic", "Unknown")
                hours = alloc.get("allocated_hours", 0)
                pct = alloc.get("percentage", 0)
                topics_section += f"- {topic}: {hours:.1f} hours ({pct:.0f}%)\n"
            parts.append(topics_section)

        # Milestones
        milestones = schedule.get("milestones", [])
        if milestones:
            milestones_section = "\n## Milestones\n"
            for ms in milestones:
                name = ms.get("name", "")
                status = ms.get("status", "pending")
                target_date = ms.get("target_date", "")
                milestones_section += f"- {name}: {status}"
                if target_date:
                    milestones_section += f" (target: {target_date})"
                milestones_section += "\n"
            parts.append(milestones_section)

        return "\n".join(parts)

    def _format_completed_sessions(self, sessions: list[dict[str, Any]]) -> str:
        """
        Format completed session data for analysis.

        Args:
            sessions: List of completed session data containing:
                - session_id: Session identifier
                - topic: Topic studied
                - scheduled_date: Original scheduled date
                - actual_date: When session was actually completed
                - scheduled_duration: Original duration in minutes
                - actual_duration: Actual time spent in minutes
                - completion_status: completed/partial/skipped
                - performance_rating: User self-rating (1-5) or null
                - notes: Optional user notes
                - comprehension_score: Optional comprehension score (0-100)

        Returns:
            Formatted string describing completed sessions
        """
        if not sessions:
            return "No sessions completed yet."

        parts = ["## Completed Sessions\n"]

        for i, session in enumerate(sessions, 1):
            session_id = session.get("session_id", f"session_{i}")
            topic = session.get("topic", "Unknown")
            actual_date = session.get("actual_date", session.get("scheduled_date", ""))
            scheduled_duration = session.get("scheduled_duration", 0)
            actual_duration = session.get("actual_duration", 0)
            status = session.get("completion_status", "completed")
            rating = session.get("performance_rating")
            comprehension = session.get("comprehension_score")
            notes = session.get("notes", "")

            session_info = f"""
### Session {i}: {session_id}
- Topic: {topic}
- Date: {actual_date}
- Duration: {actual_duration} min (scheduled: {scheduled_duration} min)
- Status: {status}"""

            if rating is not None:
                session_info += f"\n- Self-rating: {rating}/5"

            if comprehension is not None:
                session_info += f"\n- Comprehension: {comprehension}%"

            if notes:
                session_info += f"\n- Notes: {notes}"

            parts.append(session_info)

        return "\n".join(parts)

    def _format_pending_sessions(self, sessions: list[dict[str, Any]]) -> str:
        """
        Format pending/upcoming session data.

        Args:
            sessions: List of pending sessions from the schedule

        Returns:
            Formatted string describing pending sessions
        """
        if not sessions:
            return "No pending sessions."

        parts = ["## Pending Sessions\n"]

        # Group by topic for summary
        topic_counts: dict[str, int] = {}
        topic_hours: dict[str, float] = {}

        for session in sessions:
            topic = session.get("topic", "Unknown")
            duration = session.get("duration_minutes", 60)

            topic_counts[topic] = topic_counts.get(topic, 0) + 1
            topic_hours[topic] = topic_hours.get(topic, 0) + duration / 60

        parts.append(f"Total pending: {len(sessions)} sessions\n")

        for topic in topic_counts:
            parts.append(
                f"- {topic}: {topic_counts[topic]} sessions ({topic_hours[topic]:.1f} hours remaining)"
            )

        return "\n".join(parts)

    def _calculate_basic_metrics(
        self,
        completed_sessions: list[dict[str, Any]],
        pending_sessions: list[dict[str, Any]],
        schedule: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Calculate basic progress metrics from session data.

        Args:
            completed_sessions: List of completed session data
            pending_sessions: List of pending sessions
            schedule: The full study schedule

        Returns:
            Dictionary containing calculated metrics
        """
        metrics = {}

        # Completion metrics
        total_sessions = schedule.get("total_sessions", 0)
        completed_count = len(completed_sessions)
        pending_count = len(pending_sessions)

        metrics["total_sessions"] = total_sessions
        metrics["completed_sessions"] = completed_count
        metrics["pending_sessions"] = pending_count
        metrics["completion_percentage"] = (
            (completed_count / total_sessions * 100) if total_sessions > 0 else 0
        )

        # Time metrics
        scheduled_time = sum(
            s.get("scheduled_duration", 60) for s in completed_sessions
        )
        actual_time = sum(s.get("actual_duration", 0) for s in completed_sessions)

        metrics["total_scheduled_minutes"] = scheduled_time
        metrics["total_actual_minutes"] = actual_time
        metrics["time_efficiency"] = (
            (actual_time / scheduled_time * 100) if scheduled_time > 0 else 100
        )

        # Performance metrics
        ratings = [
            s.get("performance_rating")
            for s in completed_sessions
            if s.get("performance_rating") is not None
        ]
        if ratings:
            metrics["average_rating"] = sum(ratings) / len(ratings)
            metrics["ratings_count"] = len(ratings)
        else:
            metrics["average_rating"] = None
            metrics["ratings_count"] = 0

        comprehension_scores = [
            s.get("comprehension_score")
            for s in completed_sessions
            if s.get("comprehension_score") is not None
        ]
        if comprehension_scores:
            metrics["average_comprehension"] = sum(comprehension_scores) / len(
                comprehension_scores
            )
            metrics["comprehension_count"] = len(comprehension_scores)
        else:
            metrics["average_comprehension"] = None
            metrics["comprehension_count"] = 0

        # Topic breakdown
        topic_metrics: dict[str, dict[str, Any]] = {}
        for session in completed_sessions:
            topic = session.get("topic", "Unknown")
            if topic not in topic_metrics:
                topic_metrics[topic] = {
                    "completed_sessions": 0,
                    "total_minutes": 0,
                    "ratings": [],
                    "comprehension_scores": [],
                    "statuses": [],
                }

            topic_metrics[topic]["completed_sessions"] += 1
            topic_metrics[topic]["total_minutes"] += session.get("actual_duration", 0)

            if session.get("performance_rating") is not None:
                topic_metrics[topic]["ratings"].append(session["performance_rating"])

            if session.get("comprehension_score") is not None:
                topic_metrics[topic]["comprehension_scores"].append(
                    session["comprehension_score"]
                )

            topic_metrics[topic]["statuses"].append(
                session.get("completion_status", "completed")
            )

        # Calculate averages for each topic
        for topic in topic_metrics:
            data = topic_metrics[topic]
            if data["ratings"]:
                data["average_rating"] = sum(data["ratings"]) / len(data["ratings"])
            else:
                data["average_rating"] = None

            if data["comprehension_scores"]:
                data["average_comprehension"] = sum(data["comprehension_scores"]) / len(
                    data["comprehension_scores"]
                )
            else:
                data["average_comprehension"] = None

            # Calculate completion rate (completed vs partial/skipped)
            completed_status_count = sum(
                1 for s in data["statuses"] if s == "completed"
            )
            data["completion_rate"] = (
                completed_status_count / len(data["statuses"]) * 100
            ) if data["statuses"] else 100

            # Clean up internal lists
            del data["ratings"]
            del data["comprehension_scores"]
            del data["statuses"]

        metrics["topic_breakdown"] = topic_metrics

        # Pace assessment
        start_date = schedule.get("start_date", "")
        end_date = schedule.get("end_date", "")
        today = datetime.now().strftime("%Y-%m-%d")

        if start_date and end_date:
            try:
                start = datetime.fromisoformat(start_date)
                end = datetime.fromisoformat(end_date)
                now = datetime.fromisoformat(today)

                total_days = (end - start).days or 1
                elapsed_days = max(0, (now - start).days)

                expected_progress = (elapsed_days / total_days) * 100
                actual_progress = metrics["completion_percentage"]

                metrics["expected_progress"] = expected_progress
                metrics["progress_difference"] = actual_progress - expected_progress

                if actual_progress >= expected_progress + 10:
                    metrics["pace_status"] = "ahead"
                elif actual_progress <= expected_progress - 10:
                    metrics["pace_status"] = "behind"
                else:
                    metrics["pace_status"] = "on_track"
            except (ValueError, TypeError):
                metrics["pace_status"] = "unknown"
                metrics["expected_progress"] = None
                metrics["progress_difference"] = None
        else:
            metrics["pace_status"] = "unknown"
            metrics["expected_progress"] = None
            metrics["progress_difference"] = None

        return metrics

    async def process(
        self,
        schedule: dict[str, Any],
        completed_sessions: list[dict[str, Any]],
        constraints: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """
        Analyze progress and generate recommendations for schedule adjustments.

        Args:
            schedule: The study schedule containing:
                - id: Schedule identifier
                - start_date: Schedule start date
                - end_date: Schedule end date
                - sessions: List of all study sessions
                - milestones: List of milestones
                - topic_allocations: Topic allocation data

            completed_sessions: List of completed session data containing:
                - session_id: Session identifier
                - topic: Topic studied
                - scheduled_date: Original scheduled date
                - actual_date: When session was actually completed
                - scheduled_duration: Original duration in minutes
                - actual_duration: Actual time spent in minutes
                - completion_status: completed/partial/skipped
                - performance_rating: User self-rating (1-5) or null
                - notes: Optional user notes
                - comprehension_score: Optional comprehension score (0-100)

            constraints: Optional updated user constraints (if user wants to change
                         their availability or deadline)

        Returns:
            Dictionary containing:
                - success: Whether analysis was successful
                - analysis: Progress analysis including:
                    - metrics: Calculated progress metrics
                    - performance_summary: Overall performance summary
                    - topic_analysis: Per-topic performance analysis
                    - pace_assessment: Assessment of study pace
                    - recommendations: List of recommendations
                    - schedule_adjustments: Suggested schedule changes
                    - motivation: Motivational message
                - error: Error message if analysis failed
        """
        # Validate required inputs
        if not schedule:
            return {
                "success": False,
                "error": "No schedule provided. Please provide the study schedule.",
                "analysis": None,
            }

        all_sessions = schedule.get("sessions", [])
        if not all_sessions:
            return {
                "success": False,
                "error": "Schedule has no sessions. Please generate a schedule first.",
                "analysis": None,
            }

        # Identify completed session IDs
        completed_ids = {s.get("session_id") for s in completed_sessions}

        # Filter pending sessions from schedule
        pending_sessions = [
            s for s in all_sessions if s.get("session_id") not in completed_ids
        ]

        # Calculate basic metrics
        metrics = self._calculate_basic_metrics(
            completed_sessions, pending_sessions, schedule
        )

        # If no sessions completed yet, return basic metrics without LLM analysis
        if not completed_sessions:
            return {
                "success": True,
                "analysis": {
                    "metrics": metrics,
                    "performance_summary": "No sessions completed yet. Start studying to track your progress!",
                    "topic_analysis": {},
                    "pace_assessment": {
                        "status": "not_started",
                        "message": "Your study plan is ready. Complete your first session to begin tracking progress.",
                    },
                    "recommendations": [
                        "Start with your first scheduled session",
                        "Set a specific time each day for studying",
                        "Review the schedule and prepare necessary materials",
                    ],
                    "schedule_adjustments": [],
                    "motivation": "You've got this! Taking the first step is the hardest part. Let's get started!",
                },
                "error": None,
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

        # Format contexts
        schedule_context = self._format_schedule_context(schedule)
        completed_context = self._format_completed_sessions(completed_sessions)
        pending_context = self._format_pending_sessions(pending_sessions)

        # Format constraints if provided
        constraints_text = ""
        if constraints:
            constraints_parts = []
            if "total_hours" in constraints:
                constraints_parts.append(f"- Updated total hours: {constraints['total_hours']}")
            if "daily_hours" in constraints:
                constraints_parts.append(f"- Updated daily hours: {constraints['daily_hours']}")
            if "deadline" in constraints:
                constraints_parts.append(f"- Updated deadline: {constraints['deadline']}")
            if constraints_parts:
                constraints_text = "## Updated Constraints\n" + "\n".join(constraints_parts)

        # Format metrics for prompt
        metrics_text = f"""## Current Metrics
- Completion: {metrics['completed_sessions']}/{metrics['total_sessions']} sessions ({metrics['completion_percentage']:.1f}%)
- Time spent: {metrics['total_actual_minutes']} minutes (scheduled: {metrics['total_scheduled_minutes']} minutes)
- Time efficiency: {metrics['time_efficiency']:.1f}%
- Pace status: {metrics['pace_status']}"""

        if metrics["average_rating"] is not None:
            metrics_text += f"\n- Average self-rating: {metrics['average_rating']:.1f}/5"

        if metrics["average_comprehension"] is not None:
            metrics_text += f"\n- Average comprehension: {metrics['average_comprehension']:.1f}%"

        if metrics["progress_difference"] is not None:
            diff = metrics["progress_difference"]
            if diff > 0:
                metrics_text += f"\n- Progress: {diff:.1f}% ahead of schedule"
            elif diff < 0:
                metrics_text += f"\n- Progress: {abs(diff):.1f}% behind schedule"
            else:
                metrics_text += "\n- Progress: exactly on track"

        # Format the user prompt
        user_prompt = user_template.format(
            schedule_context=schedule_context,
            completed_sessions=completed_context,
            pending_sessions=pending_context,
            metrics=metrics_text,
            constraints=constraints_text if constraints_text else "No constraint changes.",
            current_date=datetime.now().strftime("%Y-%m-%d"),
        )

        try:
            self.logger.info(
                f"Analyzing progress: {metrics['completed_sessions']}/{metrics['total_sessions']} sessions completed..."
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

                # Validate and normalize the response
                analysis = self._validate_analysis_response(result, metrics)

                self.logger.info(
                    f"Progress analysis complete: pace={analysis['pace_assessment'].get('status', 'unknown')}, "
                    f"{len(analysis.get('recommendations', []))} recommendations"
                )

                return {
                    "success": True,
                    "analysis": analysis,
                    "error": None,
                }

            except json.JSONDecodeError as e:
                self.logger.error(f"JSON decode error: {e}")
                self.logger.debug(f"Raw response: {response[:500]}...")

                # Return basic analysis with metrics
                return {
                    "success": True,
                    "analysis": self._generate_fallback_analysis(metrics),
                    "error": None,
                    "note": "Generated using fallback algorithm due to LLM parsing error.",
                }

        except Exception as e:
            self.logger.error(f"Progress analysis failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "analysis": None,
            }

    def _validate_analysis_response(
        self, result: dict[str, Any], metrics: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Validate and normalize the LLM analysis response.

        Args:
            result: Raw parsed JSON from LLM
            metrics: Calculated metrics

        Returns:
            Normalized analysis dictionary
        """
        analysis = {}

        # Include calculated metrics
        analysis["metrics"] = metrics

        # Extract performance summary
        analysis["performance_summary"] = result.get(
            "performance_summary",
            "Your progress is being tracked. Keep up the good work!",
        )

        # Extract topic analysis
        topic_analysis = result.get("topic_analysis", {})
        if not topic_analysis and metrics.get("topic_breakdown"):
            # Build from metrics if not provided
            topic_analysis = {}
            for topic, data in metrics["topic_breakdown"].items():
                topic_analysis[topic] = {
                    "performance": "good"
                    if (data.get("average_rating") or 3) >= 3.5
                    else "needs_improvement",
                    "time_spent_minutes": data.get("total_minutes", 0),
                    "sessions_completed": data.get("completed_sessions", 0),
                    "insights": [],
                }
        analysis["topic_analysis"] = topic_analysis

        # Extract pace assessment
        pace_status = metrics.get("pace_status", "unknown")
        pace_assessment = result.get("pace_assessment", {})
        if not pace_assessment:
            pace_messages = {
                "ahead": "You're ahead of schedule! Great job maintaining momentum.",
                "behind": "You're slightly behind schedule. Consider allocating more time to catch up.",
                "on_track": "You're on track! Keep up the steady progress.",
                "unknown": "Continue with your study sessions to track your pace.",
            }
            pace_assessment = {
                "status": pace_status,
                "message": pace_messages.get(pace_status, pace_messages["unknown"]),
            }
        analysis["pace_assessment"] = pace_assessment

        # Extract recommendations
        recommendations = result.get("recommendations", [])
        if not recommendations:
            # Generate basic recommendations based on metrics
            recommendations = self._generate_basic_recommendations(metrics)
        analysis["recommendations"] = recommendations

        # Extract schedule adjustments
        schedule_adjustments = result.get("schedule_adjustments", [])
        analysis["schedule_adjustments"] = schedule_adjustments

        # Extract motivation
        analysis["motivation"] = result.get(
            "motivation",
            "Keep going! Every session brings you closer to your goals.",
        )

        # Extract any additional insights
        analysis["insights"] = result.get("insights", [])

        # Extract streak information if provided
        analysis["streak"] = result.get("streak", {
            "current": 0,
            "longest": 0,
            "message": "",
        })

        return analysis

    def _generate_basic_recommendations(
        self, metrics: dict[str, Any]
    ) -> list[str]:
        """
        Generate basic recommendations based on metrics.

        Args:
            metrics: Calculated progress metrics

        Returns:
            List of recommendation strings
        """
        recommendations = []

        pace_status = metrics.get("pace_status", "unknown")
        completion_pct = metrics.get("completion_percentage", 0)
        time_efficiency = metrics.get("time_efficiency", 100)
        avg_rating = metrics.get("average_rating")

        # Pace-based recommendations
        if pace_status == "behind":
            recommendations.append(
                "Consider adding extra study sessions to catch up on your schedule."
            )
            recommendations.append(
                "Review your daily availability - you may need to adjust your study hours."
            )
        elif pace_status == "ahead":
            recommendations.append(
                "Great progress! Consider using extra time for deeper exploration of challenging topics."
            )

        # Time efficiency recommendations
        if time_efficiency > 120:
            recommendations.append(
                "You're spending more time than scheduled. Consider breaking sessions into smaller chunks or taking more breaks."
            )
        elif time_efficiency < 80:
            recommendations.append(
                "You're completing sessions quickly. Ensure you're fully understanding the material before moving on."
            )

        # Rating-based recommendations
        if avg_rating is not None:
            if avg_rating < 3:
                recommendations.append(
                    "Your self-ratings indicate some topics may need more attention. Consider reviewing difficult concepts."
                )
            elif avg_rating >= 4:
                recommendations.append(
                    "Excellent self-ratings! You're mastering the material well."
                )

        # Topic-based recommendations
        topic_breakdown = metrics.get("topic_breakdown", {})
        for topic, data in topic_breakdown.items():
            completion_rate = data.get("completion_rate", 100)
            if completion_rate < 70:
                recommendations.append(
                    f"Topic '{topic}' has a lower completion rate. Consider dedicating focused time to this area."
                )

        # General recommendations if list is empty
        if not recommendations:
            recommendations = [
                "Continue with your regular study schedule.",
                "Review completed topics periodically to reinforce learning.",
                "Take notes on challenging concepts for later review.",
            ]

        return recommendations[:5]  # Limit to 5 recommendations

    def _generate_fallback_analysis(
        self, metrics: dict[str, Any]
    ) -> dict[str, Any]:
        """
        Generate basic analysis when LLM response parsing fails.

        Args:
            metrics: Calculated progress metrics

        Returns:
            Basic analysis dictionary
        """
        pace_status = metrics.get("pace_status", "unknown")

        pace_messages = {
            "ahead": "You're ahead of schedule! Great job maintaining momentum.",
            "behind": "You're slightly behind schedule. Consider allocating more time to catch up.",
            "on_track": "You're on track! Keep up the steady progress.",
            "unknown": "Continue with your study sessions to track your pace.",
        }

        return {
            "metrics": metrics,
            "performance_summary": f"You've completed {metrics['completed_sessions']} of {metrics['total_sessions']} sessions ({metrics['completion_percentage']:.1f}%).",
            "topic_analysis": {
                topic: {
                    "performance": "good"
                    if (data.get("average_rating") or 3) >= 3.5
                    else "needs_improvement",
                    "time_spent_minutes": data.get("total_minutes", 0),
                    "sessions_completed": data.get("completed_sessions", 0),
                }
                for topic, data in metrics.get("topic_breakdown", {}).items()
            },
            "pace_assessment": {
                "status": pace_status,
                "message": pace_messages.get(pace_status, pace_messages["unknown"]),
            },
            "recommendations": self._generate_basic_recommendations(metrics),
            "schedule_adjustments": [],
            "motivation": "Keep going! Every session brings you closer to your goals.",
            "insights": [],
            "streak": {"current": 0, "longest": 0, "message": ""},
        }

    def _get_default_system_prompt(self) -> str:
        """Get default system prompt when YAML prompts are not available."""
        return """You are an expert study coach and learning analyst. Your task is to analyze a student's progress through their study plan and provide actionable insights and recommendations.

Your analysis should be:
1. Encouraging and supportive, while being honest about areas for improvement
2. Data-driven, based on the metrics provided
3. Actionable, with specific recommendations
4. Personalized to the student's performance patterns

Consider:
1. Overall completion rate and pace
2. Time efficiency (actual vs scheduled time)
3. Self-ratings and comprehension scores
4. Topic-specific performance
5. Patterns in study behavior

Output your analysis as a JSON object with the following structure:
{
  "performance_summary": "Brief overall summary of progress",
  "topic_analysis": {
    "Topic Name": {
      "performance": "excellent|good|needs_improvement",
      "time_spent_minutes": 120,
      "sessions_completed": 3,
      "insights": ["Specific insight about this topic"]
    }
  },
  "pace_assessment": {
    "status": "ahead|on_track|behind",
    "message": "Detailed message about pace",
    "days_ahead_or_behind": 2
  },
  "recommendations": [
    "Specific actionable recommendation 1",
    "Specific actionable recommendation 2"
  ],
  "schedule_adjustments": [
    {
      "type": "add_session|remove_session|reschedule|extend_topic",
      "topic": "Topic name",
      "reason": "Why this adjustment is recommended",
      "details": "Specific details about the adjustment"
    }
  ],
  "motivation": "Personalized motivational message",
  "insights": [
    "Additional insight about learning patterns"
  ],
  "streak": {
    "current": 5,
    "longest": 7,
    "message": "You're on a 5-day streak!"
  }
}"""

    def _get_default_user_template(self) -> str:
        """Get default user template when YAML prompts are not available."""
        return """## Progress Analysis Request

### Current Date
{current_date}

{schedule_context}

{completed_sessions}

{pending_sessions}

{metrics}

{constraints}

---

Please analyze the student's progress and provide:
1. An overall performance summary
2. Topic-by-topic analysis
3. Pace assessment (ahead/behind/on-track)
4. Specific, actionable recommendations
5. Suggested schedule adjustments (if any)
6. A motivational message

Be encouraging but honest. Focus on actionable insights that will help the student succeed.

Output your analysis as a valid JSON object."""


__all__ = ["ProgressTrackerAgent"]
