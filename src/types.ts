export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  passageOrTopic?: string;
  translation?: string;
}

export interface StudyOptions {
  passageOrTopic: string;
  translationPreference?: string;
  targetAudience?: string;
  timeEstimate?: string;
}

export interface SavedStudy {
  id: string;
  title: string;
  passageOrTopic: string;
  content: string;
  createdAt: string;
  translation?: string;
}

export interface QuickSuggestion {
  passage: string;
  title: string;
  testament: 'AT' | 'NT';
  category: string;
}

export interface RecentSearch {
  passageOrTopic: string;
  translation?: string;
  timestamp: string;
}

export interface PersonalNote {
  passageOrTopic: string;
  note: string;
  updatedAt: string;
}
