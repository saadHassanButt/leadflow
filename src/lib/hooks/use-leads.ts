import { useState, useEffect } from 'react';
import { Lead, CreateLeadData } from '@/types/lead';
import { apiClient } from '@/lib/api';

export function useLeads(projectId: string) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await apiClient.getLeads(projectId);
        if (response.success && response.data) {
          setLeads(response.data);
        } else {
          setError('Failed to fetch leads');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchLeads();
    }
  }, [projectId]);

  const createLead = async (data: CreateLeadData) => {
    try {
      const response = await apiClient.createLead(projectId, data);
      if (response.success && response.data) {
        setLeads(prev => [...prev, response.data!]);
      }
    } catch (err) {
      console.error('Failed to create lead:', err);
    }
  };

  const updateLead = async (leadId: string, data: Partial<Lead>) => {
    try {
      const response = await apiClient.updateLead(projectId, leadId, data);
      if (response.success && response.data) {
        setLeads(prev => prev.map(lead => 
          lead.id === leadId ? response.data! : lead
        ));
      }
    } catch (err) {
      console.error('Failed to update lead:', err);
    }
  };

  const deleteLead = async (leadId: string) => {
    try {
      await apiClient.deleteLead(projectId, leadId);
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  const refetch = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getLeads(projectId);
      if (response.success && response.data) {
        setLeads(response.data);
      }
    } catch (err) {
      console.error('Failed to refetch leads:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    leads,
    loading,
    error,
    createLead,
    updateLead,
    deleteLead,
    refetch,
  };
}
