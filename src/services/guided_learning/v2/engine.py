"""
Mastery Engine - Pure domain logic for guided learning v2.
No I/O, no LLM calls. All external interactions go through adapters.
"""

from __future__ import annotations

from datetime import datetime

from .types import (
    Activity,
    Confidence,
    FailureMode,
    LearnerModel,
    MasteryState,
    NodeStatus,
    ObjectiveMastery,
    PlanGraph,
    ResponseEvaluation,
    Stage,
)


class MasteryEngine:
    def evaluate_response(
        self,
        activity: Activity,
        response: dict,
    ) -> ResponseEvaluation:
        raise NotImplementedError("Adapter layer must implement response evaluation")

    def get_next_activity(
        self,
        learner_model: LearnerModel,
        plan_graph: PlanGraph,
    ) -> Activity | None:
        available_objectives = self._get_available_objectives(learner_model, plan_graph)
        if not available_objectives:
            return None

        objective_id = self._select_next_objective(available_objectives, learner_model, plan_graph)
        if not objective_id:
            return None

        stage = self._determine_stage(objective_id, learner_model)
        raise NotImplementedError("Block generation requires adapter layer")

    def update_mastery(
        self,
        learner_model: LearnerModel,
        evaluation: ResponseEvaluation,
        activity: Activity,
    ) -> LearnerModel:
        mastery = learner_model.get_mastery(activity.objective_id)

        mastery.last_practiced = datetime.now()
        mastery.practice_count += 1

        if evaluation.is_correct:
            mastery.correct_streak += 1
            mastery.mastery_state = self._compute_new_mastery_state(
                mastery, evaluation, is_correct=True
            )
        else:
            mastery.correct_streak = 0
            if evaluation.failure_mode:
                mastery.failure_modes.append(evaluation.failure_mode)
                if activity.objective_id not in learner_model.failure_patterns:
                    learner_model.failure_patterns[activity.objective_id] = []
                learner_model.failure_patterns[activity.objective_id].append(
                    evaluation.failure_mode
                )
            mastery.mastery_state = self._compute_new_mastery_state(
                mastery, evaluation, is_correct=False
            )

        mastery.confidence = evaluation.confidence
        learner_model.streaks[activity.objective_id] = mastery.correct_streak

        return learner_model

    def _get_available_objectives(
        self,
        learner_model: LearnerModel,
        plan_graph: PlanGraph,
    ) -> list[str]:
        available = []
        for node in plan_graph.nodes:
            if node.status in (NodeStatus.COMPLETED, NodeStatus.SKIPPED):
                continue

            prerequisites = plan_graph.get_prerequisites(node.objective_id)
            all_prereqs_met = all(
                self._is_objective_mastered(prereq_id, learner_model, plan_graph)
                for prereq_id in prerequisites
            )

            if all_prereqs_met:
                available.append(node.objective_id)

        return available

    def _is_objective_mastered(
        self,
        objective_id: str,
        learner_model: LearnerModel,
        plan_graph: PlanGraph,
    ) -> bool:
        node = plan_graph.get_node(objective_id)
        if node and node.status in (NodeStatus.COMPLETED, NodeStatus.SKIPPED):
            return True

        mastery = learner_model.objectives.get(objective_id)
        if mastery and mastery.mastery_state in (
            MasteryState.COMPETENT,
            MasteryState.AUTOMATIC,
        ):
            return True

        return False

    def _select_next_objective(
        self,
        available_objectives: list[str],
        learner_model: LearnerModel,
        plan_graph: PlanGraph,
    ) -> str | None:
        if not available_objectives:
            return None

        scored = []
        for obj_id in available_objectives:
            mastery = learner_model.objectives.get(obj_id)
            if mastery is None:
                score = 100
            elif mastery.mastery_state == MasteryState.NOVICE:
                score = 90
            elif mastery.mastery_state == MasteryState.SHAKY:
                score = 80
            elif mastery.mastery_state == MasteryState.COMPETENT:
                score = 20
            else:
                score = 10

            scored.append((obj_id, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        return scored[0][0]

    def _determine_stage(
        self,
        objective_id: str,
        learner_model: LearnerModel,
    ) -> Stage:
        mastery = learner_model.objectives.get(objective_id)

        if mastery is None or mastery.practice_count == 0:
            return Stage.PRIME

        if mastery.mastery_state == MasteryState.NOVICE:
            return Stage.TEACH

        if mastery.mastery_state == MasteryState.SHAKY:
            return Stage.PRACTICE

        return Stage.ASSESS

    def _compute_new_mastery_state(
        self,
        mastery: ObjectiveMastery,
        evaluation: ResponseEvaluation,
        is_correct: bool,
    ) -> MasteryState:
        current = mastery.mastery_state

        if is_correct:
            if current == MasteryState.NOVICE and mastery.correct_streak >= 1:
                return MasteryState.SHAKY
            if current == MasteryState.SHAKY and mastery.correct_streak >= 2:
                return MasteryState.COMPETENT
            if (
                current == MasteryState.COMPETENT
                and mastery.correct_streak >= 3
                and evaluation.confidence == Confidence.HIGH
            ):
                return MasteryState.AUTOMATIC
            return current

        if current == MasteryState.AUTOMATIC:
            return MasteryState.COMPETENT
        if current == MasteryState.COMPETENT:
            return MasteryState.SHAKY
        return current

    def should_branch_for_remediation(
        self,
        learner_model: LearnerModel,
        objective_id: str,
    ) -> FailureMode | None:
        failure_modes = learner_model.failure_patterns.get(objective_id, [])
        if len(failure_modes) < 2:
            return None

        recent = failure_modes[-3:]
        mode_counts: dict[FailureMode, int] = {}
        for mode in recent:
            mode_counts[mode] = mode_counts.get(mode, 0) + 1

        for mode, count in mode_counts.items():
            if count >= 2:
                return mode

        return None


__all__ = ["MasteryEngine"]
