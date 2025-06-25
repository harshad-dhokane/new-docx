import { profiles, type Profile, type InsertProfile } from '../shared/schema';

// Updated interface to work with profiles instead of users
export interface IStorage {
  getProfile(id: string): Promise<Profile | undefined>;
  getProfileByDisplayName(displayName: string): Promise<Profile | undefined>;
  createProfile(profile: InsertProfile): Promise<Profile>;
}

export class MemStorage implements IStorage {
  private profiles: Map<string, Profile>;

  constructor() {
    this.profiles = new Map();
  }

  async getProfile(id: string): Promise<Profile | undefined> {
    return this.profiles.get(id);
  }

  async getProfileByDisplayName(displayName: string): Promise<Profile | undefined> {
    return Array.from(this.profiles.values()).find(
      (profile) => profile.displayName === displayName
    );
  }

  async createProfile(insertProfile: InsertProfile): Promise<Profile> {
    const id = crypto.randomUUID();
    const profile: Profile = {
      ...insertProfile,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      avatarUrl: insertProfile.avatarUrl === undefined ? null : insertProfile.avatarUrl,
      displayName: insertProfile.displayName === undefined ? null : insertProfile.displayName,
    };
    this.profiles.set(id, profile);
    return profile;
  }
}

export const storage = new MemStorage();
