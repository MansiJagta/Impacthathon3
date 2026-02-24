import re
from rapidfuzz import fuzz

TITLES = [
    "mr", "mrs", "ms", "dr", "prof", "sir", "madam", "miss", 
    "master", "md", "shri", "smt"
]

def clean_name(name: str) -> str:
    """Removes common prefixes/titles and extra spaces."""
    if not name:
        return ""
    name = name.lower().strip()
    # Remove titles
    for title in TITLES:
        # Match title as a whole word at the start (regex for word boundary or start)
        name = re.sub(rf"^{title}\.?\s+", "", name)
    return name.strip()

def similarity_score(a: str, b: str) -> float:
    if not a or not b:
        return 0.0
    
    clean_a = clean_name(a)
    clean_b = clean_name(b)
    
    # token_set_ratio is robust to extra words (like titles) and word order
    return fuzz.token_set_ratio(clean_a, clean_b) / 100.0


def is_match(a: str, b: str, threshold=0.85) -> bool:
    return similarity_score(a, b) >= threshold