import { API_BASE_URL } from '@/lib/config/api';

export interface GameHistoryResponse {
  sessions: Array<{
    sessionId: number;
    gameType: string;
    duration: number;
    createdAt: string;
    startTime: string;
    endTime: string;
    status: string;
    winner: {
      id: string;
      username: string;
      clickCount: number;
    };
    winningMeal: {
      mealId: number;
      name: string;
      description: string;
    } | null;
    participantCount: number;
  }>;
  total: number;
  limit: number;
  offset: number;
}

export interface GameSessionDetails {
  sessionId: number;
  gameType: string;
  duration: number;
  status: string;
  createdAt: string;
  startTime: string;
  endTime: string;
  host: {
    id: string;
    username: string;
  };
  winner: {
    id: string;
    username: string;
    clickCount: number;
  } | null;
  winningMeal: {
    mealId: number;
    name: string;
    description: string;
    foods: Array<{
      foodId: number;
      name: string;
      quantity: number;
      unit: string;
      kcalsPer100g: number;
    }>;
  } | null;
  participants: Array<{
    participantId: number;
    profile: {
      id: string;
      username: string;
    };
    proposedMeal: {
      mealId: number;
      name: string;
      description: string;
      foods: Array<{
        foodId: number;
        name: string;
        quantity: number;
        unit: string;
        kcalsPer100g: number;
      }>;
    } | null;
    clickCount: number;
    isReady: boolean;
    hasSubmitted: boolean;
    joinedAt: string;
    submittedAt: string | null;
    mealPortions: Array<{
      mealId: number;
      mealName: string;
      mealPortionId: number;
      consumedAt: string;
      foodPortions: Array<{
        foodId: number;
        name: string;
        gramsConsumed: number;
        kcalsConsumed: number;
      }>;
    }>;
  }>;
}

export class GameHistoryService {
  /**
   * Get game history for a group
   */
  static async getGroupGameHistory(
    groupId: number,
    limit: number = 10,
    offset: number = 0
  ): Promise<GameHistoryResponse> {
    const response = await fetch(
      `${API_BASE_URL}/game-history/group/${groupId}?limit=${limit}&offset=${offset}`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch game history: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get detailed information about a specific game session
   */
  static async getGameSessionDetails(sessionId: number): Promise<GameSessionDetails> {
    const response = await fetch(`${API_BASE_URL}/game-history/session/${sessionId}`);

    if (!response.ok) {
      throw new Error(`Failed to fetch game session details: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Register meal portion consumed by a participant
   */
  static async registerGameMealPortion(
    sessionId: number,
    profileId: string,
    mealId: number,
    foodPortions: Array<{
      foodId: number;
      gramsConsumed: number;
      kcalsConsumed: number;
    }>
  ): Promise<{ success: boolean; mealPortion: unknown }> {
    const response = await fetch(
      `${API_BASE_URL}/game-history/session/${sessionId}/register-portion`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profileId,
          mealId,
          foodPortions,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to register meal portion');
    }

    return response.json();
  }
}
