import type { ProjectRecord } from './demo-data';

export const pipelineStages = [
  'Awarded',
  'Mobilization',
  'Work Started',
  'In Progress',
  'Testing',
  'Practical Completion',
  'Retention Period',
  'Closed',
] as const;

export type PipelineStage = (typeof pipelineStages)[number];

const stageAliases: Record<string, PipelineStage> = {
  awarded: 'Awarded',
  'award contract stage': 'Awarded',
  'contract setup': 'Awarded',
  'site handover': 'Mobilization',
  mobilization: 'Mobilization',
  mobilisation: 'Mobilization',
  'materials procurement': 'Mobilization',
  'secure materials': 'Mobilization',
  'labour mobilisation': 'Work Started',
  'labor mobilization': 'Work Started',
  'work started': 'Work Started',
  'in progress': 'In Progress',
  'work execution': 'In Progress',
  testing: 'Testing',
  'testing completion': 'Testing',
  completed: 'Practical Completion',
  'practical completion': 'Practical Completion',
  retention: 'Retention Period',
  'retention period': 'Retention Period',
  closed: 'Closed',
  archived: 'Closed',
};

const stageKey = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replaceAll('&', ' ')
    .replaceAll('/', ' ')
    .replaceAll(/\s+/g, ' ');

export function getPipelineStage(project: ProjectRecord): PipelineStage {
  const mapped = stageAliases[stageKey(project.stage)];
  if (mapped) return mapped;
  if (project.status === 'archived' || project.status === 'closed')
    return 'Closed';
  if (project.status === 'retention') return 'Retention Period';
  if (project.completionBasisPoints >= 10000) return 'Practical Completion';
  if (project.completionBasisPoints > 0) return 'In Progress';
  return 'Awarded';
}
