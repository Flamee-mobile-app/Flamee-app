import { z } from 'zod';

export const memoryBookSchema = z.object({
  title: z.string().trim().min(1, 'Vui lòng nhập tiêu đề'),
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày cần có dạng YYYY-MM-DD'),
  coverAssetKey: z.enum(['together', 'birthday', 'trip']).default('together'),
  note: z.string().default(''),
  location: z.string().optional(),
});

export type MemoryBookValues = z.infer<typeof memoryBookSchema>;
