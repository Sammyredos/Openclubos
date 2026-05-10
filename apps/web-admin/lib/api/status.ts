import axios from 'axios';
import { ApiResponse, SystemStatus } from '@openclubos/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const getSystemStatus = async (): Promise<ApiResponse<SystemStatus>> => {
  try {
    const response = await axios.get<SystemStatus>(`${API_URL}/status`);
    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};
