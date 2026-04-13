export type ActivityVisibility = 'private' | 'friends' | 'public';

export interface ActivityEventDto {
  id: string;
  userId: string;
  type: string;
  entityType: string;
  entityId: string;
  visibility: ActivityVisibility;
  createdAt: string;
  payload: Record<string, unknown>;
}

export function isActivityEventDto(input: unknown): input is ActivityEventDto {
  if (!input || typeof input !== 'object') {
    return false;
  }

  const value = input as Record<string, unknown>;
  return (
    typeof value.id === 'string' &&
    typeof value.userId === 'string' &&
    typeof value.type === 'string' &&
    typeof value.entityType === 'string' &&
    typeof value.entityId === 'string' &&
    (value.visibility === 'private' || value.visibility === 'friends' || value.visibility === 'public') &&
    typeof value.createdAt === 'string' &&
    typeof value.payload === 'object' &&
    value.payload !== null
  );
}
