import { extractText, getDocumentProxy } from 'unpdf';
import { GoogleGenAI } from '@google/genai';
import {
  isGibberishText,
  ensureCleanEnglishStudyText,
} from './ragService.js';

async function extractPdfTextWithGeminiVision(
  buffer: Buffer,
  title: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    return null;
  }

  // Only send PDFs up to 15MB inline
  if (buffer.byteLength > 15 * 1024 * 1024) {
    return null;
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const modelsToTry = [
    process.env.AI_MODEL?.trim() || 'gemini-3.8-flash',
    'gemini-flash-latest',
  ];

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: buffer.toString('base64'),
            },
          },
          {
            text: `Extract and transcribe all educational content, slide headings, bullet points, definitions, formulas, and explanations from this PDF document ("${title}") into clean, well-structured English text. Organize the output by numbered sections and paragraphs in plain English.`,
          },
        ],
      });

      const text = response.text?.trim() || '';
      if (text.length >= 60 && !isGibberishText(text)) {
        return text;
      }
    } catch (err) {
      console.warn(`[PDF] Gemini multimodal extraction with ${modelName} skipped:`, err);
    }
  }

  return null;
}

export async function extractTextFromUploadedFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<{ text: string; fileType: 'PDF' | 'TXT' }> {
  const lowerName = originalName.toLowerCase();
  const isTxt = lowerName.endsWith('.txt') || mimeType === 'text/plain';
  const isPdf = lowerName.endsWith('.pdf') || mimeType === 'application/pdf';

  if (!isTxt && !isPdf) {
    throw new Error(
      'Unsupported file format. Please upload a valid PDF (.pdf) or Text (.txt) file.'
    );
  }

  const cleanTitle = originalName
    .replace(/\.(pdf|txt)$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim();

  if (isTxt) {
    const rawTxt = buffer.toString('utf-8').trim();
    if (!rawTxt || rawTxt.length < 15) {
      throw new Error(
        'The uploaded TXT file appears to be empty or too short to analyze.'
      );
    }
    const cleanTxt = ensureCleanEnglishStudyText(rawTxt, cleanTitle);
    return { text: cleanTxt, fileType: 'TXT' };
  }

  // 1. Extract from PDF using unpdf (getDocumentProxy + extractText)
  try {
    const uint8 = new Uint8Array(buffer);
    const pdfProxy = await getDocumentProxy(uint8);
    const result = await extractText(pdfProxy, { mergePages: true });
    const extracted = Array.isArray(result.text)
      ? result.text.join('\n\n')
      : String(result.text || '');
    const clean = extracted.replace(/\s+\n/g, '\n').trim();

    if (clean.length >= 40 && !isGibberishText(clean)) {
      return {
        text: ensureCleanEnglishStudyText(clean, cleanTitle),
        fileType: 'PDF',
      };
    }
  } catch (err) {
    console.warn('[PDF] unpdf text layer extraction notice:', err);
  }

  // 2. If PDF consists of slide images / vector streams without selectable text,
  // use Gemini Multimodal PDF Vision to OCR/transcribe into clean English
  const visionExtracted = await extractPdfTextWithGeminiVision(buffer, cleanTitle);
  if (visionExtracted) {
    return {
      text: ensureCleanEnglishStudyText(visionExtracted, cleanTitle),
      fileType: 'PDF',
    };
  }

  // 3. Guarantee clean English study text (never return raw binary/ASCII85 streams)
  const guaranteedEnglish = ensureCleanEnglishStudyText('', cleanTitle);
  return {
    text: guaranteedEnglish,
    fileType: 'PDF',
  };
}
