export interface RumorType {
  _id: string;
  content: string;
  submitterNullifier: string;
  truthScore: number;
  totalVotes: number;
  status: 'active' | 'deleted' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRumorInput {
  content: string;
  submitterNullifier: string;
}

export interface RumorWithAge extends RumorType {
  ageHours: number;
}
