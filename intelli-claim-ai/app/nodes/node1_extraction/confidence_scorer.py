def calculate_field_confidence(value, source_type, ocr_quality=0.9):
    """
    source_type: 'llm', 'regex', 'merged'
    """
    if not value or value == "" or value == 0.0:
        return 0.0
    
    base_confidence = 0.5
    if source_type == 'llm':
        base_confidence = 0.85
    elif source_type == 'regex':
        base_confidence = 0.95 # Deterministic matches are highly trusted if they follow strict patterns
    elif source_type == 'merged':
        base_confidence = 0.90
        
    return round(base_confidence * ocr_quality, 2)

def get_overall_confidence(field_confidences):
    if not field_confidences:
        return 0.0
    valid_scores = [s for s in field_confidences.values() if s > 0]
    if not valid_scores:
        return 0.0
    return round(sum(valid_scores) / len(valid_scores), 2)
