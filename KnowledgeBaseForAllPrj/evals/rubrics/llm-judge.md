# LLM judge rubric

Use a versioned prompt and structured result. Require claim-level evidence and an uncertainty field. For pairwise grading, evaluate A/B and B/A and reconcile order-sensitive disagreement. Measure agreement against a human-labeled calibration set; route low-confidence or conflicting results to human review.

Record judge model, prompt version, corpus/index version, run date and input hashes. Never use the same unreviewed judge as the sole high-risk release gate.
