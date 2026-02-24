import os
import pytesseract
import fitz  # PyMuPDF
import cv2
import numpy as np
from dotenv import load_dotenv

load_dotenv()

pytesseract.pytesseract.tesseract_cmd = os.getenv("TESSERACT_CMD")

# PaddleOCR optional support
USE_PADDLE = os.getenv("USE_PADDLEOCR", "false").lower() == "true"
paddle_engine = None

if USE_PADDLE:
    try:
        from paddleocr import PaddleOCR

        # Initialize only if needed
        paddle_engine = PaddleOCR(use_angle_cls=True, lang="en", show_log=False)
    except ImportError:
        print("PaddleOCR not installed, falling back to Tesseract.")
        USE_PADDLE = False


def preprocess_image_for_ocr(image):
    """
    Advanced preprocessing for scanned medical/insurance documents.
    """
    # 1. Grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # 2. Deskew (Alignment)
    coords = np.column_stack(np.where(gray > 0))
    if len(coords) > 0:
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        (h, w) = gray.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
        )
    else:
        rotated = gray

    # 3. Noise Removal & Contrast
    blur = cv2.GaussianBlur(rotated, (3, 3), 0)

    # 4. Adaptive Thresholding (Otsu's Binarization)
    thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]

    # 5. Morphological Opening (remove small noise)
    kernel = np.ones((2, 2), np.uint8)
    opening = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

    return opening


def _ocr_logic(image):
    if USE_PADDLE and paddle_engine:
        result = paddle_engine.ocr(image, cls=True)
        text = ""
        for idx in range(len(result)):
            res = result[idx]
            for line in res:
                text += line[1][0] + " "
        return text
    return pytesseract.image_to_string(image, config="--oem 3 --psm 4")


def extract_text_from_image(path):
    img = cv2.imread(path)
    if img is None:
        return ""
    processed = preprocess_image_for_ocr(img)
    return _ocr_logic(processed)


def extract_text_from_pdf(path):
    doc = fitz.open(path)
    text = ""
    for page in doc:
        # High DPI for better OCR
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_array = np.frombuffer(pix.samples, dtype=np.uint8).reshape(
            pix.height, pix.width, pix.n
        )

        # Convert RGB to BGR for OpenCV
        if pix.n == 3:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)

        processed = preprocess_image_for_ocr(img_array)
        text += _ocr_logic(processed)
    doc.close()
    return text
