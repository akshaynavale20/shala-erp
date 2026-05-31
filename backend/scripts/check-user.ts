/**
 * Diagnostic script: check user login status for akshaynavale20@gmail.com
 * Run: npx ts-node -r tsconfig-paths/register scripts/check-user.ts
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

async function main() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: ['src/**/*.entity.ts'],
    synchronize: false,
  });
  await ds.initialize();

  const email = 'akshaynavale20@gmail.com';
  const rows = await ds.query(
    `SELECT id, email, name_mr, is_active, must_change_password, force_password_change,
            password_changed_at, created_at, sanstha_id
     FROM "user" WHERE email = $1`,
    [email],
  );

  if (!rows.length) {
    console.log(`❌ User not found: ${email}`);
  } else {
    const u = rows[0];
    console.log(`✅ User found:`);
    console.log(`  id:                   ${u.id}`);
    console.log(`  email:                ${u.email}`);
    console.log(`  name_mr:              ${u.name_mr}`);
    console.log(`  is_active:            ${u.is_active}`);
    console.log(`  must_change_password: ${u.must_change_password}`);
    console.log(`  force_password_change:${u.force_password_change}`);
    console.log(`  sanstha_id:           ${u.sanstha_id}`);
    console.log(`  created_at:           ${u.created_at}`);

    // Check role assignments
    const roles = await ds.query(
      `SELECT uur.id, r.name_en, uur.unit_id, uur.is_active
       FROM user_unit_role uur JOIN role r ON r.id = uur.role_id
       WHERE uur.user_id = $1`,
      [u.id],
    );
    console.log(`\n  Roles (${roles.length}):`);
    roles.forEach((r: any) => console.log(`    - ${r.name_en} | unit: ${r.unit_id || 'sanstha-wide'} | active: ${r.is_active}`));
  }

  await ds.destroy();
}

main().catch((e) => { console.error(e); process.exit(1); });
