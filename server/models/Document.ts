import mongoose, { Schema, Document as MongoDoc } from 'mongoose';

export interface IDocument extends MongoDoc {
  userId: string;
  title: string;
  fileName: string;
  fileType: 'PDF' | 'TXT';
  fileSize: number;
  extractedText: string;
  summary: {
    shortSummary: string;
    detailedSummary: string;
    keyPoints: string[];
    formulas: { name: string; formula: string; description: string }[];
    examples: string[];
  };
  importantTopics: {
    name: string;
    explanation: string;
    importance: 'High' | 'Medium' | 'Foundational';
  }[];
  importantDefinitions: {
    term: string;
    definition: string;
    context?: string;
  }[];
  importantQuestions: {
    shortAnswer: { question: string; answerHint: string }[];
    longAnswer: { question: string; keyPointsToInclude: string[] }[];
    examOriented: { question: string; marks: string; frequency: string }[];
  };
  savedQuestions: string[];
  explanationsCache: Record<
    string,
    {
      topic: string;
      simpleExplanation: string;
      example: string;
      keyPoints: string[];
      importantTerms: { term: string; meaning: string }[];
      sourceLabel: string;
    }
  >;
  sourcePreference: 'pdf_only' | 'pdf_and_external';
  processingStatus: 'processing' | 'ready' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ['PDF', 'TXT'], default: 'PDF' },
    fileSize: { type: Number, default: 0 },
    extractedText: { type: String, required: true },
    summary: {
      shortSummary: { type: String, default: '' },
      detailedSummary: { type: String, default: '' },
      keyPoints: [{ type: String }],
      formulas: [
        {
          name: { type: String },
          formula: { type: String },
          description: { type: String },
        },
      ],
      examples: [{ type: String }],
    },
    importantTopics: [
      {
        name: { type: String },
        explanation: { type: String },
        importance: { type: String, enum: ['High', 'Medium', 'Foundational'], default: 'High' },
      },
    ],
    importantDefinitions: [
      {
        term: { type: String },
        definition: { type: String },
        context: { type: String },
      },
    ],
    importantQuestions: {
      shortAnswer: [{ question: { type: String }, answerHint: { type: String } }],
      longAnswer: [{ question: { type: String }, keyPointsToInclude: [{ type: String }] }],
      examOriented: [
        {
          question: { type: String },
          marks: { type: String },
          frequency: { type: String },
        },
      ],
    },
    savedQuestions: [{ type: String }],
    explanationsCache: { type: Schema.Types.Mixed, default: {} },
    sourcePreference: {
      type: String,
      enum: ['pdf_only', 'pdf_and_external'],
      default: 'pdf_only',
    },
    processingStatus: {
      type: String,
      enum: ['processing', 'ready', 'failed'],
      default: 'ready',
    },
  },
  { timestamps: true }
);

export const DocumentModel =
  mongoose.models.Document || mongoose.model<IDocument>('Document', DocumentSchema);
