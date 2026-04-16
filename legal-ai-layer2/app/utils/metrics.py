def calculate_metrics(y_true, y_pred):
    """
    Calculate Macro-average Accuracy, Precision, Recall, and F1-Score.
    Useful for multi-class classification evaluation (like document classification).
    """
    if len(y_true) != len(y_pred) or len(y_true) == 0:
        return {"error": "Mismatched or empty lists."}
    
    # Accuracy
    accuracy = sum(1 for yt, yp in zip(y_true, y_pred) if yt == yp) / len(y_true)
    
    classes = set(y_true).union(set(y_pred))
    
    precision_sum = 0
    recall_sum = 0
    
    for cls in classes:
        tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == cls and yp == cls)
        fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt != cls and yp == cls)
        fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == cls and yp != cls)
        
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0
        
        precision_sum += prec
        recall_sum += rec
        
    num_classes = len(classes)
    macro_precision = precision_sum / num_classes if num_classes > 0 else 0
    macro_recall = recall_sum / num_classes if num_classes > 0 else 0
    
    # Macro F1
    if macro_precision + macro_recall > 0:
        f1_score = 2 * (macro_precision * macro_recall) / (macro_precision + macro_recall)
    else:
        f1_score = 0
        
    return {
        "metrics": {
            "accuracy": round(accuracy, 4),
            "precision": round(macro_precision, 4),
            "recall": round(macro_recall, 4),
            "f1_score": round(f1_score, 4)
        },
        "total_samples": len(y_true)
    }
