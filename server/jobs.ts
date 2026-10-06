import { Job } from '../shared/types.ts';

const jobs = new Map<string, Job>();
const activeTasks = new Map<string, { cancel: () => void }>();

export function createJob(params: {
  id?: string;
  type: Job['type'];
  projectId: string;
  sceneId?: string;
  stage?: string;
}): Job {
  const id = params.id || `job_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const now = new Date().toISOString();
  
  const job: Job = {
    id,
    type: params.type,
    projectId: params.projectId,
    sceneId: params.sceneId,
    status: 'queued',
    progress: 0,
    stage: params.stage || 'Initialized',
    createdAt: now,
    updatedAt: now,
  };
  
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): Job | null {
  return jobs.get(id) || null;
}

export function updateJob(id: string, updates: Partial<Job>): Job | null {
  const job = jobs.get(id);
  if (!job) return null;
  
  const updated: Job = {
    ...job,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  jobs.set(id, updated);
  return updated;
}

export function registerTaskCancellation(id: string, cancelFn: () => void) {
  activeTasks.set(id, { cancel: cancelFn });
}

export function cancelJob(id: string): boolean {
  const job = jobs.get(id);
  if (!job) return false;
  
  const task = activeTasks.get(id);
  if (task) {
    try {
      task.cancel();
    } catch (e) {
      console.error(`Error cancelling task ${id}:`, e);
    }
    activeTasks.delete(id);
  }
  
  updateJob(id, {
    status: 'cancelled',
    message: 'Operation was cancelled by user',
  });
  return true;
}

export function getJobsForProject(projectId: string): Job[] {
  return Array.from(jobs.values()).filter(j => j.projectId === projectId);
}
