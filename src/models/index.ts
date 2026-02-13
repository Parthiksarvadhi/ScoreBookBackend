/**
 * Database Models Index
 * Loads and initializes all Sequelize models
 */

import fs from 'fs';
import path from 'path';
import { Sequelize, DataTypes } from 'sequelize';
import { fileURLToPath, pathToFileURL } from 'url';
import dbConfig from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const basename = path.basename(__filename);

interface DbInterface {
  sequelize: Sequelize | null;
  Sequelize: typeof Sequelize;
  [key: string]: any;
}

const db: DbInterface = {
  sequelize: null,
  Sequelize,
};

let sequelize: Sequelize;
if ((dbConfig as any).use_env_variable) {
  sequelize = new Sequelize(process.env[(dbConfig as any).use_env_variable]!, dbConfig as any);
} else {
  sequelize = new Sequelize(
    (dbConfig as any).database!,
    (dbConfig as any).username!,
    (dbConfig as any).password!,
    dbConfig as any
  );
}

const files = fs
  .readdirSync(__dirname)
  .filter((file: string) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file !== 'index.js' &&
      file !== 'index.ts' &&
      // Check for .js or .ts, but EXCLUDE .d.ts and .map files
      (file.slice(-3) === '.js' || file.slice(-3) === '.ts') &&
      !file.endsWith('.d.ts') && 
      !file.endsWith('.js.map') &&
      file.indexOf('.test.') === -1
    );
  });

// Initialize models asynchronously
const initializeModels = async () => {
  for (const file of files) {
    try {
      const modelPath = pathToFileURL(path.join(__dirname, file)).href;
      const modelModule = await import(modelPath);
      const model = modelModule.default(sequelize, DataTypes);
      if (model && model.name) {
        db[model.name] = model;
      }
    } catch (error) {
      console.error(`Error loading model ${file}:`, error);
    }
  }

  // Set up associations
  Object.keys(db).forEach((modelName: string) => {
    if (db[modelName] && db[modelName].associate) {
      db[modelName].associate(db);
    }
  });

  db.sequelize = sequelize;
};

// Start initialization but don't await at module level
initializeModels().catch((error) => {
  console.error('Failed to initialize models:', error);
});

export default db;
