import re
import logging

logger = logging.getLogger(__name__)

# Patterns that indicate data exfiltration or off-topic attempts
BLOCKED_PATTERNS = [
    r"show\s+(me\s+)?all\s+bookings",
    r"list\s+(all\s+)?reservations",
    r"dump\s+(all\s+)?data",
    r"show\s+(me\s+)?all\s+(guests?|users?|customers?)",
    r"(ignore|forget|disregard)\s+(your\s+)?(instructions|rules|prompt|system)",
    r"you\s+are\s+now\s+a",
    r"pretend\s+you\s+are",
    r"act\s+as\s+(if|a)\b",
    r"override\s+(your\s+)?(safety|rules|instructions)",
]

OFF_TOPIC_KEYWORDS = [
    "write me code", "solve this equation", "tell me a joke",
    "who is the president", "what is the weather",
]


def check_guardrails(message: str) -> str | None:
    """
    Check if a message violates guardrails.
    Returns None if allowed, or a rejection message if blocked.
    """
    lower = message.lower().strip()

    # Check blocked patterns
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, lower):
            logger.warning("Guardrail triggered: pattern match '%s'", pattern)
            return (
                "I'm sorry, but I can't fulfill that request. "
                "I can only help with questions about our hotel or manage your own reservations. "
                "For privacy reasons, I cannot share other guests' information."
            )

    # Check off-topic (soft check - let the LLM handle most of these)
    for keyword in OFF_TOPIC_KEYWORDS:
        if keyword in lower:
            logger.info("Off-topic query detected: '%s'", keyword)
            return (
                "I'm a hotel assistant and can only help with hotel-related questions "
                "and reservation management. Is there anything about our hotel I can help you with?"
            )

    return None
