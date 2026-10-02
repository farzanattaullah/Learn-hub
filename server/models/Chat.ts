import mongoose, { Schema, Document as MongoDoc } from 'mongoose';

export interface IChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sourceType: 'pdf' | 'external' | 'not_found' | 'system';
  sourceLabel?: string;
  relevantSection?: string;
  requiresExternalPermission?: boolean;
  pendingQuestion?: string;
  permissionResolved?: boolean;
  sources?: { title: string; url: string; domain: string }[];
  timestamp: string;
}

export interface IChat extends MongoDoc {
  userId: string;
  documentId: string;
  messages: IChatMessage[];
  sourceMode: 'pdf_only' | 'pdf_and_external';
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    sourceType: {
      type: String,
      enum: ['pdf', 'external', 'not_found', 'system'],
      default: 'pdf',
    },
    sourceLabel: { type: String },
    relevantSection: { type: String },
    requiresExternalPermission: { type: Boolean, default: false },
    pendingQuestion: { type: String },
    permissionResolved: { type: Boolean, default: false },
    sources: [
      {
        title: { type: String },
        url: { type: String },
        domain: { type: String },
      },
    ],
    timestamp: { type: String, default: () => new Date().toISOString() },
  },
  { _id: false }
);

const ChatSchema = new Schema<IChat>(
  {
    userId: { type: String, required: true, index: true },
    documentId: { type: String, required: true, index: true },
    messages: [ChatMessageSchema],
    sourceMode: {
      type: String,
      enum: ['pdf_only', 'pdf_and_external'],
      default: 'pdf_only',
    },
  },
  { timestamps: true }
);

export const ChatModel = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);
