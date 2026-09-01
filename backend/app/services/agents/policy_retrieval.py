from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from backend.app.models.policy import Policy, PolicyVersion, PolicyClause, PolicyThreshold
from backend.app.models.risk_rule import RiskScoringRule
from backend.app.models.equipment import Equipment

class PolicyRetrievalAgent:
    """
    Policy Retrieval Agent (Agent 2).
    Dynamically fetches active safety policies, versions, clauses, thresholds, and rules from the database.
    CRITICAL: Does NOT hardcode any limits. All boundaries are read from DB tables.
    """

    @staticmethod
    def retrieve_active_policy(db: Session, equipment: Equipment) -> Optional[PolicyVersion]:
        """
        Retrieves the active policy version for a specific equipment or equipment type.
        """
        # Look up policy matching equipment type
        policy = db.query(Policy).filter(Policy.equipment_type == equipment.equipment_type).first()
        if not policy:
            return None
        
        # Retrieve currently active version
        active_version = db.query(PolicyVersion).filter(
            PolicyVersion.policy_id == policy.id,
            PolicyVersion.is_active == True
        ).order_by(PolicyVersion.effective_date.desc()).first()
        
        return active_version

    @staticmethod
    def get_thresholds_for_version(db: Session, policy_version_id: int) -> Dict[str, PolicyThreshold]:
        """
        Returns a dictionary mapping parameter names to PolicyThreshold records.
        """
        thresholds = db.query(PolicyThreshold).filter(
            PolicyThreshold.policy_version_id == policy_version_id
        ).all()
        return {t.parameter.lower(): t for t in thresholds}

    @staticmethod
    def get_rules_for_version(db: Session, policy_version_id: Optional[int]) -> List[RiskScoringRule]:
        """
        Retrieves rules linked to the active version as well as global active rules.
        """
        query = db.query(RiskScoringRule).filter(RiskScoringRule.is_active == True)
        if policy_version_id:
            query = query.filter(
                (RiskScoringRule.policy_version_id == policy_version_id) | 
                (RiskScoringRule.policy_version_id.is_(None))
            )
        else:
            query = query.filter(RiskScoringRule.policy_version_id.is_(None))
        return query.all()

    @staticmethod
    def get_clauses_for_version(db: Session, policy_version_id: int) -> List[PolicyClause]:
        return db.query(PolicyClause).filter(
            PolicyClause.policy_version_id == policy_version_id
        ).order_by(PolicyClause.clause_number.asc()).all()
