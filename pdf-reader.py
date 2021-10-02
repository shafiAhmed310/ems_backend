import sys
import pdfplumber
try:
    path = sys.argv[1]
    with pdfplumber.open(f"./uploads/{path}") as pdf:
            for page in pdf.pages:
                text = page.extract_text(x_tolerance=1)
                print(text)
except Exception as err:
    print(err)
