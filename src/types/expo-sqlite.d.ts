declare module 'expo-sqlite' {
  export interface Query {
    sql: string;
    args: any[];
  }

  export interface ResultSet {
    insertId?: number;
    rowsAffected: number;
    rows: any[];
  }

  export interface ResultSetError {
    error: Error;
  }

  export interface SQLiteDatabase {
    execAsync(queries: Query[], readOnly: boolean): Promise<(ResultSetError | ResultSet)[]>;
    getAllAsync<T>(sql: string, params?: any[]): Promise<T[]>;
    getFirstAsync<T>(sql: string, params?: any[]): Promise<T | null>;
    runAsync(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowId: number }>;
    closeAsync(): Promise<void>;
  }

  export function openDatabase(name: string): SQLiteDatabase;
}
