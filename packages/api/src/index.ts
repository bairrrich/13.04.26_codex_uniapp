import { z } from 'zod';

export const activityEventSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  type: z.string(),
  entityType: z.string(),
  entityId: z.string(),
  visibility: z.enum(['private', 'friends', 'public']),
  createdAt: z.string().datetime(),
  payload: z.record(z.unknown())
});

export type ActivityEventDto = z.infer<typeof activityEventSchema>;
