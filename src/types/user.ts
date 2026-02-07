export interface UserType {
  _id: string;
  nullifierHash: string;
  reputationScore: number;
  createdAt: Date;
  lastActive: Date;
}

export interface CreateUserInput {
  nullifierHash: string;
}
