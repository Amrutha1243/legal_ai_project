import pdfplumber
import docx

def extract_text_from_pdf(file):
    text = ""
    with pdfplumber.open(file) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()

def extract_text_from_docx(file):
    text = ""
    doc = docx.Document(file)
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text.strip()

def extract_text_from_txt(file):
    return file.read().decode('utf-8', errors='ignore').strip()

def extract_text_from_upload(upload_file):
    filename = upload_file.filename.lower()
    if filename.endswith('.pdf'):
        return extract_text_from_pdf(upload_file.file)
    elif filename.endswith('.docx'):
        return extract_text_from_docx(upload_file.file)
    elif filename.endswith('.txt'):
        return extract_text_from_txt(upload_file.file)
    else:
        # Fallback to reading as generic text for unknown extensions
        return upload_file.file.read().decode('utf-8', errors='ignore').strip()
