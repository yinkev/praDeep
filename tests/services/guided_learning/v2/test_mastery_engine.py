import pytest
from datetime import datetime

from src.services.guided_learning.v2.engine import MasteryEngine
from src.services.guided_learning.v2.types import (
    Activity,
    Citation,
    Confidence,
    FailureMode,
    LearnerModel,
    MasteryState,
    MCQBlock,
    ObjectiveMastery,
    ResponseEvaluation,
    Stage,
    VariantType,
)


@pytest.fixture
def engine():
    return MasteryEngine()


@pytest.fixture
def learner_model():
    return LearnerModel(user_id="test_user")


@pytest.fixture
def sample_mcq_block():
    return MCQBlock(
        stem="What is the primary function of hemoglobin?",
        options=[
            "Transport oxygen",
            "Fight infection",
            "Clot blood",
            "Digest food",
        ],
        correct_index=0,
        distractors_rationale=[
            "Correct - hemoglobin binds oxygen in red blood cells",
            "White blood cells fight infection",
            "Platelets and clotting factors clot blood",
            "Digestive enzymes digest food",
        ],
        citations=[
            Citation(
                source_id="textbook_1",
                chunk_id="ch5_p42",
                text_snippet="Hemoglobin is the oxygen-carrying protein in red blood cells.",
            )
        ],
    )


@pytest.fixture
def sample_activity(sample_mcq_block):
    return Activity(
        objective_id="obj_123",
        stage=Stage.PRACTICE,
        block=sample_mcq_block,
        hints_used=0,
        attempt_count=1,
    )


class TestMasteryStateTransitions:
    def test_novice_to_shaky_on_correct(self, engine, learner_model, sample_activity):
        evaluation = ResponseEvaluation(
            is_correct=True,
            confidence=Confidence.MED,
            explanation="Correct!",
            citations=[],
        )

        updated_model = engine.update_mastery(learner_model, sample_activity, evaluation)
        mastery = updated_model.get_mastery(sample_activity.objective_id)

        assert mastery.mastery_state == MasteryState.SHAKY
        assert mastery.correct_streak == 1

    def test_shaky_to_competent_requires_streak_and_confidence(
        self, engine, learner_model, sample_activity
    ):
        learner_model.objectives[sample_activity.objective_id] = ObjectiveMastery(
            mastery_state=MasteryState.SHAKY,
            correct_streak=1,
        )
        sample_activity.variant_type = VariantType.NEAR

        evaluation = ResponseEvaluation(
            is_correct=True,
            confidence=Confidence.MED,
            explanation="Correct!",
            citations=[],
        )

        updated_model = engine.update_mastery(learner_model, sample_activity, evaluation)
        mastery = updated_model.get_mastery(sample_activity.objective_id)

        assert mastery.mastery_state == MasteryState.COMPETENT
        assert mastery.correct_streak == 2

    def test_low_confidence_correct_stays_shaky(self, engine, learner_model, sample_activity):
        learner_model.objectives[sample_activity.objective_id] = ObjectiveMastery(
            mastery_state=MasteryState.SHAKY,
            correct_streak=2,
        )

        evaluation = ResponseEvaluation(
            is_correct=True,
            confidence=Confidence.LOW,
            explanation="Correct but uncertain",
            citations=[],
        )

        updated_model = engine.update_mastery(learner_model, sample_activity, evaluation)
        mastery = updated_model.get_mastery(sample_activity.objective_id)

        assert mastery.mastery_state == MasteryState.SHAKY

    def test_competent_to_automatic_requires_far_variant(
        self, engine, learner_model, sample_activity
    ):
        learner_model.objectives[sample_activity.objective_id] = ObjectiveMastery(
            mastery_state=MasteryState.COMPETENT,
            correct_streak=2,
        )
        sample_activity.variant_type = VariantType.FAR

        evaluation = ResponseEvaluation(
            is_correct=True,
            confidence=Confidence.HIGH,
            explanation="Excellent!",
            citations=[],
        )

        updated_model = engine.update_mastery(learner_model, sample_activity, evaluation)
        mastery = updated_model.get_mastery(sample_activity.objective_id)

        assert mastery.mastery_state == MasteryState.AUTOMATIC

    def test_incorrect_resets_streak(self, engine, learner_model, sample_activity):
        learner_model.objectives[sample_activity.objective_id] = ObjectiveMastery(
            mastery_state=MasteryState.SHAKY,
            correct_streak=3,
        )

        evaluation = ResponseEvaluation(
            is_correct=False,
            confidence=Confidence.MED,
            explanation="Incorrect",
            citations=[],
            failure_mode=FailureMode.KNOWLEDGE_GAP,
        )

        updated_model = engine.update_mastery(learner_model, sample_activity, evaluation)
        mastery = updated_model.get_mastery(sample_activity.objective_id)

        assert mastery.correct_streak == 0
        assert FailureMode.KNOWLEDGE_GAP in mastery.failure_modes


class TestRemediationBranching:
    def test_branches_on_repeated_failure_mode(self, engine, learner_model, sample_activity):
        learner_model.failure_patterns[sample_activity.objective_id] = [
            FailureMode.KNOWLEDGE_GAP,
            FailureMode.KNOWLEDGE_GAP,
        ]

        result = engine.should_branch_for_remediation(learner_model, sample_activity.objective_id)

        assert result == FailureMode.KNOWLEDGE_GAP

    def test_no_branch_on_single_failure(self, engine, learner_model, sample_activity):
        learner_model.failure_patterns[sample_activity.objective_id] = [
            FailureMode.KNOWLEDGE_GAP,
        ]

        result = engine.should_branch_for_remediation(learner_model, sample_activity.objective_id)

        assert result is None
