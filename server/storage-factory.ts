import { IStorage } from "./storage";
import { DatabaseStorage } from "./database-storage";
import { MemStorage } from "./storage";
import dotenv from "dotenv";
dotenv.config();
// This factory class is responsible for creating and managing the storage instance.
// It checks the environment variables to determine whether to use a database or in-memory storage.

class StorageFactory {
  private static instance: IStorage;

  public static getStorage(): IStorage {
    if (!StorageFactory.instance) {
      StorageFactory.instance = StorageFactory.createStorage();
    }
    return StorageFactory.instance;
  }

  private static createStorage(): IStorage {
    const useDatabase = process.env.DATABASE_URL ? true : false;
    
    if (useDatabase) {
      console.log("Using DatabaseStorage");
      return new DatabaseStorage();
    } else {
      console.log("Using MemStorage");
      return new MemStorage();
    }
  }
}

// Environment Validation
if (process.env.DATABASE_URL) {
    console.log("Database configuration found");
} else {
    console.warn("No DATABASE_URL found - using in-memory storage");
    console.warn("Note: Data will not persist between server restarts!");
}

// Export a singleton instance
export const storage = StorageFactory.getStorage();