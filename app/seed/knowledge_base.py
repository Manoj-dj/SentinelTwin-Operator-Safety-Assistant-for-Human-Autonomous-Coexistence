"""Seed data for the knowledge-base documents used by TF-IDF retrieval in
the chatbot. Content mirrors/expands the training resources so the chatbot
has real text to retrieve from without needing external documents.
"""
from __future__ import annotations

KNOWLEDGE_BASE_DOCUMENTS = [
    {
        "title": "Autonomous Truck States Explained",
        "category": "SAFETY",
        "tags": ["truck-states", "safety"],
        "content": (
            "Autonomous haul trucks operate in one of seven states. NORMAL means the truck is "
            "executing an active mission under normal autonomous operation. EXCEPTION means the "
            "truck has paused due to a safety, communication, or system exception and is not "
            "actively driving its mission. RECOVERY means personnel or equipment recovery "
            "interaction is underway near the truck -- extreme caution is required because the "
            "truck's underlying mission may still be active. TRANSITIONING means a relevant "
            "environmental or safety condition has changed and the autonomous system may "
            "reevaluate its mission at any moment; this is one of the highest-risk states for "
            "nearby personnel because a resumption of movement may follow. STOPPED means the "
            "truck is confirmed stationary, but it should only be treated as safe to approach if "
            "safe_to_approach_confirmed is explicitly true -- a stopped truck without this "
            "confirmation may resume moving. SUSPENDED means the truck's mission has been "
            "isolated or suspended by an approved procedure; this is the safest state for "
            "recovery work, especially when combined with a safe-to-approach confirmation. "
            "OFFLINE means there is no reliable telemetry from the truck; this must be handled "
            "conservatively as an unknown, high-caution state."
        ),
    },
    {
        "title": "Safety-State Visibility Gap",
        "category": "SAFETY",
        "tags": ["risk", "state-transition"],
        "content": (
            "The central safety risk on a mixed human-autonomous quarry site is not that an "
            "autonomous truck moves randomly -- its behavior is deterministic, governed by "
            "missions, safety conditions, communication conditions, exclusion conditions and "
            "operating modes. The danger arises when a nearby person or manned machine does not "
            "understand the truck's current state, the conditions influencing that state, which "
            "nearby changes could trigger a state transition, and whether the truck has fully "
            "entered a confirmed safe-to-approach state. For example, if a truck transitions to "
            "EXCEPTION and stops, and a human operator approaches for recovery, and then a nearby "
            "support vehicle leaves or deactivates (changing a relevant condition), the autonomous "
            "system may reevaluate its conditions. If its prior mission is still active, it may "
            "transition from EXCEPTION/RECOVERY toward NORMAL. The danger is not random movement; "
            "it is the operator's lack of visibility into a pending state transition. Operators "
            "should never assume a truck is safe to approach just because it appears stopped or "
            "idle -- always confirm explicit safe-to-approach status via approved procedure."
        ),
    },
    {
        "title": "Approved Recovery and Isolation Procedure Summary",
        "category": "SAFETY",
        "tags": ["recovery", "isolation", "procedure"],
        "content": (
            "Before approaching any autonomous haul truck for recovery or maintenance, operators "
            "must confirm the truck's mission has been suspended or isolated through the approved "
            "site procedure, not merely that the truck appears stationary. Required steps include: "
            "contact the control room to confirm truck state, confirm the truck reports SUSPENDED "
            "or STOPPED with safe_to_approach_confirmed = true, apply physical isolation/lockout "
            "per site policy, and maintain exclusion distance until confirmation is received in "
            "writing or via the approved digital confirmation system. SentinelTwin can surface the "
            "truck's reported state and risk factors, but it cannot substitute for this procedure "
            "and cannot authorize an approach."
        ),
    },
    {
        "title": "Seatbelt Compliance Policy",
        "category": "COMPLIANCE",
        "tags": ["seatbelt", "compliance"],
        "content": (
            "Seatbelts must be fastened any time the engine is running. Operating with an "
            "unfastened seatbelt while the engine is running is a safety violation. If the "
            "machine is also in motion, this is a high-severity event. If the operator is also "
            "close to an autonomous truck that is in EXCEPTION, RECOVERY or TRANSITIONING, this "
            "is treated as a critical severity event requiring an immediate stop and correction "
            "before continuing operation."
        ),
    },
    {
        "title": "Fatigue and Break Guidance",
        "category": "WELLBEING",
        "tags": ["fatigue", "breaks"],
        "content": (
            "Operator fatigue risk increases with continuous work hours, time since the last "
            "recorded break, night-shift operation, rising harsh-braking/harsh-acceleration "
            "events, and declining productivity relative to shift baseline. When fatigue risk "
            "reaches HIGH or CRITICAL, operators should take an approved break of 15-25 minutes "
            "and complete a safety check-in. This is a decision-support score, not a medical "
            "diagnosis, and does not replace fitness-for-duty assessments."
        ),
    },
    {
        "title": "Low Visibility Operations Guidance",
        "category": "SAFETY",
        "tags": ["visibility", "weather"],
        "content": (
            "Dust, rain, fog and night conditions reduce visibility and increase both collision "
            "interaction risk and task duration. Operators should reduce speed, increase "
            "following/separation distances near autonomous trucks, and rely more heavily on "
            "SentinelTwin's state-visibility alerts when visual confirmation is degraded. Poor "
            "visibility alone increases the state-transition and collision risk scores."
        ),
    },
    {
        "title": "Machine Efficiency and Fair Attribution",
        "category": "EFFICIENCY",
        "tags": ["efficiency", "productivity"],
        "content": (
            "Machine efficiency is calculated from productive time versus idle time, cycle "
            "completion versus plan, and fuel efficiency. Efficiency shortfalls caused by "
            "autonomous truck queue waiting, weather/visibility conditions, or active safety "
            "events are operational factors and should not be automatically attributed to poor "
            "operator performance. SentinelTwin surfaces these external factors alongside the "
            "raw efficiency percentage."
        ),
    },
    {
        "title": "Predicted Machine Failure Risk Guidance",
        "category": "MAINTENANCE",
        "tags": ["maintenance", "failure-risk"],
        "content": (
            "Predicted machine failure risk is derived from engine temperature, oil pressure, "
            "coolant temperature, hydraulic temperature, vibration, fault codes, days overdue for "
            "maintenance, and recent unusual-pattern detections. A HIGH or CRITICAL score means "
            "inspection is recommended, not that failure is certain. Always treat this as a "
            "predicted maintenance risk signal requiring human inspection and confirmation."
        ),
    },
]
