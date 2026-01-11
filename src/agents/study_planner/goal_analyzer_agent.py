#!/usr/bin/env python
"""
GoalAnalyzerAgent - Parses user goals and constraints for study planning.

This agent analyzes user-provided study goals (topics to learn, learning objectives)
and constraints (available time, deadlines, preferred study hours) to produce
a structured analysis that informs schedule generation.
"""

import json
from pathlib import Path
import sys
from typing import Any

# Add project root to path
_project_root = Path(__file__).parent.parent.parent.parent
if str(_project_root) not in sys.path:
    sys.path.insert(0, str(_project_root))

from src.agents.base_agent import BaseAgent
from src.di import Container


class GoalAnalyzerAgent(BaseAgent):
    """
    Goal Analyzer Agent - Parses user goals and constraints for study planning.

    This agent takes raw user input about their study goals and constraints,
    and produces a structured analysis including:
    - Validated and prioritized learning topics
    - Time availability assessment
    - Difficulty estimations
    - Prerequisite relationships between topics
    - Feasibility assessment of the study plan
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
        Initialize the GoalAnalyzerAgent.

        Args:
            language: Language setting ('zh' | 'en'), default 'en'
            api_key: Optional API key (defaults to environment variable)
            base_url: Optional API endpoint (defaults to environment variable)
            model: Optional model name (defaults to environment variable)
        """
        super().__init__(
            module_name="study_planner",
            agent_name="goal_analyzer",
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
            agent_name="goal_analyzer",
            language=language,
        )

    def _format_notebooks_context(self, notebooks: list[dict[str, Any]]) -> str:
        """
        Format notebook information as context for the LLM.

        Args:
            notebooks: List of notebook metadata dictionaries containing:
                - id: Notebook ID
                - name: Notebook name
                - description: Optional description
                - record_count: Number of records
                - topics: Optional list of topics covered

        Returns:
            Formatted string describing the notebooks
        """
        if not notebooks:
            return "No notebooks selected."

        formatted_parts = []
        for i, notebook in enumerate(notebooks, 1):
            nb_id = notebook.get("id", "unknown")
            nb_name = notebook.get("name", "Untitled")
            nb_desc = notebook.get("description", "")
            record_count = notebook.get("record_count", 0)
            topics = notebook.get("topics", [])

            part = f"""
### Notebook {i}
- **ID**: {nb_id}
- **Name**: {nb_name}
- **Description**: {nb_desc if nb_desc else 'No description'}
- **Records**: {record_count}
- **Topics**: {', '.join(topics) if topics else 'Not specified'}"""
            formatted_parts.append(part)

        return "\n".join(formatted_parts)

    def _format_constraints(self, constraints: dict[str, Any]) -> str:
        """
        Format user constraints as readable text.

        Args:
            constraints: Dictionary containing:
                - total_hours: Total available study hours
                - daily_hours: Preferred daily study hours
                - deadline: Optional deadline date (ISO format)
                - preferred_times: Optional list of preferred time slots
                - excluded_days: Optional list of days to exclude
                - session_duration: Preferred session duration in minutes

        Returns:
            Formatted string describing the constraints
        """
        parts = []

        if "total_hours" in constraints:
            parts.append(f"- Total available hours: {constraints['total_hours']} hours")

        if "daily_hours" in constraints:
            parts.append(f"- Preferred daily study time: {constraints['daily_hours']} hours")

        if "deadline" in constraints:
            parts.append(f"- Target deadline: {constraints['deadline']}")

        if "preferred_times" in constraints:
            times = constraints["preferred_times"]
            if times:
                parts.append(f"- Preferred time slots: {', '.join(times)}")

        if "excluded_days" in constraints:
            days = constraints["excluded_days"]
            if days:
                parts.append(f"- Days to exclude: {', '.join(days)}")

        if "session_duration" in constraints:
            parts.append(f"- Preferred session duration: {constraints['session_duration']} minutes")

        if not parts:
            return "No specific constraints provided."

        return "\n".join(parts)

    async def process(
        self,
        goals: dict[str, Any],
        constraints: dict[str, Any],
        notebooks: list[dict[str, Any]] | None = None,
    ) -> dict[str, Any]:
        """
        Analyze user goals and constraints to produce a structured study plan analysis.

        Args:
            goals: Dictionary containing:
                - topics: List of topics/subjects to study
                - objectives: Learning objectives or outcomes
                - priority_order: Optional priority ordering of topics
                - proficiency_targets: Optional target proficiency levels

            constraints: Dictionary containing:
                - total_hours: Total available study hours
                - daily_hours: Preferred daily study hours
                - deadline: Optional deadline date
                - preferred_times: Optional preferred time slots
                - excluded_days: Optional days to exclude
                - session_duration: Preferred session duration

            notebooks: Optional list of notebook metadata for context

        Returns:
            Dictionary containing:
                - success: Whether analysis was successful
                - analysis: Structured analysis result including:
                    - validated_topics: List of validated topics with metadata
                    - time_assessment: Assessment of time availability
                    - topic_relationships: Prerequisite/dependency relationships
                    - difficulty_estimates: Estimated difficulty for each topic
                    - feasibility: Overall feasibility assessment
                    - recommendations: Suggestions for schedule optimization
                - error: Error message if analysis failed
        """
        # Validate required inputs
        if not goals:
            return {
                "success": False,
                "error": "No goals provided. Please specify topics or objectives to study.",
                "analysis": None,
            }

        topics = goals.get("topics", [])
        objectives = goals.get("objectives", "")

        if not topics and not objectives:
            return {
                "success": False,
                "error": "Please provide at least one topic or learning objective.",
                "analysis": None,
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
        notebooks_context = self._format_notebooks_context(notebooks or [])
        constraints_text = self._format_constraints(constraints or {})

        # Build topics text
        topics_text = ""
        if topics:
            topics_text = "\n".join(f"- {topic}" for topic in topics)

        # Build objectives text
        objectives_text = objectives if objectives else "No specific objectives provided."

        # Format the user prompt
        user_prompt = user_template.format(
            topics=topics_text if topics_text else "No specific topics listed.",
            objectives=objectives_text,
            constraints=constraints_text,
            notebooks_context=notebooks_context,
            priority_order=goals.get("priority_order", "Not specified"),
            proficiency_targets=goals.get("proficiency_targets", "Not specified"),
        )

        try:
            self.logger.info(f"Analyzing goals with {len(topics)} topics...")

            response = await self.call_llm(
                user_prompt=user_prompt,
                system_prompt=system_prompt,
                response_format={"type": "json_object"},
            )

            self.logger.debug(f"LLM response length: {len(response)} chars")

            # Parse the response
            try:
                result = json.loads(response)

                # Validate and normalize the response structure
                analysis = self._validate_analysis_response(result, topics)

                self.logger.info(
                    f"Analysis complete: {len(analysis.get('validated_topics', []))} topics validated"
                )

                return {
                    "success": True,
                    "analysis": analysis,
                    "error": None,
                }

            except json.JSONDecodeError as e:
                self.logger.error(f"JSON decode error: {e}")
                self.logger.debug(f"Raw response: {response[:500]}...")
                return {
                    "success": False,
                    "error": f"Failed to parse analysis response: {e}",
                    "analysis": None,
                    "raw_response": response,
                }

        except Exception as e:
            self.logger.error(f"Goal analysis failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "analysis": None,
            }

    def _validate_analysis_response(
        self, result: dict[str, Any], original_topics: list[str]
    ) -> dict[str, Any]:
        """
        Validate and normalize the LLM analysis response.

        Args:
            result: Raw parsed JSON from LLM
            original_topics: Original list of topics from user input

        Returns:
            Normalized analysis dictionary
        """
        analysis = {}

        # Extract validated topics
        validated_topics = result.get("validated_topics", [])
        if not validated_topics and original_topics:
            # Fallback: create basic topic entries from original input
            validated_topics = [
                {
                    "topic": topic,
                    "priority": i + 1,
                    "estimated_hours": 2,  # Default estimate
                    "difficulty": "medium",
                }
                for i, topic in enumerate(original_topics)
            ]
        analysis["validated_topics"] = validated_topics

        # Extract time assessment
        analysis["time_assessment"] = result.get("time_assessment", {
            "total_required_hours": sum(
                t.get("estimated_hours", 2) for t in validated_topics
            ),
            "is_realistic": True,
            "adjustment_suggestions": [],
        })

        # Extract topic relationships
        analysis["topic_relationships"] = result.get("topic_relationships", [])

        # Extract difficulty estimates
        difficulty_estimates = result.get("difficulty_estimates", {})
        if not difficulty_estimates and validated_topics:
            difficulty_estimates = {
                t.get("topic", f"topic_{i}"): t.get("difficulty", "medium")
                for i, t in enumerate(validated_topics)
            }
        analysis["difficulty_estimates"] = difficulty_estimates

        # Extract feasibility assessment
        analysis["feasibility"] = result.get("feasibility", {
            "is_feasible": True,
            "confidence": 0.7,
            "concerns": [],
        })

        # Extract recommendations
        analysis["recommendations"] = result.get("recommendations", [])

        return analysis

    def _get_default_system_prompt(self) -> str:
        """Get default system prompt when YAML prompts are not available."""
        return """You are an expert study planner and learning coach. Your task is to analyze user study goals and constraints to produce a structured assessment that will inform schedule generation.

Your analysis should be thorough, realistic, and actionable. Consider:
1. The complexity and depth of each topic
2. Prerequisites and dependencies between topics
3. Time requirements based on typical learning curves
4. User's available time and constraints
5. Optimal learning sequences

Output your analysis as a JSON object with the following structure:
{
  "validated_topics": [
    {
      "topic": "Topic name",
      "priority": 1,
      "estimated_hours": 10,
      "difficulty": "easy|medium|hard",
      "prerequisites": [],
      "learning_objectives": []
    }
  ],
  "time_assessment": {
    "total_required_hours": 40,
    "is_realistic": true,
    "adjustment_suggestions": []
  },
  "topic_relationships": [
    {
      "from_topic": "Topic A",
      "to_topic": "Topic B",
      "relationship": "prerequisite|recommended_before|related"
    }
  ],
  "difficulty_estimates": {
    "Topic A": "medium"
  },
  "feasibility": {
    "is_feasible": true,
    "confidence": 0.85,
    "concerns": []
  },
  "recommendations": [
    "Start with foundational topics",
    "Consider extending the deadline"
  ]
}"""

    def _get_default_user_template(self) -> str:
        """Get default user template when YAML prompts are not available."""
        return """## Study Goals Analysis Request

### Topics to Study
{topics}

### Learning Objectives
{objectives}

### User Constraints
{constraints}

### Priority Order
{priority_order}

### Target Proficiency Levels
{proficiency_targets}

### Available Learning Materials (Notebooks)
{notebooks_context}

---

Please analyze these study goals and constraints. Provide:
1. Validated and prioritized list of topics with estimated study hours
2. Assessment of time requirements vs. available time
3. Prerequisite relationships between topics
4. Difficulty estimates for each topic
5. Overall feasibility assessment
6. Recommendations for optimizing the study plan

Output your analysis as a valid JSON object."""


__all__ = ["GoalAnalyzerAgent"]
