import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  remember: z.boolean().default(false),
});

export const registerSchema = z.object({
  phone: z.string().min(9),
  email: z.string().email(),
  password: z.string().min(6),
  acceptedPolicy: z.literal(true),
});
