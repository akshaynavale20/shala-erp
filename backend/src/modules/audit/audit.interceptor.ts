import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditLog, AuditAction } from './audit.entity';
import { AUDIT_ENTITY_KEY } from './audit.decorator';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(AuditLog)
    private readonly auditRepo: Repository<AuditLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const entityType = this.reflector.get<string>(AUDIT_ENTITY_KEY, context.getHandler());
    if (!entityType) return next.handle();

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method;

    let action: AuditAction;
    if (method === 'POST') action = AuditAction.CREATE;
    else if (method === 'PUT' || method === 'PATCH') action = AuditAction.UPDATE;
    else if (method === 'DELETE') action = AuditAction.DELETE;
    else return next.handle();

    return next.handle().pipe(
      tap(async (result) => {
        try {
          const entityId = result?.id || request.params?.id || null;
          await this.auditRepo.save(this.auditRepo.create({
            userId: user?.id,
            userNameMr: user?.nameMr,
            sansthaId: user?.sansthaId,
            action,
            entityType,
            entityId,
            ipAddress: request.ip,
          }));
        } catch (_e) {
          // never break main request
        }
      }),
    );
  }
}
