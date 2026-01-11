"""
Study Plan Manager - Persists AI-generated study plans
All study plan data is stored in data/user/study_plans/ directory
"""

from __future__ import annotations

import json
from pathlib import Path
import time
import uuid


class StudyPlanManager:
    """Study plan manager (JSON file storage)."""

    def __init__(self, base_dir: str | None = None):
        if base_dir is None:
            # Current file: praDeep/src/api/utils/study_plan_manager.py
            # Project root should be three levels up: praDeep/
            project_root = Path(__file__).resolve().parents[3]
            base_dir_path = project_root / "data" / "user" / "study_plans"
        else:
            base_dir_path = Path(base_dir)

        self.base_dir = base_dir_path
        self.base_dir.mkdir(parents=True, exist_ok=True)

        self.index_file = self.base_dir / "plans_index.json"
        self._ensure_index()

    def _ensure_index(self) -> None:
        if not self.index_file.exists():
            with open(self.index_file, "w", encoding="utf-8") as f:
                json.dump({"plans": []}, f, indent=2, ensure_ascii=False)

    def _load_index(self) -> dict:
        try:
            with open(self.index_file, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {"plans": []}

    def _save_index(self, index: dict) -> None:
        with open(self.index_file, "w", encoding="utf-8") as f:
            json.dump(index, f, indent=2, ensure_ascii=False)

    def _get_plan_file(self, plan_id: str) -> Path:
        return self.base_dir / f"{plan_id}.json"

    def _load_plan(self, plan_id: str) -> dict | None:
        filepath = self._get_plan_file(plan_id)
        if not filepath.exists():
            return None
        try:
            with open(filepath, encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return None

    def _save_plan(self, plan: dict) -> None:
        filepath = self._get_plan_file(plan["id"])
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(plan, f, indent=2, ensure_ascii=False)

    def create_plan(self, name: str, goal: str, meta: dict, sessions: list[dict]) -> dict:
        plan_id = str(uuid.uuid4())[:8]
        now = time.time()

        plan = {
            "id": plan_id,
            "name": name,
            "goal": goal,
            "created_at": now,
            "updated_at": now,
            "meta": meta,
            "sessions": sessions,
        }

        self._save_plan(plan)

        index = self._load_index()
        index["plans"].append(
            {
                "id": plan_id,
                "name": name,
                "goal": goal,
                "created_at": now,
                "updated_at": now,
                "session_count": len(sessions),
            }
        )
        self._save_index(index)
        return plan

    def list_plans(self) -> list[dict]:
        index = self._load_index()
        plans: list[dict] = []
        for p in index.get("plans", []):
            plan = self._load_plan(p["id"])
            if plan:
                plans.append(
                    {
                        "id": plan["id"],
                        "name": plan.get("name", ""),
                        "goal": plan.get("goal", ""),
                        "created_at": plan.get("created_at"),
                        "updated_at": plan.get("updated_at"),
                        "session_count": len(plan.get("sessions", [])),
                    }
                )
        plans.sort(key=lambda x: x.get("updated_at") or 0, reverse=True)
        return plans

    def get_plan(self, plan_id: str) -> dict | None:
        return self._load_plan(plan_id)

    def update_plan(self, plan_id: str, plan: dict) -> dict | None:
        existing = self._load_plan(plan_id)
        if not existing:
            return None

        plan["id"] = plan_id
        plan["updated_at"] = time.time()
        self._save_plan(plan)

        # Update index (best-effort)
        index = self._load_index()
        updated = False
        for p in index.get("plans", []):
            if p.get("id") == plan_id:
                p["name"] = plan.get("name", p.get("name", ""))
                p["goal"] = plan.get("goal", p.get("goal", ""))
                p["updated_at"] = plan.get("updated_at", p.get("updated_at"))
                p["session_count"] = len(plan.get("sessions", []))
                updated = True
                break
        if updated:
            self._save_index(index)

        return plan


study_plan_manager = StudyPlanManager()

