import axios from 'axios';
import {
  EvaluationResponse, EvaluationListItem, EquipmentItem, PolicySummary,
  PolicyDetail, PolicyGapItem, ParameterStats, ParameterProbability,
  OptimizationResponse, DashboardResponse, AuditLogItem, RiskRule
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Evaluation
  evaluateOperation: async (payload: {
    natural_language_request?: string;
    equipment_code?: string;
    operation_type?: string;
    parameters?: Record<string, number>;
    requested_by?: string;
  }): Promise<EvaluationResponse> => {
    const res = await client.post('/evaluate', payload);
    return res.data;
  },

  getEvaluationHistory: async (limit = 50): Promise<EvaluationListItem[]> => {
    const res = await client.get(`/evaluate/history?limit=${limit}`);
    return res.data;
  },

  getEvaluationDetail: async (id: number): Promise<EvaluationResponse> => {
    const res = await client.get(`/evaluate/${id}`);
    return res.data;
  },

  // Equipment
  getEquipmentList: async (): Promise<EquipmentItem[]> => {
    const res = await client.get('/equipment');
    return res.data;
  },

  getEquipmentDetail: async (idOrCode: string | number): Promise<EquipmentItem> => {
    const res = await client.get(`/equipment/${idOrCode}`);
    return res.data;
  },

  createEquipment: async (data: any): Promise<EquipmentItem> => {
    const res = await client.post('/equipment', data);
    return res.data;
  },

  // Policies
  getPolicies: async (): Promise<PolicySummary[]> => {
    const res = await client.get('/policies');
    return res.data;
  },

  getPolicyDetail: async (id: number): Promise<PolicyDetail> => {
    const res = await client.get(`/policies/${id}`);
    return res.data;
  },

  createPolicy: async (data: any): Promise<PolicyDetail> => {
    const res = await client.post('/policies', data);
    return res.data;
  },

  activatePolicyVersion: async (policyId: number, versionId: number): Promise<any> => {
    const res = await client.put(`/policies/${policyId}/versions/${versionId}/activate`);
    return res.data;
  },

  createPolicyVersion: async (policyId: number, data: any): Promise<any> => {
    const res = await client.post(`/policies/${policyId}/versions`, data);
    return res.data;
  },

  updateThreshold: async (thresholdId: number, data: any): Promise<any> => {
    const res = await client.put(`/policies/thresholds/${thresholdId}`, data);
    return res.data;
  },

  // Policy Gaps
  getGaps: async (status?: string): Promise<PolicyGapItem[]> => {
    const url = status ? `/gaps?status=${status}` : '/gaps';
    const res = await client.get(url);
    return res.data;
  },

  updateGap: async (id: number, data: any): Promise<PolicyGapItem> => {
    const res = await client.put(`/gaps/${id}`, data);
    return res.data;
  },

  createGap: async (data: any): Promise<PolicyGapItem> => {
    const res = await client.post('/gaps', data);
    return res.data;
  },

  // Analytics
  getStatistics: async (equipmentCode: string, parameter: string): Promise<ParameterStats> => {
    const res = await client.get(`/statistics/${equipmentCode}/${parameter}`);
    return res.data;
  },

  getProbability: async (equipmentCode: string, parameter: string): Promise<ParameterProbability> => {
    const res = await client.get(`/probability/${equipmentCode}/${parameter}`);
    return res.data;
  },

  // Optimization
  runOptimization: async (payload: {
    equipment_code: string;
    current_rpm?: number;
    target_flow_rate?: number;
    current_pressure?: number;
    current_bearing_temperature?: number;
    current_vibration?: number;
    objective?: string;
  }): Promise<OptimizationResponse> => {
    const res = await client.post('/optimization', payload);
    return res.data;
  },

  // Dashboard
  getDashboard: async (): Promise<DashboardResponse> => {
    const res = await client.get('/dashboard');
    return res.data;
  },

  // Audit Logs & Rules
  getAuditLogs: async (limit = 100, eventType?: string): Promise<AuditLogItem[]> => {
    const url = eventType ? `/audit-logs?limit=${limit}&event_type=${eventType}` : `/audit-logs?limit=${limit}`;
    const res = await client.get(url);
    return res.data;
  },

  getRules: async (): Promise<RiskRule[]> => {
    const res = await client.get('/rules');
    return res.data;
  },

  updateRule: async (id: number, data: any): Promise<RiskRule> => {
    const res = await client.put(`/rules/${id}`, data);
    return res.data;
  }
};
