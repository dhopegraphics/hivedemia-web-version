import { RealtimeChannel } from "@supabase/supabase-js";


export interface Competition {
  id: number;
  title: string;
}
export interface CompetitionState {
  updateCompetitionStatus: (
    competitionId: number,
    status: string
  ) => Promise<void>;
  competitions: any[];
  currentCompetition: any | null;
  competitionTopics: any[];
  competitionQuestions: any[];
  questionAnswers: any[];
  competitionParticipants: any[];
  participantAnswers: any[];
  fetchAllQuestionAnswers: (competitionId: number) => Promise<void>;
  availableUsers: any[];
  allFetchedUsers: any[];
  extractedTopics: any[];
  isLoading: boolean;
  error: string | null;
  subscription: RealtimeChannel | null;
  questionAnswersByQuestionId: Record<number, any[]>;
  updateParticipantStatus: (params: {
    participantId: number;
    userId: string;
    competitionId: number;
    hasJoined?: boolean;
    completed?: boolean;
    score?: number;
  }) => Promise<void>;

  ensureParticipantJoined: (
    userId: string,
    competitionId: number
  ) => Promise<number>;

  createCompetition: (competitionData: {
    title: string;
    subject: string;
    questionCount: number;
    timePerQuestion: number;
    maxParticipants: number;
    difficulty: string;
    isPrivate: boolean;
    allowMidJoin: boolean;
    showLeaderboard: boolean;
    duration: number;
    topics: number[];
    invitedUsers?: string[];
  }) => Promise<string>;
  fetchAvailableUsers: (searchQuery?: string) => Promise<void>;

  getCompetitionDetails: (competitionId: number) => Promise<void>;
  getMyCompetitions: (userId: string) => Promise<void>;
  generateCompetitionQuestions: (competitionData: {
    title: string;
    subject: string;
    topics: string[];
    questionCount: number;
    difficulty: string;
  }) => Promise<any[]>;
  submitAnswer: (params: {
    participantId: number;
    questionId: number;
    answerId: number;
    timeTaken: number;
  }) => Promise<void>;
  fetchExtractedTopics: (coursefileId?: number) => Promise<void>;
  fetchQuestionAnswers: (questionId: number) => Promise<void>;
  subscribeToCompetitionUpdates: (competitionId: number) => void;
  cleanupSubscriptions: () => void;
}
