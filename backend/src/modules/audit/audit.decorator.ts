import { SetMetadata } from '@nestjs/common';
export const AUDIT_ENTITY_KEY = 'audit_entity';
export const Audit = (entityType: string) => SetMetadata(AUDIT_ENTITY_KEY, entityType);
