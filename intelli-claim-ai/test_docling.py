from docling.document_converter import DocumentConverter
import sys
import os

def test_docling():
    print("Testing Docling installation...")
    sample_dir = "sample_docs"
    # Try to find a PDF first as it's more standard for Docling
    files = [f for f in os.listdir(sample_dir) if f.endswith(".pdf")]
    if not files:
        files = [f for f in os.listdir(sample_dir) if f.endswith(".jpg") or f.endswith(".png")]
    
    if not files:
        print("No sample files found.")
        return

    sample_path = os.path.join(sample_dir, files[0])
    print(f"Converting: {sample_path}")
    
    try:
        from docling.datamodel.base_models import InputFormat
        from docling.datamodel.pipeline_options import PdfPipelineOptions
        
        converter = DocumentConverter()
        result = converter.convert(sample_path)
        markdown = result.document.export_to_markdown()
        print("\n--- Markdown Output (First 500 chars) ---")
        print(markdown[:500])
        print("\nSUCCESS: Docling is working correctly.")
    except Exception as e:
        print(f"Docling Error: {e}")

if __name__ == "__main__":
    test_docling()
