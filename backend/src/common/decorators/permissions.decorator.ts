import { SetMetadata } from '@nestjs/common';
import { Permission } from '../../modules/role/role.entity';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const CurrentUser = () => {
  // Handled via request decorator in controller
  return (target: any, key: string, index: number) => {
    Reflect.defineMetadata('currentUser', index, target, key);
  };
};
