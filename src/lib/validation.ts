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

export const createContentJsonSchema = z.object({
  sourceType: sourceTypeEnum,
  sourceUrl: z.string().url('Invalid URL format').optional(),
});

export const createContentFormSchema = z.object({
  sourceType: sourceTypeEnum,
  file: z.any().optional(), // File validation happens separately
});

export type CreateContentJsonInput = z.infer<typeof createContentJsonSchema>;
export type CreateContentFormInput = z.infer<typeof createActionSchema>;

// Output update schema
export const updateOutputSchema = z.object({
  outputId: z.string().min(1, 'Output ID is required'),
  editedData: z.string().optional(),
});

export type UpdateOutputInput = z.infer<typeof updateOutputSchema>;
