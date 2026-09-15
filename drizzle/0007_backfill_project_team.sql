INSERT OR IGNORE INTO project_team_members (
  id,
  project_id,
  user_id,
  project_role,
  responsibility,
  starts_at,
  ends_at,
  allocation_basis_points,
  access_level,
  status,
  details_json,
  created_at,
  updated_at
)
SELECT
  'team-project-manager-' || p.id,
  p.id,
  p.project_manager_id,
  'project_manager',
  'Overall project delivery and coordination',
  p.starts_at,
  p.planned_completion_at,
  10000,
  'standard',
  'active',
  json_object('employee', u.display_name),
  p.created_at,
  p.updated_at
FROM projects p
JOIN users u ON u.id = p.project_manager_id
WHERE p.project_manager_id IS NOT NULL;

INSERT OR IGNORE INTO project_team_members (
  id,
  project_id,
  user_id,
  project_role,
  responsibility,
  starts_at,
  ends_at,
  allocation_basis_points,
  access_level,
  status,
  details_json,
  created_at,
  updated_at
)
SELECT
  'team-site-manager-' || p.id,
  p.id,
  p.site_manager_id,
  'site_manager',
  'Site operations, safety and daily delivery',
  p.starts_at,
  p.planned_completion_at,
  10000,
  'standard',
  'active',
  json_object('employee', u.display_name),
  p.created_at,
  p.updated_at
FROM projects p
JOIN users u ON u.id = p.site_manager_id
WHERE p.site_manager_id IS NOT NULL;
