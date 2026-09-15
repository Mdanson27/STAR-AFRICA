import { describe, expect, it } from 'vitest';
import { getPipelineStage } from './pipeline';
import type { ProjectRecord } from './demo-data';

const project = (
  stage: string,
  status = 'active',
  completionBasisPoints = 0,
): ProjectRecord => ({
  id: 'project-1',
  code: 'SA-PRJ-001',
  name: 'Test project',
  client: 'Client',
  category: 'Construction',
  description: '',
  location: 'Uganda',
  priority: 'normal',
  currency: 'UGX',
  contractValueMinor: '0',
  budgetMinor: '0',
  committedMinor: '0',
  actualMinor: '0',
  retentionBasisPoints: 500,
  startsAt: '',
  plannedCompletionAt: '',
  stage,
  status,
  health: 'on_track',
  completionBasisPoints,
  projectManager: 'Manager',
  siteManager: 'Site manager',
});

describe('project pipeline stage routing', () => {
  it('maps persisted D1 stage names into the visible pipeline', () => {
    expect(getPipelineStage(project('Work Execution', 'active', 6800))).toBe(
      'In Progress',
    );
    expect(
      getPipelineStage(project('Testing / Completion', 'active', 9000)),
    ).toBe('Testing');
    expect(getPipelineStage(project('Retention', 'retention', 10000))).toBe(
      'Retention Period',
    );
  });

  it('keeps unknown active stages visible using progress as a fallback', () => {
    expect(
      getPipelineStage(project('Custom delivery stage', 'active', 2500)),
    ).toBe('In Progress');
  });
});
