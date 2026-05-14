/**
 * Database Service
 * Manages photo metadata and vector storage
 */

import * as SQLite from 'expo-sqlite/next';
import { Photo, PhotoQueryOptions, SearchResult, DBStats } from '@/types';
import { CREATE_TABLES } from './schema';

export class DBService {
  private _db: SQLite.SQLiteDatabase | null = null;
  private static _instance: DBService | null = null;

  static getInstance(): DBService {
    if (!DBService._instance) {
      DBService._instance = new DBService();
    }
    return DBService._instance;
  }

  async initialize(): Promise<void> {
    try {
      this._db = await SQLite.openDatabaseAsync('smartphoto.db');
      // 新版API: execAsync接受SQL字符串
      await this._db.execAsync(`
        CREATE TABLE IF NOT EXISTS photos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          uuid TEXT UNIQUE NOT NULL,
          filePath TEXT NOT NULL,
          thumbnailPath TEXT,
          createdAt DATETIME NOT NULL,
          modifiedAt DATETIME NOT NULL,
          width INTEGER,
          height INTEGER,
          embedding TEXT,
          isIndexed BOOLEAN DEFAULT 0,
          fileSize INTEGER
        );
        CREATE INDEX IF NOT EXISTS idx_photos_isIndexed ON photos(isIndexed);
        CREATE INDEX IF NOT EXISTS idx_photos_createdAt ON photos(createdAt);
      `);
      console.log('Database initialized');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw new Error('DB_INIT_FAILED');
    }
  }

  async close(): Promise<void> {
    if (this._db) {
      await this._db.closeAsync();
      this._db = null;
    }
  }

  async insertPhoto(photo: Photo): Promise<number> {
    if (!this._db) throw new Error('DB_NOT_INITIALIZED');

    const result = await this._db.runAsync(
      `INSERT INTO photos (uuid, filePath, thumbnailPath, createdAt, modifiedAt, width, height, embedding, isIndexed, fileSize) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        photo.uuid,
        photo.filePath,
        photo.thumbnailPath || null,
        photo.createdAt.toISOString(),
        photo.modifiedAt.toISOString(),
        photo.width || null,
        photo.height || null,
        photo.embedding ? JSON.stringify(photo.embedding) : null,
        photo.isIndexed ? 1 : 0,
        photo.fileSize || null,
      ]
    );
    return result.lastInsertRowId;
  }

  async insertPhotos(photos: Photo[]): Promise<number[]> {
    if (!this._db) throw new Error('DB_NOT_INITIALIZED');
    if (photos.length === 0) return [];

    await this._db.execAsync('BEGIN TRANSACTION');
    try {
      const ids: number[] = [];
      for (const photo of photos) {
        const result = await this._db.runAsync(
          `INSERT INTO photos (uuid, filePath, thumbnailPath, createdAt, modifiedAt, width, height, embedding, isIndexed, fileSize) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            photo.uuid,
            photo.filePath,
            photo.thumbnailPath || null,
            photo.createdAt.toISOString(),
            photo.modifiedAt.toISOString(),
            photo.width || null,
            photo.height || null,
            photo.embedding ? JSON.stringify(photo.embedding) : null,
            photo.isIndexed ? 1 : 0,
            photo.fileSize || null,
          ]
        );
        ids.push(result.lastInsertRowId);
      }
      await this._db.execAsync('COMMIT');
      return ids;
    } catch (error) {
      await this._db.execAsync('ROLLBACK');
      throw error;
    }
  }

  async getPhoto(id: number): Promise<Photo | null> {
    if (!this._db) throw new Error('DB_NOT_INITIALIZED');

    const row = await this._db.getFirstAsync<any>('SELECT * FROM photos WHERE id = ?', [id]);

    if (!row) return null;
    return this._rowToPhoto(row);
  }

  async getPhotoByUuid(uuid: string): Promise<Photo | null> {
    if (!this._db) throw new Error('DB_NOT_INITIALIZED');

    const row = await this._db.getFirstAsync<any>('SELECT * FROM photos WHERE uuid = ?', [uuid]);

    if (!row) return null;
    return this._rowToPhoto(row);
  }

  async getPhotos(options: PhotoQueryOptions = {}): Promise<Photo[]> {
    if (!this._db) throw new Error('DB_NOT_INITIALIZED');

    const { offset = 0, limit = 50, orderBy = 'createdAt', order = 'DESC', isIndexed } = options;

    let query = 'SELECT * FROM photos WHERE 1=1';
    const params: any[] = [];

    if (isIndexed !== undefined) {
      query += ' AND isIndexed = ?';
      params.push(isIndexed ? 1 : 0);
    }

    query += ` ORDER BY ${orderBy} ${order} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const rows = await this._db.getAllAsync<any>(query, params);
    return rows.map(row => this._rowToPhoto(row));
  }

  async updatePhoto(id: number, updates: Partial<Photo>): Promise<void> {
    if (!this._db) throw new Error('DB_NOT_INITIALIZED');

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.thumbnailPath !== undefined) {
      fields.push('thumbnailPath = ?');
      values.push(updates.thumbnailPath);
    }
    if (updates.embedding !== undefined) {
      fields.push('embedding = ?');
      values.push(JSON.stringify(updates.embedding));
    }
    if (updates.isIndexed !== undefined) {
      fields.push('isIndexed = ?');
      values.push(updates.isIndexed ? 1 : 0);
    }
    if (updates.width !== undefined) {
      fields.push('width = ?');
      values.push(updates.width);
    }
    if (updates.height !== undefined) {
      fields.push('height = ?');
      values.push(updates.height);
    }
    if (updates.fileSize !== undefined) {
      fields.push('fileSize = ?');
      values.push(updates.fileSize);
    }

    if (fields.length === 0) return;

    values.push(id);
    const query = `UPDATE photos SET ${fields.join(', ')} WHERE id = ?`;
    await this._db.runAsync(query, values);
  }

  async deletePhoto(id: number): Promise<void> {
    if (!this._db) throw new Error('DB_NOT_INITIALIZED');
    await this._db.runAsync('DELETE FROM photos WHERE id = ?', [id]);
  }

  async deletePhotos(ids: number[]): Promise<void> {
    if (!this._db) throw new Error('DB_NOT_INITIALIZED');
    if (ids.length === 0) return;

    const placeholders = ids.map(() => '?').join(',');
    await this._db.runAsync(`DELETE FROM photos WHERE id IN (${placeholders})`, ids);
  }

  async getUnindexedPhotos(limit: number = 100): Promise<Photo[]> {
    if (!this._db) throw new Error('DB_NOT_INITIALIZED');

    const rows = await this._db.getAllAsync<any>(
      'SELECT * FROM photos WHERE isIndexed = 0 ORDER BY createdAt DESC LIMIT ?',
      [limit]
    );
    return rows.map(row => this._rowToPhoto(row));
  }

  async searchByVector(
    query: number[],
    topK: number,
    threshold: number = 0.2
  ): Promise<SearchResult[]> {
    if (!this._db) throw new Error('DB_NOT_INITIALIZED');

    const allRows = await this._db.getAllAsync<any>('SELECT COUNT(*) as total, SUM(CASE WHEN isIndexed = 1 THEN 1 ELSE 0 END) as indexedCount, SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as withEmbedding FROM photos');
    console.log(`[Search] DB stats: total=${allRows[0]?.total}, indexed=${allRows[0]?.indexedCount}, hasEmbedding=${allRows[0]?.withEmbedding}`);

    const rows = await this._db.getAllAsync<any>('SELECT * FROM photos WHERE isIndexed = 1');
    const photos = rows.map(row => this._rowToPhoto(row));
    console.log(`[Search] Loaded ${photos.length} indexed photos from DB`);

    const mapped = photos
      .filter(p => p.embedding)
      .map(p => ({
        photo: p,
        similarity: this._cosineSimilarity(query, p.embedding!),
      }));
    console.log(`[Search] ${mapped.length} photos with valid embeddings, threshold=${threshold}`);
    if (mapped.length > 0) {
      const sims = mapped.map(r => r.similarity);
      console.log(`[Search] top similarity: ${Math.max(...sims)}, min: ${Math.min(...sims)}, avg: ${sims.reduce((a,b) => a+b, 0) / sims.length}`);
      console.log(`[Search] first 5 similarities: ${sims.slice(0,5).map(s => s.toFixed(4)).join(', ')}`);
    } else {
      console.log(`[Search] WARNING: No photos with embeddings found! Check if scan completed successfully.`);
    }
    const results = mapped
      .filter(r => r.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
    console.log(`[Search] after threshold=${threshold}: ${results.length} results`);

    return results;
  }

  async getPhotosCount(): Promise<number> {
    if (!this._db) return 0;
    const result = await this._db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM photos'
    );
    return result?.count || 0;
  }

  async getIndexedCount(): Promise<number> {
    if (!this._db) return 0;
    const result = await this._db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM photos WHERE isIndexed = 1'
    );
    return result?.count || 0;
  }

  async getStats(): Promise<DBStats> {
    const totalPhotos = await this.getPhotosCount();
    const indexedPhotos = await this.getIndexedCount();

    return {
      totalPhotos,
      indexedPhotos,
      unindexedPhotos: totalPhotos - indexedPhotos,
      databaseSize: 0,
    };
  }

  private _rowToPhoto(row: any): Photo {
    return {
      id: row.id,
      uuid: row.uuid,
      filePath: row.filePath,
      thumbnailPath: row.thumbnailPath,
      createdAt: new Date(row.createdAt),
      modifiedAt: new Date(row.modifiedAt),
      width: row.width,
      height: row.height,
      embedding: row.embedding ? JSON.parse(row.embedding) : undefined,
      isIndexed: row.isIndexed === 1,
      fileSize: row.fileSize,
    };
  }

  private _cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
