# questions.py
def format_qa(q,a,cases):
    o=f"Question:\n{q}\n\nAnswer:\n{a}\n"
    if cases:
        o+="\nRelated Case Law:\n"
        for c in cases: o+=f"- {c}\n"
    return o
