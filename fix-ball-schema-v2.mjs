#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dbConfig from './dist/src/config/database.js';

async function fixBallSchema() {
  try {
    console.log('🔧 Fixing Ball table schema...\n');
    
    const sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      dbConfig
    );
    
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected\n');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // Check current schema
    console.log('📋 Checking current schema...');
    const tableInfo = await queryInterface.describeTable('balls');
    
    console.log('Current legalBallNumber column:');
    console.log(`  Type: ${tableInfo.legalBallNumber.type}`);
    console.log(`  Allow NULL: ${tableInfo.legalBallNumber.allowNull}`);
    console.log(`  Default: ${tableInfo.legalBallNumber.defaultValue}\n`);
    
    if (tableInfo.legalBallNumber.allowNull === false) {
      console.log('⚠️  Column does NOT allow NULL - fixing...\n');
      
      // Modify the column to allow NULL
      await queryInterface.changeColumn('balls', 'legalBallNumber', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: null,
      });
      
      console.log('✅ Updated legalBallNumber to allow NULL\n');
    } else {
      console.log('✅ Column already allows NULL - no changes needed\n');
    }
    
    // Verify the change
    const updatedInfo = await queryInterface.describeTable('balls');
    console.log('Updated legalBallNumber column:');
    console.log(`  Type: ${updatedInfo.legalBallNumber.type}`);
    console.log(`  Allow NULL: ${updatedInfo.legalBallNumber.allowNull}`);
    console.log(`  Default: ${updatedInfo.legalBallNumber.defaultValue}\n`);
    
    console.log('✅ Schema fix complete!');
    console.log('\n📝 Next steps:');
    console.log('  1. Restart the backend: npm start');
    console.log('  2. Try recording a ball again');
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixBallSchema();
