// Legacy compatibility module. Production V1 contains no seeded project records.
// New code should import from ./types.
export {
  projectStages,
  money,
  healthLabel,
  type ProjectRecord,
} from './types';

import type { ProjectRecord } from './types';

export const demoProjects: ProjectRecord[] = [];
