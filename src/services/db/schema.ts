/**
 * @fileoverview 数据库Schema定义
 * @description 定义照片表的SQL结构
 */

export const CREATE_TABLES = `
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
`;

export const DROP_TABLES = `
DROP TABLE IF EXISTS photos;
`;
