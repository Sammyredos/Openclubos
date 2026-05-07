import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const getGroupScores = async (groupId: string) => {
  const response = await axios.get(`${API_URL}/scores/group/${groupId}`);
  return response.data;
};

export const getTournamentScores = async (tournamentId: string) => {
  const response = await axios.get(`${API_URL}/scores/tournament/${tournamentId}`);
  return response.data;
};

export const overrideScore = async (scoreId: string, data: { strokes: number; putts?: number; points?: number }) => {
  const response = await axios.patch(`${API_URL}/scores/${scoreId}/override`, data);
  return response.data;
};

export const confirmScore = async (scoreId: string) => {
  const response = await axios.post(`${API_URL}/scores/${scoreId}/confirm`);
  return response.data;
};
