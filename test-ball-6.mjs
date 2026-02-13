#!/usr/bin/env node

import { Sequelize } from 'sequelize';
import dbConfig from './dist/src/config/database.js';

async function testBall6() {
  try {
    console.log('🧪 Testing Ball 6 After Wicket...\n');
    
    const matchId = '59b0004f-ed60-47f1-b643-bfaefb6d0e3f';
    
    // Create sequelize connection
    const sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      dbConfig
    );
    
    await sequelize.authenticate();
    
    // Get all balls
    const balls = await sequelize.query(
      `SELECT * FROM balls WHERE "matchId" = :matchId ORDER BY "over" ASC, "ballNumber" ASC`,
      {
        replacements: { matchId },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    
    const lastBall = balls[balls.length - 1];
    console.log('📍 Last Ball (Ball 5):');
    console.log(`  Over: ${lastBall.over}, Ball: ${lastBall.ballNumber}`);
    console.log(`  Batsman: ${lastBall.batsmanId}`);
    console.log(`  Bowler: ${lastBall.bowlerId}`);
    console.log(`  Runs: ${lastBall.runs}`);
    console.log(`  Wicket: ${lastBall.isWicket} (${lastBall.wicketType})\n`);
    
    // Get match info
    const matchInfo = await sequelize.query(
      `SELECT "teamAId", "teamBId", "tossChoice", "teamABattingOrder", "teamBBattingOrder", "teamAPlaying11", "teamBPlaying11" FROM matches WHERE id = :matchId`,
      {
        replacements: { matchId },
        type: sequelize.QueryTypes.SELECT,
      }
    );
    
    const match = matchInfo[0];
    console.log('📋 Match Info:');
    console.log(`  Toss Choice: ${match.tossChoice}`);
    
    // Determine batting team
    const battingTeamId = match.tossChoice === 'bat' ? match.teamAId : match.teamBId;
    const battingOrder = battingTeamId === match.teamAId ? match.teamABattingOrder : match.teamBBattingOrder;
    
    console.log(`  Batting Team: ${battingTeamId}`);
    console.log(`  Batting Order: ${JSON.stringify(battingOrder)}\n`);
    
    // Get out batsmen
    const outBatsmen = balls
      .filter(b => b.isWicket)
      .map(b => b.batsmanId);
    
    console.log('🔴 Out Batsmen:');
    outBatsmen.forEach(id => console.log(`  - ${id}`));
    console.log('');
    
    // Find next available batsman
    console.log('🔍 Finding Next Available Batsman:');
    let nextBatsman = null;
    for (const playerId of battingOrder) {
      const isOut = outBatsmen.includes(playerId);
      const isCurrentStriker = playerId === lastBall.batsmanId;
      const isNonStriker = playerId === balls[balls.length - 2]?.batsmanId;
      
      console.log(`  ${playerId}:`);
      console.log(`    Out: ${isOut}`);
      console.log(`    Current Striker: ${isCurrentStriker}`);
      console.log(`    Non-Striker: ${isNonStriker}`);
      
      if (!isOut && playerId !== lastBall.batsmanId) {
        if (!nextBatsman) {
          nextBatsman = playerId;
          console.log(`    ✅ NEXT BATSMAN`);
        }
      }
      console.log('');
    }
    
    if (!nextBatsman) {
      console.log('❌ No next batsman found!');
    } else {
      console.log(`✅ Next Batsman for Ball 6: ${nextBatsman}\n`);
    }
    
    // Analyze Ball 6
    console.log('📊 Ball 6 Analysis:');
    console.log(`  Over: 2, Ball: 6`);
    console.log(`  Batsman: ${nextBatsman || 'UNKNOWN'}`);
    console.log(`  Bowler: ${lastBall.bowlerId} (same)`);
    console.log(`  Runs: Any value 0-6`);
    console.log(`  Wicket: false (no wicket on this ball)`);
    console.log(`  Extras: none`);
    console.log(`  Extra Runs: 0\n`);
    
    // Strike change analysis
    console.log('⚡ Strike Change for Ball 6:');
    console.log(`  Last ball runs: ${lastBall.runs} (even)`);
    console.log(`  Last ball wicket: YES`);
    console.log(`  Result: New batsman on strike (wicket overrides runs rule)`);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testBall6();
