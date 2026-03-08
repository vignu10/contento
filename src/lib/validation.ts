/**
 * Input validation schemas using Zod.
 */

import { z } from 'zod';

// Password requirements
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters');

// Email validation
const emailSchema = z.string()
  .email('Invalid email format')
  .max(255, 'Email must be less than 255 characters')
  .toLowerCase()
  .trim();

// Name validation
const nameSchema = z.string()
  .min(1, 'Name is required')
  .max(100, 'Name must be less than 100 characters')
  .trim();

// Auth schemas
export const loginSchema = z.object({
  action: z.literal('login'),
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const signupSchema = z.object({
  action: z.literal('signup'),
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});

export const logoutSchema = z.object({
  action: z.literal('logout'),
});

export const authActionSchema = z.discriminatedUnion('action', [
  loginSchema,
  signupSchema,
  logoutSchema,
]);

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type AuthActionInput = z.infer<typeof authActionSchema>;

// Content schemas
export const sourceTypeEnum = z.enum(['youtube', 'audio', 'video', 'blog', 'pdf']);

// Allowed MIME types for file uploads
const ALLOWED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/x-m4a',
  'audio/m4a',
  'audio/mp4',
  'video/mp4',
  'application/pdf',
] as const;

// File type validation - proper type checking for File objects
const fileSchema = z.custom<File>((val) => {
  if (!(val instanceof File)) return false;
  return ALLOWED_MIME_TYPES.includes(val.type as (typeof ALLOWED_MIME_TYPES)[number]);
}, {
  message: "File must be audio, video, or PDF"
});

export const createContentJsonSchema = z.object({
  sourceType: sourceTypeEnum,
  sourceUrl: z.string().url('Invalid URL format').optional(),
});

export const createContentFormSchema = z.object({
  sourceType: sourceTypeEnum,
  file: fileSchema.optional(),
});

export type CreateContentJsonInput = z.infer<typeof createContentJsonSchema>;
export type CreateContentFormInput = z.infer<typeof createContentFormSchema>;

// Output update schema
export const updateOutputSchema = z.object({
  outputId: z.string().min(1, 'Output ID is required'),
  editedData: z.string().optional(),
});

export type UpdateOutputInput = z.infer<typeof updateOutputSchema>;
