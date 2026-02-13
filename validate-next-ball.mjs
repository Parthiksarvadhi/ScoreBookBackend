#!/usr/bin/env node

import db from './dist/src/models/index.js';

async function validateNextBall() {
  try {
    console.log('🔍 Validating next ball data...\n');
    
    const matchId = process.argv[2] || '59b0004f-ed60-47f1-b643-bfaefb6d0e3f';
    const over = parseInt(process.argv[3]) || 2;
    const ballNumber = parseInt(process.argv[4]) || 1;
    const batsmanId = process.argv[5];
    const bowlerId = process.argv[6];
    
    console.log(`📋 Match ID: ${matchId}`);
    console.log(`🎯 Validating: Over ${over}, Ball ${ballNumber}`);
    console.log(`   Batsman: ${batsmanId}`);
    console.log(`   Bowler: ${bowlerId}\n`);
    
    // Get match
    const match = await db.Match.findByPk(matchId);
    if (!match) {
      console.log('❌ Match not found');
      process.exit(1);
    }
    
    // Get all balls
    const balls = await db.Ball.findAll({
      where: { matchId },
      order: [['over', 'ASC'], ['ballNumber', 'ASC']],
      raw: true,
    });
    
    console.log(`📊 Total balls recorded: ${balls.length}\n`);
    
    if (balls.length === 0) {
      console.log('✅ First ball - no validation needed');
      process.exit(0);
    }
    
    const lastBall = balls[balls.length - 1];
    console.log('📍 Last Ball:');
    console.log(`  Over ${lastBall.over}.${lastBall.ballNumber}`);
    console.log(`  Batsman: ${lastBall.batsmanId}`);
    console.log(`  Bowler: ${lastBall.bowlerId}`);
    console.log(`  Runs: ${lastBall.runs}, Extra: ${lastBall.extraRuns}\n`);
    
    // Validation checks
    console.log('🔍 Validation Checks:\n');
    
    let isValid = true;
    
    // Check 1: Ball number sequence
    if (ballNumber === 1 && over > 1) {
      console.log('✅ Check 1: New over starting');
      
      // Check if last ball was ball 6
      if (lastBall.ballNumber !== 6) {
        console.log('   ❌ ERROR: Last ball should be ball 6, but it\'s ball ' + lastBall.ballNumber);
        isValid = false;
      } else {
        console.log('   ✅ Last ball was ball 6 (over complete)');
      }
      
      // Check bowler change
      if (bowlerId === lastBall.bowlerId) {
        console.log('   ❌ ERROR: Bowler must change! Same bowler cannot bowl consecutive overs');
        console.log(`      Current bowler: ${bowlerId}`);
        console.log(`      Previous bowler: ${lastBall.bowlerId}`);
        isValid = false;
      } else {
        console.log('   ✅ Bowler changed correctly');
      }
      
      // Check strike change
      const totalRuns = lastBall.runs + lastBall.extraRuns;
      if (totalRuns % 2 === 1) {
        console.log('   ✅ Odd runs on last ball - strike should change');
        if (batsmanId === lastBall.batsmanId) {
          console.log('   ❌ ERROR: Batsman should change after odd runs');
          isValid = false;
        } else {
          console.log('   ✅ Batsman changed correctly');
        }
      } else {
        console.log('   ✅ Even runs on last ball - strike should stay');
        if (batsmanId !== lastBall.batsmanId) {
          console.log('   ❌ ERROR: Batsman should NOT change after even runs');
          isValid = false;
        } else {
          console.log('   ✅ Batsman stayed correctly');
        }
      }
    } else if (ballNumber > 1 && over === lastBall.over) {
      console.log('✅ Check 1: Same over, next ball');
      
      if (ballNumber !== lastBall.ballNumber + 1) {
        console.log(`   ❌ ERROR: Ball number should be ${lastBall.ballNumber + 1}, but got ${ballNumber}`);
        isValid = false;
      } else {
        console.log(`   ✅ Ball number sequence correct`);
      }
      
      // Check strike change within over
      const totalRuns = lastBall.runs + lastBall.extraRuns;
      if (totalRuns % 2 === 1) {
        console.log('   ✅ Odd runs - strike should change');
        if (batsmanId === lastBall.batsmanId) {
          console.log('   ❌ ERROR: Batsman should change after odd runs');
          isValid = false;
        } else {
          console.log('   ✅ Batsman changed correctly');
        }
      } else {
        console.log('   ✅ Even runs - strike should stay');
        if (batsmanId !== lastBall.batsmanId) {
          console.log('   ❌ ERROR: Batsman should NOT change after even runs');
          isValid = false;
        } else {
          console.log('   ✅ Batsman stayed correctly');
        }
      }
    }
    
    console.log('\n' + (isValid ? '✅ All checks passed!' : '❌ Validation failed!'));
    process.exit(isValid ? 0 : 1);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

validateNextBall();
