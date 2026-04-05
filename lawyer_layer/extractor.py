from PyPDF2 import PdfReader
import docx
from PIL import Image
import pytesseract
import io

def extract_text(file):

    filename = file.filename.lower()
    content = file.file.read()

    if filename.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if filename.endswith(".docx"):
        doc = docx.Document(io.BytesIO(content))
        return "\n".join(p.text for p in doc.paragraphs)

    if filename.endswith(".txt"):
        return content.decode("utf-8")

    if filename.endswith((".png", ".jpg", ".jpeg")):
        image = Image.open(io.BytesIO(content))
        return pytesseract.image_to_string(image)

    return ""