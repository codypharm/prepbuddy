import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import pdfWorker from "pdfjs-dist/build/pdf.worker.mjs?url";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export class FileProcessor {
  static async extractTextFromFile(file: File): Promise<string> {
    const fileType = file.type;
    const fileName = file.name.toLowerCase();

    try {
      // Text files
      if (
        fileType === "text/plain" ||
        fileName.endsWith(".txt") ||
        fileName.endsWith(".md")
      ) {
        return await this.readTextFile(file);
      }

      // PDF files
      else if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
        return await this.extractTextFromPDF(file);
      }

      // Word documents
      else if (
        fileType ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        fileName.endsWith(".docx")
      ) {
        return await this.extractTextFromDocx(file);
      }

      // Legacy Word documents
      else if (fileType === "application/msword" || fileName.endsWith(".doc")) {
        throw new Error(
          "Legacy .doc files are not supported. Please convert to .docx or copy and paste the content.",
        );
      }

      // RTF files
      else if (fileType === "application/rtf" || fileName.endsWith(".rtf")) {
        return await this.readTextFile(file);
      }

      // LaTeX files
      else if (fileName.endsWith(".tex") || fileName.endsWith(".latex")) {
        return await this.readTextFile(file);
      }

      // Other text-based academic formats
      else if (fileName.endsWith(".bib") || fileName.endsWith(".bibtex")) {
        return await this.readTextFile(file);
      } else {
        throw new Error(
          `File type not supported: ${fileType || "unknown"}. Supported formats: PDF, DOCX, TXT, MD, RTF, TEX, BIB. For other formats, please copy and paste your content.`,
        );
      }
    } catch (error) {
      console.error("File processing error:", error);
      throw error;
    }
  }

  private static readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content && content.trim().length > 0) {
          resolve(content);
        } else {
          reject(new Error("File appears to be empty"));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    });
  }

  private static async extractTextFromPDF(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      if (pdf.numPages === 0) {
        throw new Error("PDF is empty or corrupted.");
      }

      let fullText = "";

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();

        if (textContent.items.length === 0) {
          // This page has no text content, it might be an image
          continue;
        }

        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        fullText += pageText + "\n\n";
      }

      if (fullText.trim().length === 0) {
        throw new Error(
          "PDF contains no selectable text. It may be an image-only PDF.",
        );
      }

      return fullText.trim();
    } catch (error: any) {
      console.error("PDF extraction error:", error);

      if (error.name === "PasswordException") {
        throw new Error(
          "This PDF is password-protected. Please remove the password and try again.",
        );
      }
      if (
        error.name === "InvalidPDFException" ||
        error.message.includes("Invalid PDF structure")
      ) {
        throw new Error(
          "The uploaded file is not a valid PDF or is corrupted.",
        );
      }
      if (error.message.includes("image-only")) {
        throw new Error(
          "This PDF appears to contain only images. Please upload a PDF with selectable text.",
        );
      }

      // Generic fallback error
      throw new Error(
        "Failed to process PDF. Please ensure it is a valid, text-based PDF file.",
      );
    }
  }

  private static async extractTextFromDocx(file: File): Promise<string> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });

      if (result.value && result.value.trim().length > 0) {
        return result.value.trim();
      } else {
        throw new Error("No text content found in the document.");
      }
    } catch (error) {
      console.error("DOCX extraction error:", error);
      throw new Error(
        "Failed to extract text from Word document. Please ensure the document is not corrupted.",
      );
    }
  }

  static validateFileSize(file: File, maxSizeMB: number = 25): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  static getSupportedFileTypes(): string[] {
    return [
      ".pdf",
      ".docx",
      ".txt",
      ".md",
      ".rtf",
      ".tex",
      ".latex",
      ".bib",
      ".bibtex",
    ];
  }

  static getAcceptString(): string {
    return ".pdf,.docx,.txt,.md,.rtf,.tex,.latex,.bib,.bibtex,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown,application/rtf";
  }
}
