import {test} from 'node:test';import assert from 'node:assert/strict';import {stickVector,lookDelta,pixelRatio} from '../src/mobile-input.mjs';
test('thumbstick rejects thumb jitter and preserves analog control',()=>{assert.deepEqual(stickVector(2,3),{x:0,y:0});const v=stickVector(29,0);assert.ok(v.x>0&&v.x<.5);assert.equal(v.y,0);});
test('thumbstick bounds diagonals and uses forward-up convention',()=>{const v=stickVector(120,-120);assert.ok(Math.abs(Math.hypot(v.x,v.y)-1)<1e-9);assert.ok(v.x>0&&v.y>0);});
test('look sensitivity scales and bounds drag response',()=>{assert.equal(lookDelta(10,10,2).yaw,lookDelta(10,10,1).yaw*2);assert.deepEqual(lookDelta(10,10,20),lookDelta(10,10,2));});
test('graphics tiers cap high-density phone rendering',()=>{assert.equal(pixelRatio('auto',3,true),1.25);assert.equal(pixelRatio('battery',3,true),1);assert.equal(pixelRatio('high',3,true),1.75);assert.equal(pixelRatio('high',1,false),1);});
