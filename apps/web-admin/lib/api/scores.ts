import axios from 'axios';
import { getAuthToken, handleAuthFailure } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

const getHeaders = () => {
  return {
    withCredentials: true,
  };
};

export const getTournamentScores = async (tournamentId: string) => {
  try {
    let allScores: any[] = [];
    let skip = 0;
    const take = 5000;
    let hasMore = true;

    while (hasMore) {
      const response = await axios.get(`${API_URL}/scores/tournament/${tournamentId}?skip=${skip}&take=${take}`, getHeaders());
      const data = response.data;
      if (Array.isArray(data)) {
        allScores = allScores.concat(data);
        if (data.length < take) {
          hasMore = false;
        } else {
          skip += take;
        }
      } else {
        hasMore = false;
      }
    }
    return allScores;
  } catch (error: any) {
    if (error.response?.status === 401) {
      await handleAuthFailure(error.response);
    }
    throw error;
  }
};

export const getPublicLeaderboardData = async (tournamentId: string) => {
  try {
    const response = await axios.get(`${API_URL}/scores/tournament/${tournamentId}/leaderboard-data`, getHeaders());
    return response.data;
  } catch (error: any) {
    throw error;
  }
};
