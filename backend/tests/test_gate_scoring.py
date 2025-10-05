"""
Tests for Gate Scoring Module

Comprehensive tests for evidence-led stage gate evaluation logic.
"""

import pytest
from src.gate_scoring import (
    GateStage,
    GateStatus,
    EvidenceStrength,
    Evidence,
    calculate_evidence_quality,
    count_experiments,
    get_evidence_types,
    count_strength_mix,
    evaluate_gate,
    can_progress_to_next_stage,
    get_next_stage,
    calculate_gate_readiness_score,
    DEFAULT_GATE_CRITERIA,
)


# =============================================================================
# Fixtures
# =============================================================================

@pytest.fixture
def sample_evidence():
    """Sample evidence list for testing"""
    return [
        {
            "type": "interview",
            "strength": EvidenceStrength.STRONG,
            "quality_score": 0.9,
        },
        {
            "type": "analytics",
            "strength": EvidenceStrength.MEDIUM,
            "quality_score": 0.8,
        },
        {
            "type": "experiment",
            "strength": EvidenceStrength.STRONG,
            "quality_score": 0.85,
        },
        {
            "type": "experiment",
            "strength": EvidenceStrength.MEDIUM,
            "quality_score": 0.75,
        },
        {
            "type": "desk",
            "strength": EvidenceStrength.WEAK,
            "quality_score": 0.6,
        },
    ]


@pytest.fixture
def desirability_passing_evidence():
    """Evidence that passes DESIRABILITY gate"""
    return [
        {"type": "interview", "strength": EvidenceStrength.STRONG, "quality_score": 0.9},
        {"type": "interview", "strength": EvidenceStrength.STRONG, "quality_score": 0.85},
        {"type": "interview", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.8},
        {"type": "analytics", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.75},
        {"type": "analytics", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.8},
        {"type": "experiment", "strength": EvidenceStrength.STRONG, "quality_score": 0.9},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.75},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.72},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.71},
        {"type": "desk", "strength": EvidenceStrength.WEAK, "quality_score": 0.6},
    ]


# =============================================================================
# Test Evidence Quality Calculation
# =============================================================================

def test_calculate_evidence_quality_with_data(sample_evidence):
    """Test quality calculation with sample evidence"""
    quality = calculate_evidence_quality(sample_evidence)
    expected = (0.9 + 0.8 + 0.85 + 0.75 + 0.6) / 5
    assert quality == pytest.approx(expected, rel=1e-2)


def test_calculate_evidence_quality_empty():
    """Test quality calculation with no evidence"""
    quality = calculate_evidence_quality([])
    assert quality == 0.0


def test_calculate_evidence_quality_perfect():
    """Test quality calculation with perfect scores"""
    evidence = [
        {"type": "interview", "strength": EvidenceStrength.STRONG, "quality_score": 1.0},
        {"type": "analytics", "strength": EvidenceStrength.STRONG, "quality_score": 1.0},
    ]
    quality = calculate_evidence_quality(evidence)
    assert quality == 1.0


# =============================================================================
# Test Experiment Counting
# =============================================================================

def test_count_experiments(sample_evidence):
    """Test experiment counting"""
    count = count_experiments(sample_evidence)
    assert count == 2


def test_count_experiments_none():
    """Test experiment counting with no experiments"""
    evidence = [
        {"type": "interview", "strength": EvidenceStrength.STRONG, "quality_score": 0.9},
        {"type": "analytics", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.8},
    ]
    count = count_experiments(evidence)
    assert count == 0


def test_count_experiments_only_experiments():
    """Test counting when all evidence is experiments"""
    evidence = [
        {"type": "experiment", "strength": EvidenceStrength.STRONG, "quality_score": 0.9},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.8},
        {"type": "experiment", "strength": EvidenceStrength.STRONG, "quality_score": 0.85},
    ]
    count = count_experiments(evidence)
    assert count == 3


# =============================================================================
# Test Evidence Type Detection
# =============================================================================

def test_get_evidence_types(sample_evidence):
    """Test evidence type detection"""
    types = get_evidence_types(sample_evidence)
    assert types == {"interview", "analytics", "experiment", "desk"}


def test_get_evidence_types_single():
    """Test evidence type detection with single type"""
    evidence = [
        {"type": "interview", "strength": EvidenceStrength.STRONG, "quality_score": 0.9},
        {"type": "interview", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.8},
    ]
    types = get_evidence_types(evidence)
    assert types == {"interview"}


# =============================================================================
# Test Strength Mix Counting
# =============================================================================

def test_count_strength_mix(sample_evidence):
    """Test strength mix counting"""
    mix = count_strength_mix(sample_evidence)
    assert mix == {"weak": 1, "medium": 2, "strong": 2}


def test_count_strength_mix_all_strong():
    """Test strength mix with all strong evidence"""
    evidence = [
        {"type": "interview", "strength": EvidenceStrength.STRONG, "quality_score": 0.9},
        {"type": "analytics", "strength": EvidenceStrength.STRONG, "quality_score": 0.85},
        {"type": "experiment", "strength": EvidenceStrength.STRONG, "quality_score": 0.9},
    ]
    mix = count_strength_mix(evidence)
    assert mix == {"weak": 0, "medium": 0, "strong": 3}


def test_count_strength_mix_with_string_values():
    """Test strength mix counting with string strength values"""
    evidence = [
        {"type": "interview", "strength": "strong", "quality_score": 0.9},
        {"type": "analytics", "strength": "medium", "quality_score": 0.8},
        {"type": "experiment", "strength": "weak", "quality_score": 0.6},
    ]
    mix = count_strength_mix(evidence)
    assert mix == {"weak": 1, "medium": 1, "strong": 1}


# =============================================================================
# Test Gate Evaluation - DESIRABILITY
# =============================================================================

def test_evaluate_desirability_gate_pass(desirability_passing_evidence):
    """Test DESIRABILITY gate with passing evidence"""
    status, reasons = evaluate_gate(GateStage.DESIRABILITY, desirability_passing_evidence)
    assert status == GateStatus.PASSED
    assert len(reasons) == 0


def test_evaluate_desirability_gate_insufficient_experiments():
    """Test DESIRABILITY gate failing due to insufficient experiments"""
    evidence = [
        {"type": "interview", "strength": EvidenceStrength.STRONG, "quality_score": 0.9},
        {"type": "interview", "strength": EvidenceStrength.STRONG, "quality_score": 0.85},
        {"type": "interview", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.8},
        {"type": "analytics", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.75},
        {"type": "analytics", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.8},
        {"type": "experiment", "strength": EvidenceStrength.STRONG, "quality_score": 0.9},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.75},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
        # Only 3 experiments (need 5)
    ]
    
    status, reasons = evaluate_gate(GateStage.DESIRABILITY, evidence)
    assert status == GateStatus.FAILED
    assert any("Insufficient experiments" in r for r in reasons)


def test_evaluate_desirability_gate_low_quality():
    """Test DESIRABILITY gate failing due to low evidence quality"""
    evidence = [
        {"type": "interview", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.5},
        {"type": "interview", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.5},
        {"type": "interview", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.5},
        {"type": "analytics", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.5},
        {"type": "analytics", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.5},
        {"type": "experiment", "strength": EvidenceStrength.STRONG, "quality_score": 0.5},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.5},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.5},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.5},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.5},
    ]
    
    status, reasons = evaluate_gate(GateStage.DESIRABILITY, evidence)
    assert status == GateStatus.FAILED
    assert any("Evidence quality too low" in r for r in reasons)


def test_evaluate_desirability_gate_missing_evidence_types():
    """Test DESIRABILITY gate failing due to missing required evidence types"""
    evidence = [
        {"type": "interview", "strength": EvidenceStrength.STRONG, "quality_score": 0.9},
        {"type": "interview", "strength": EvidenceStrength.STRONG, "quality_score": 0.85},
        {"type": "interview", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.8},
        # Missing analytics!
        {"type": "experiment", "strength": EvidenceStrength.STRONG, "quality_score": 0.9},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.75},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.72},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.71},
    ]
    
    status, reasons = evaluate_gate(GateStage.DESIRABILITY, evidence)
    assert status == GateStatus.FAILED
    assert any("Missing required evidence types" in r and "analytics" in r for r in reasons)


# =============================================================================
# Test Gate Evaluation - Other Stages
# =============================================================================

def test_evaluate_feasibility_gate_requirements():
    """Test FEASIBILITY gate has stricter requirements than DESIRABILITY"""
    criteria_desir = DEFAULT_GATE_CRITERIA[GateStage.DESIRABILITY]
    criteria_feas = DEFAULT_GATE_CRITERIA[GateStage.FEASIBILITY]
    
    assert criteria_feas["min_experiments"] > criteria_desir["min_experiments"]
    assert criteria_feas["min_evidence_quality"] > criteria_desir["min_evidence_quality"]
    assert criteria_feas["min_total_evidence"] > criteria_desir["min_total_evidence"]


def test_evaluate_viability_gate_requirements():
    """Test VIABILITY gate has stricter requirements than FEASIBILITY"""
    criteria_feas = DEFAULT_GATE_CRITERIA[GateStage.FEASIBILITY]
    criteria_viab = DEFAULT_GATE_CRITERIA[GateStage.VIABILITY]
    
    assert criteria_viab["min_experiments"] > criteria_feas["min_experiments"]
    assert criteria_viab["min_evidence_quality"] > criteria_feas["min_evidence_quality"]
    assert criteria_viab["min_total_evidence"] > criteria_feas["min_total_evidence"]


def test_evaluate_scale_gate_requirements():
    """Test SCALE gate has strictest requirements"""
    criteria_viab = DEFAULT_GATE_CRITERIA[GateStage.VIABILITY]
    criteria_scale = DEFAULT_GATE_CRITERIA[GateStage.SCALE]
    
    assert criteria_scale["min_experiments"] > criteria_viab["min_experiments"]
    assert criteria_scale["min_evidence_quality"] > criteria_viab["min_evidence_quality"]
    assert criteria_scale["min_total_evidence"] > criteria_viab["min_total_evidence"]


# =============================================================================
# Test Stage Progression
# =============================================================================

def test_can_progress_with_passed_gate():
    """Test progression allowed with passed gate"""
    assert can_progress_to_next_stage(GateStage.DESIRABILITY, GateStatus.PASSED) is True
    assert can_progress_to_next_stage(GateStage.FEASIBILITY, GateStatus.PASSED) is True
    assert can_progress_to_next_stage(GateStage.VIABILITY, GateStatus.PASSED) is True


def test_cannot_progress_with_failed_gate():
    """Test progression blocked with failed gate"""
    assert can_progress_to_next_stage(GateStage.DESIRABILITY, GateStatus.FAILED) is False
    assert can_progress_to_next_stage(GateStage.FEASIBILITY, GateStatus.FAILED) is False
    assert can_progress_to_next_stage(GateStage.VIABILITY, GateStatus.FAILED) is False


def test_cannot_progress_with_pending_gate():
    """Test progression blocked with pending gate"""
    assert can_progress_to_next_stage(GateStage.DESIRABILITY, GateStatus.PENDING) is False


def test_cannot_progress_from_scale():
    """Test no progression from SCALE (final stage)"""
    assert can_progress_to_next_stage(GateStage.SCALE, GateStatus.PASSED) is False


def test_get_next_stage_sequence():
    """Test correct stage sequence"""
    assert get_next_stage(GateStage.DESIRABILITY) == GateStage.FEASIBILITY
    assert get_next_stage(GateStage.FEASIBILITY) == GateStage.VIABILITY
    assert get_next_stage(GateStage.VIABILITY) == GateStage.SCALE
    assert get_next_stage(GateStage.SCALE) is None


# =============================================================================
# Test Gate Readiness Score
# =============================================================================

def test_calculate_gate_readiness_score_perfect(desirability_passing_evidence):
    """Test readiness score with passing evidence"""
    score = calculate_gate_readiness_score(
        GateStage.DESIRABILITY,
        desirability_passing_evidence
    )
    assert score >= 0.9  # Should be very high


def test_calculate_gate_readiness_score_zero():
    """Test readiness score with no evidence"""
    score = calculate_gate_readiness_score(GateStage.DESIRABILITY, [])
    assert score == 0.0


def test_calculate_gate_readiness_score_partial():
    """Test readiness score with partial evidence"""
    evidence = [
        {"type": "interview", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
        {"type": "analytics", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
    ]
    
    score = calculate_gate_readiness_score(GateStage.DESIRABILITY, evidence)
    assert 0.0 < score < 1.0


def test_calculate_gate_readiness_score_increases_with_evidence():
    """Test readiness score increases as evidence is added"""
    evidence_few = [
        {"type": "interview", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
    ]
    
    evidence_more = [
        {"type": "interview", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
        {"type": "analytics", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
    ]
    
    score_few = calculate_gate_readiness_score(GateStage.DESIRABILITY, evidence_few)
    score_more = calculate_gate_readiness_score(GateStage.DESIRABILITY, evidence_more)
    
    assert score_more > score_few


# =============================================================================
# Test Custom Criteria
# =============================================================================

def test_evaluate_gate_with_custom_criteria():
    """Test gate evaluation with custom criteria"""
    custom_criteria = {
        "min_experiments": 2,
        "min_evidence_quality": 0.6,
        "min_total_evidence": 3,
        "required_evidence_types": ["interview"],
        "strength_mix": {"weak": 0, "medium": 1, "strong": 1},
    }
    
    evidence = [
        {"type": "interview", "strength": EvidenceStrength.STRONG, "quality_score": 0.8},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
        {"type": "experiment", "strength": EvidenceStrength.STRONG, "quality_score": 0.75},
    ]
    
    status, reasons = evaluate_gate(GateStage.DESIRABILITY, evidence, custom_criteria)
    assert status == GateStatus.PASSED
    assert len(reasons) == 0


# =============================================================================
# Test Edge Cases
# =============================================================================

def test_evaluate_gate_boundary_quality():
    """Test gate evaluation at exact quality threshold"""
    evidence = [
        {"type": "interview", "strength": EvidenceStrength.STRONG, "quality_score": 0.7},
        {"type": "interview", "strength": EvidenceStrength.STRONG, "quality_score": 0.7},
        {"type": "interview", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
        {"type": "analytics", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
        {"type": "analytics", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
        {"type": "experiment", "strength": EvidenceStrength.STRONG, "quality_score": 0.7},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.7},
        {"type": "desk", "strength": EvidenceStrength.WEAK, "quality_score": 0.7},
    ]
    
    # Average quality is exactly 0.7 (threshold for DESIRABILITY)
    quality = calculate_evidence_quality(evidence)
    assert quality == pytest.approx(0.7, rel=1e-9)
    
    status, reasons = evaluate_gate(GateStage.DESIRABILITY, evidence)
    assert status == GateStatus.PASSED  # Should pass at exact threshold


def test_evaluate_gate_just_below_threshold():
    """Test gate evaluation just below quality threshold"""
    evidence = [
        {"type": "interview", "strength": EvidenceStrength.STRONG, "quality_score": 0.69},
        {"type": "interview", "strength": EvidenceStrength.STRONG, "quality_score": 0.69},
        {"type": "interview", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.69},
        {"type": "analytics", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.69},
        {"type": "analytics", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.69},
        {"type": "experiment", "strength": EvidenceStrength.STRONG, "quality_score": 0.69},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.69},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.69},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.69},
        {"type": "experiment", "strength": EvidenceStrength.MEDIUM, "quality_score": 0.69},
        {"type": "desk", "strength": EvidenceStrength.WEAK, "quality_score": 0.69},
    ]
    
    status, reasons = evaluate_gate(GateStage.DESIRABILITY, evidence)
    assert status == GateStatus.FAILED
    assert any("Evidence quality too low" in r for r in reasons)
