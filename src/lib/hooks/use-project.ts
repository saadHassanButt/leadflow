import { useState, useEffect } from 'react';
import { Project } from '@/types/project';
import { apiClient } from '@/lib/api';

export function useProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.getProject(projectId);
        if (response.success && response.data) {
          setProject(response.data);
        } else {
          setError('Failed to fetch project');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const updateProject = async (data: Partial<Project>) => {
    if (!project) return;
    
    try {
      const response = await apiClient.updateProject(projectId, data);
      if (response.success && response.data) {
        setProject(response.data);
      }
    } catch (err) {
      console.error('Failed to update project:', err);
    }
  };

  return {
    project,
    loading,
    error,
    updateProject,
  };
}
