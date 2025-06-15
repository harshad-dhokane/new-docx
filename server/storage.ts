import { type profiles } from '@shared/schema';

type Profile = typeof profiles.$inferSelect;
type InsertProfile = typeof profiles.$inferInsert;

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<Profile | undefined>;
  getUserByUsername(username: string): Promise<Profile | undefined>;
  createUser(user: InsertProfile): Promise<Profile>;
}

export class MemStorage implements IStorage {
  private users: Map<string, Profile>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<Profile | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<Profile | undefined> {
    return Array.from(this.users.values()).find(user => user.displayName === username);
  }

  async createUser(profile: InsertProfile): Promise<Profile> {
    const id = crypto.randomUUID();
    const user: Profile = {
      ...profile,
      id,
      avatarUrl: profile.avatarUrl ?? null,
      displayName: profile.displayName ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
