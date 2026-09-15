INSERT OR IGNORE INTO users (
  id,
  company_id,
  external_identity_id,
  email,
  display_name,
  department,
  status,
  created_at,
  updated_at
) VALUES (
  'user-site',
  'company-star-africa',
  'demo-site',
  'site@starafrica.demo',
  'Moses Kato',
  'Projects',
  'active',
  1788328800000,
  1788328800000
);

INSERT OR IGNORE INTO user_roles (user_id, role_id, assigned_at)
VALUES ('user-site', 'role-site', 1788328800000);
