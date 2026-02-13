#!/usr/bin/env node

import { Sequelize, DataTypes } from 'sequelize';
import dbConfig from './dist/src/config/database.js';

async function debugLastBall() {
  try {
    console.log('🔍 Debugging last ball and over change...\n');
    
    const matchId = process.argv[2] || '59b0004f-ed60-47f1-b643-bfaefb6d0e3f';
    
    console.log(`📋 Match ID: ${matchId}\n`);
    
    // Create sequelize connection
    const sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      dbConfig
    );
    
    console.log('🔗 Connecting to database...');
    await sequelize.authenticate();
    console.log('✅ Connected\n');
    
    // Query balls directly
    const balls = await sequelize.query(
      `SELECT * FROM balls WHERE "matchId" = :matchId ORDER BY "over" ASC, "ballNumber" ASC`,
      {
        replacements: { matchId },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    
    console.log(`⚾ Total Balls Recorded: ${balls.length}\n`);
    
    if (balls.length === 0) {
      console.log('No balls recorded yet');
      await sequelize.close();
      process.exit(0);
    }
    
    // Show last 5 balls
    console.log('📍 Last 5 Balls:');
    const lastBalls = balls.slice(-5);
    lastBalls.forEach((ball, idx) => {
      console.log(`  ${idx + 1}. Over ${ball.over}.${ball.ballNumber}:`);
      console.log(`     Batsman: ${ball.batsmanId}`);
      console.log(`     Bowler: ${ball.bowlerId}`);
      console.log(`     Runs: ${ball.runs}, Extra Runs: ${ball.extraRuns}`);
      console.log(`     Wicket: ${ball.isWicket ? `Yes (${ball.wicketType})` : 'No'}`);
      console.log(`     Extras: ${ball.extras}`);
      console.log(`     Legal Ball #: ${ball.legalBallNumber}`);
      console.log('');
    });
    
    // Analyze last ball
    const lastBall = balls[balls.length - 1];
    console.log('🎯 Last Ball Analysis:');
    console.log(`  Over: ${lastBall.over}, Ball: ${lastBall.ballNumber}`);
    console.log(`  Total Runs: ${lastBall.runs + lastBall.extraRuns}`);
    
    if (lastBall.ballNumber === 6) {
      console.log('  ✅ Over is COMPLETE (ball 6)');
      console.log('  🔄 Next over should be: Over ' + (lastBall.over + 1) + ', Ball 1');
      
      // Check what should happen
      const totalRuns = lastBall.runs + lastBall.extraRuns;
      if (totalRuns % 2 === 1) {
        console.log('  ⚡ Odd runs detected - STRIKE CHANGES');
      } else {
        console.log('  ⚡ Even runs detected - STRIKE STAYS');
      }
      console.log('  🔄 BOWLER MUST CHANGE');
    } else {
      console.log(`  ⏳ Over is NOT complete (ball ${lastBall.ballNumber}/6)`);
      console.log(`  🔄 Next ball should be: Over ${lastBall.over}, Ball ${lastBall.ballNumber + 1}`);
    }
    
    console.log('\n✅ Debug complete');
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

debugLastBall();
