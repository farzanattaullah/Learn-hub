import mongoose, { Schema, Document as MongoDoc } from 'mongoose';

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface IQuiz extends MongoDoc {
  userId: string;
  documentId: string;
  documentTitle: string;
  title: string;
  questions: IQuizQuestion[];
  score: number | null;
  totalQuestions: number;
  percentage: number | null;
  userAnswers: number[];
  completedAt: Date | null;
  createdAt: Date;
}

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    question: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true },
    explanation: { type: String, required: true },
  },
  { _id: false }
);

const QuizSchema = new Schema<IQuiz>({
  userId: { type: String, required: true, index: true },
  documentId: { type: String, required: true, index: true },
  documentTitle: { type: String, default: '' },
  title: { type: String, required: true },
  questions: [QuizQuestionSchema],
  score: { type: Number, default: null },
  totalQuestions: { type: Number, required: true },
  percentage: { type: Number, default: null },
  userAnswers: [{ type: Number }],
  completedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

export const QuizModel = mongoose.models.Quiz || mongoose.model<IQuiz>('Quiz', QuizSchema);
