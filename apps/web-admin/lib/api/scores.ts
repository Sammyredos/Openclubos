import axios from 'axios';
import { getAuthToken, handleAuthFailure } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const getHeaders = () => {
  const token = getAuthToken();
  return {
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};

export const getGroupScores = async (groupId: string) => {
  try {
    const response = await axios.get(`${API_URL}/scores/group/${groupId}`, getHeaders());
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      await handleAuthFailure(error.response);
    }
    throw error;
  }
};

export const getTournamentScores = async (tournamentId: string) => {
  try {
    const response = await axios.get(`${API_URL}/scores/tournament/${tournamentId}`, getHeaders());
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      await handleAuthFailure(error.response);
    }
    throw error;
  }
};

export const overrideScore = async (scoreId: string, data: { strokes: number; putts?: number; points?: number }) => {
  try {
    const response = await axios.patch(`${API_URL}/scores/${scoreId}/override`, data, getHeaders());
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      await handleAuthFailure(error.response);
    }
    throw error;
  }
};

export const confirmScore = async (scoreId: string) => {
  try {
    const response = await axios.post(`${API_URL}/scores/${scoreId}/confirm`, {}, getHeaders());
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      await handleAuthFailure(error.response);
    }
    throw error;
  }
};
