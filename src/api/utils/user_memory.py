"""
UserMemoryManager - Persistent memory system for user preferences, topics, and learning patterns.

This module handles:
- Tracking user preferences across sessions
- Recording common topics and their frequency
- Identifying recurring questions and patterns
- Learning user interaction patterns over time
- Providing context for personalized agent responses
"""

import json
from collections import defaultdict
from pathlib import Path
import time
from typing import Any
import hashlib


DEFAULT_USER_ID = "default_user"


class UserMemoryManager:
    """
    Manages persistent user memory across all agent interactions.

    Memory is stored in JSON files at data/user/memory/:
    - user_preferences.json: Explicit user preferences
    - topic_memory.json: Topics discussed and their frequency
    - learning_patterns.json: User learning patterns and interaction history
    - recurring_questions.json: Common question patterns

    Note:
        This system is currently single-user. Public APIs accept a `user_id` parameter for future
        extensibility, but it is not used yet.
    """

    def __init__(self, base_dir: str | None = None):
        """
        Initialize UserMemoryManager.

        Args:
            base_dir: Base directory for memory storage.
                     Defaults to project_root/data/user/memory
        """
        if base_dir is None:
            # Current file: src/api/utils/user_memory.py
            # Project root: 4 levels up
            project_root = Path(__file__).resolve().parents[3]
            base_dir_path = project_root / "data" / "user" / "memory"
        else:
            base_dir_path = Path(base_dir)

        self.base_dir = base_dir_path
        self.base_dir.mkdir(parents=True, exist_ok=True)

        # Memory file paths
        self.preferences_file = self.base_dir / "user_preferences.json"
        self.topics_file = self.base_dir / "topic_memory.json"
        self.patterns_file = self.base_dir / "learning_patterns.json"
        self.questions_file = self.base_dir / "recurring_questions.json"

        self._ensure_files()

    def _ensure_files(self):
        """Ensure all memory files exist with correct format."""
        default_structures = {
            self.preferences_file: {
                "version": "1.0",
                "created_at": time.time(),
                "updated_at": time.time(),
                "preferences": {
                    "response_style": "balanced",  # concise, balanced, detailed
                    "difficulty_level": "adaptive",  # beginner, intermediate, advanced, adaptive
                    "preferred_explanation_format": "structured",  # narrative, structured, visual
                    "enable_examples": True,
                    "show_sources": True,
                    "custom": {},
                },
            },
            self.topics_file: {
                "version": "1.0",
                "created_at": time.time(),
                "updated_at": time.time(),
                "topics": {},  # topic_name -> {frequency, last_accessed, context, related_topics}
                "categories": {},  # category -> [topics]
            },
            self.patterns_file: {
                "version": "1.0",
                "created_at": time.time(),
                "updated_at": time.time(),
                "interaction_count": 0,
                "session_count": 0,
                "average_session_length": 0,
                "peak_usage_hours": [],
                "preferred_modules": {},  # module -> usage_count
                "learning_velocity": {},  # topic -> mastery_rate
                "strength_areas": [],
                "improvement_areas": [],
            },
            self.questions_file: {
                "version": "1.0",
                "created_at": time.time(),
                "updated_at": time.time(),
                "questions": [],  # List of {pattern, examples, frequency, last_asked}
                "resolved_questions": [],  # Questions that user has mastered
            },
        }

        for file_path, default_data in default_structures.items():
            if not file_path.exists():
                self._save_file(file_path, default_data)

    def _load_file(self, file_path: Path) -> dict[str, Any]:
        """Load data from a JSON file."""
        try:
            with open(file_path, encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}

    def _save_file(self, file_path: Path, data: dict[str, Any]):
        """Save data to a JSON file."""
        data["updated_at"] = time.time()
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    # ==================== Preferences Management ====================

    def get_preferences(self, user_id: str = DEFAULT_USER_ID) -> dict[str, Any]:
        """Get all user preferences."""
        data = self._load_file(self.preferences_file)
        return data.get("preferences", {})

    def update_preference(
        self, key: str, value: Any, user_id: str = DEFAULT_USER_ID
    ) -> dict[str, Any]:
        """
        Update a single preference.

        Args:
            key: Preference key (e.g., 'response_style', 'difficulty_level')
            value: New value

        Returns:
            Updated preferences dict
        """
        data = self._load_file(self.preferences_file)
        if "preferences" not in data:
            data["preferences"] = {}

        # Handle nested custom preferences
        if key.startswith("custom."):
            custom_key = key[7:]  # Remove 'custom.' prefix
            if "custom" not in data["preferences"]:
                data["preferences"]["custom"] = {}
            data["preferences"]["custom"][custom_key] = value
        else:
            data["preferences"][key] = value

        self._save_file(self.preferences_file, data)
        return data["preferences"]

    def set_preferences(
        self, preferences: dict[str, Any], user_id: str = DEFAULT_USER_ID
    ) -> dict[str, Any]:
        """
        Set multiple preferences at once.

        Args:
            preferences: Dict of preferences to set

        Returns:
            Updated preferences dict
        """
        data = self._load_file(self.preferences_file)
        if "preferences" not in data:
            data["preferences"] = {}

        data["preferences"].update(preferences)
        self._save_file(self.preferences_file, data)
        return data["preferences"]

    # ==================== Topic Memory ====================

    def record_topic(
        self,
        topic: str,
        category: str | None = None,
        context: str | None = None,
        related_topics: list[str] | None = None,
        user_id: str = DEFAULT_USER_ID,
    ) -> dict[str, Any]:
        """
        Record interaction with a topic.

        Args:
            topic: The topic discussed
            category: Optional category (e.g., 'biology', 'chemistry')
            context: Optional context about the interaction
            related_topics: Optional list of related topics

        Returns:
            Updated topic data
        """
        data = self._load_file(self.topics_file)
        topic_lower = topic.lower().strip()

        if topic_lower not in data.get("topics", {}):
            data["topics"][topic_lower] = {
                "frequency": 0,
                "first_accessed": time.time(),
                "last_accessed": time.time(),
                "contexts": [],
                "related_topics": [],
                "category": category,
            }

        topic_data = data["topics"][topic_lower]
        topic_data["frequency"] += 1
        topic_data["last_accessed"] = time.time()

        if context and context not in topic_data["contexts"]:
            topic_data["contexts"].append(context)
            # Keep only last 10 contexts
            topic_data["contexts"] = topic_data["contexts"][-10:]

        if related_topics:
            existing_related = set(topic_data["related_topics"])
            existing_related.update(related_topics)
            topic_data["related_topics"] = list(existing_related)[:20]

        if category:
            topic_data["category"] = category
            # Update category index
            if "categories" not in data:
                data["categories"] = {}
            if category not in data["categories"]:
                data["categories"][category] = []
            if topic_lower not in data["categories"][category]:
                data["categories"][category].append(topic_lower)

        self._save_file(self.topics_file, data)
        return topic_data

    def get_topics(
        self,
        limit: int = 20,
        category: str | None = None,
        sort_by: str = "frequency",
        user_id: str = DEFAULT_USER_ID,
    ) -> list[dict[str, Any]]:
        """
        Get recorded topics.

        Args:
            limit: Maximum topics to return
            category: Filter by category
            sort_by: Sort field ('frequency', 'last_accessed', 'first_accessed')

        Returns:
            List of topic dicts with name included
        """
        data = self._load_file(self.topics_file)
        topics = data.get("topics", {})

        # Convert to list with topic names
        topic_list = [{"name": name, **info} for name, info in topics.items()]

        # Filter by category if specified
        if category:
            topic_list = [t for t in topic_list if t.get("category") == category]

        # Sort
        if sort_by == "frequency":
            topic_list.sort(key=lambda x: x.get("frequency", 0), reverse=True)
        elif sort_by == "last_accessed":
            topic_list.sort(key=lambda x: x.get("last_accessed", 0), reverse=True)
        elif sort_by == "first_accessed":
            topic_list.sort(key=lambda x: x.get("first_accessed", 0))

        return topic_list[:limit]

    def get_topic_categories(self, user_id: str = DEFAULT_USER_ID) -> dict[str, list[str]]:
        """Get all topic categories."""
        data = self._load_file(self.topics_file)
        return data.get("categories", {})

    # ==================== Learning Patterns ====================

    def record_interaction(
        self,
        module: str,
        duration_seconds: float | None = None,
        topic: str | None = None,
        success: bool = True,
        user_id: str = DEFAULT_USER_ID,
    ):
        """
        Record a user interaction to learn patterns.

        Args:
            module: The module used (solve, question, chat, etc.)
            duration_seconds: Optional duration of interaction
            topic: Optional topic of interaction
            success: Whether the interaction was successful
        """
        data = self._load_file(self.patterns_file)

        # Update interaction count
        data["interaction_count"] = data.get("interaction_count", 0) + 1

        # Update module usage
        if "preferred_modules" not in data:
            data["preferred_modules"] = {}
        data["preferred_modules"][module] = data["preferred_modules"].get(module, 0) + 1

        # Track session duration statistics when provided
        if duration_seconds is not None:
            try:
                duration_value = float(duration_seconds)
            except (TypeError, ValueError):
                duration_value = None

            if duration_value is not None and duration_value >= 0:
                previous_count = data.get("session_count", 0) or 0
                previous_avg = data.get("average_session_length", 0) or 0

                new_count = previous_count + 1
                data["session_count"] = new_count
                data["average_session_length"] = (
                    (previous_avg * previous_count + duration_value) / new_count
                    if new_count > 0
                    else duration_value
                )

        # Track usage hour
        current_hour = time.localtime().tm_hour
        if "hourly_usage" not in data:
            data["hourly_usage"] = defaultdict(int)
        data["hourly_usage"][str(current_hour)] = data["hourly_usage"].get(str(current_hour), 0) + 1

        # Update peak usage hours
        hourly = data.get("hourly_usage", {})
        if hourly:
            sorted_hours = sorted(hourly.items(), key=lambda x: x[1], reverse=True)
            data["peak_usage_hours"] = [int(h) for h, _ in sorted_hours[:3]]

        # Update learning velocity for topic
        if topic:
            if "learning_velocity" not in data:
                data["learning_velocity"] = {}
            topic_lower = topic.lower()
            if topic_lower not in data["learning_velocity"]:
                data["learning_velocity"][topic_lower] = {
                    "attempts": 0,
                    "successes": 0,
                    "mastery_score": 0.0,
                }
            vel = data["learning_velocity"][topic_lower]
            vel["attempts"] += 1
            if success:
                vel["successes"] += 1
            vel["mastery_score"] = vel["successes"] / vel["attempts"] if vel["attempts"] > 0 else 0

        self._save_file(self.patterns_file, data)

    def get_learning_patterns(self, user_id: str = DEFAULT_USER_ID) -> dict[str, Any]:
        """Get user learning patterns."""
        return self._load_file(self.patterns_file)

    def update_learning_patterns(
        self,
        updates: dict[str, Any],
        user_id: str = DEFAULT_USER_ID,
    ) -> dict[str, Any]:
        """
        Update learning patterns and persist to disk.

        Args:
            updates: Dict of pattern keys to update

        Returns:
            Updated learning patterns dict
        """
        data = self._load_file(self.patterns_file)
        data.update(updates)
        self._save_file(self.patterns_file, data)
        return data

    def get_preferred_modules(self, user_id: str = DEFAULT_USER_ID) -> list[tuple[str, int]]:
        """Get modules sorted by usage frequency."""
        data = self._load_file(self.patterns_file)
        modules = data.get("preferred_modules", {})
        return sorted(modules.items(), key=lambda x: x[1], reverse=True)

    # ==================== Recurring Questions ====================

    def record_question(
        self, question: str, answer: str | None = None, user_id: str = DEFAULT_USER_ID
    ):
        """
        Record a question to identify recurring patterns.

        Args:
            question: The question asked
            answer: Optional answer provided
        """
        data = self._load_file(self.questions_file)

        # Generate a simple hash for pattern matching
        question_normalized = question.lower().strip()
        try:
            question_hash = hashlib.md5(
                question_normalized.encode(), usedforsecurity=False
            ).hexdigest()[:8]
        except TypeError:
            # usedforsecurity is not supported on some platforms/builds
            question_hash = hashlib.md5(question_normalized.encode()).hexdigest()[:8]

        # Check if similar question exists
        existing_idx = None
        for idx, q in enumerate(data.get("questions", [])):
            if q.get("hash") == question_hash:
                existing_idx = idx
                break
            # Simple similarity check - if 80% of words match
            existing_words = set(q.get("normalized", "").split())
            new_words = set(question_normalized.split())
            if existing_words and new_words:
                overlap = len(existing_words & new_words) / max(len(existing_words), len(new_words))
                if overlap > 0.8:
                    existing_idx = idx
                    break

        if existing_idx is not None:
            # Update existing question
            q = data["questions"][existing_idx]
            q["frequency"] += 1
            q["last_asked"] = time.time()
            if question not in q.get("examples", []):
                q["examples"].append(question)
                q["examples"] = q["examples"][-5:]  # Keep last 5 examples
            if answer and answer not in q.get("answers", []):
                q["answers"] = q.get("answers", [])
                q["answers"].append(answer)
                q["answers"] = q["answers"][-3:]  # Keep last 3 answers
        else:
            # Add new question
            if "questions" not in data:
                data["questions"] = []
            data["questions"].append(
                {
                    "hash": question_hash,
                    "normalized": question_normalized,
                    "examples": [question],
                    "answers": [answer] if answer else [],
                    "frequency": 1,
                    "first_asked": time.time(),
                    "last_asked": time.time(),
                }
            )

        # Sort by frequency
        data["questions"].sort(key=lambda x: x.get("frequency", 0), reverse=True)

        # Limit to 100 questions
        data["questions"] = data["questions"][:100]

        self._save_file(self.questions_file, data)

    def get_recurring_questions(
        self, min_frequency: int = 2, limit: int = 20, user_id: str = DEFAULT_USER_ID
    ) -> list[dict[str, Any]]:
        """
        Get recurring questions (asked multiple times).

        Args:
            min_frequency: Minimum times asked
            limit: Maximum questions to return

        Returns:
            List of recurring question patterns
        """
        data = self._load_file(self.questions_file)
        questions = data.get("questions", [])

        recurring = [q for q in questions if q.get("frequency", 0) >= min_frequency]
        return recurring[:limit]

    def mark_question_resolved(self, question_hash: str, user_id: str = DEFAULT_USER_ID):
        """Mark a recurring question as resolved/mastered."""
        data = self._load_file(self.questions_file)

        for idx, q in enumerate(data.get("questions", [])):
            if q.get("hash") == question_hash:
                resolved_q = data["questions"].pop(idx)
                resolved_q["resolved_at"] = time.time()
                if "resolved_questions" not in data:
                    data["resolved_questions"] = []
                data["resolved_questions"].append(resolved_q)
                data["resolved_questions"] = data["resolved_questions"][-50:]
                self._save_file(self.questions_file, data)
                return True

        return False

    # ==================== Memory Summary for Agents ====================

    def get_memory_context(self, user_id: str = DEFAULT_USER_ID) -> dict[str, Any]:
        """
        Get a summarized memory context for agent use.

        Returns a compact summary that agents can use to personalize responses.
        """
        preferences = self.get_preferences()
        topics = self.get_topics(limit=10, sort_by="frequency")
        patterns = self.get_learning_patterns()
        recurring = self.get_recurring_questions(min_frequency=2, limit=5)

        return {
            "preferences": preferences,
            "top_topics": [{"name": t["name"], "frequency": t["frequency"]} for t in topics],
            "preferred_modules": patterns.get("preferred_modules", {}),
            "interaction_count": patterns.get("interaction_count", 0),
            "peak_hours": patterns.get("peak_usage_hours", []),
            "recurring_questions": [
                {"pattern": q["normalized"][:100], "frequency": q["frequency"]} for q in recurring
            ],
            "strength_areas": patterns.get("strength_areas", []),
            "improvement_areas": patterns.get("improvement_areas", []),
        }

    # ==================== Memory Management ====================

    def clear_memory(self, memory_type: str | None = None, user_id: str = DEFAULT_USER_ID) -> bool:
        """
        Clear memory data.

        Args:
            memory_type: Type to clear ('preferences', 'topics', 'patterns', 'questions')
                        If None, clears all memory.

        Returns:
            True if successful
        """
        if memory_type is None:
            # Clear all memory files
            self._ensure_files()  # Reset to defaults
            return True

        file_map = {
            "preferences": self.preferences_file,
            "topics": self.topics_file,
            "patterns": self.patterns_file,
            "questions": self.questions_file,
        }

        if memory_type in file_map:
            if file_map[memory_type].exists():
                file_map[memory_type].unlink()
            self._ensure_files()
            return True

        return False

    def export_memory(self, user_id: str = DEFAULT_USER_ID) -> dict[str, Any]:
        """Export all memory data for backup."""
        return {
            "exported_at": time.time(),
            "preferences": self._load_file(self.preferences_file),
            "topics": self._load_file(self.topics_file),
            "patterns": self._load_file(self.patterns_file),
            "questions": self._load_file(self.questions_file),
        }

    def import_memory(self, data: dict[str, Any], user_id: str = DEFAULT_USER_ID) -> bool:
        """
        Import memory data from backup.

        Args:
            data: Exported memory data

        Returns:
            True if successful
        """
        try:
            if "preferences" in data:
                self._save_file(self.preferences_file, data["preferences"])
            if "topics" in data:
                self._save_file(self.topics_file, data["topics"])
            if "patterns" in data:
                self._save_file(self.patterns_file, data["patterns"])
            if "questions" in data:
                self._save_file(self.questions_file, data["questions"])
            return True
        except Exception:
            return False


# Singleton instance
_user_memory_manager: UserMemoryManager | None = None


def get_user_memory_manager() -> UserMemoryManager:
    """Get or create the global UserMemoryManager instance."""
    global _user_memory_manager
    if _user_memory_manager is None:
        _user_memory_manager = UserMemoryManager()
    return _user_memory_manager


__all__ = ["UserMemoryManager", "get_user_memory_manager"]
