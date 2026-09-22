import test from 'node:test';
import assert from 'node:assert/strict';
import { getFlowFrame, findEndpointNode } from './diagram-flow.mjs';

test('keeps the packet hidden during gaps instead of starting the next edge backwards', () => {
  const steps = [{ms:700}, {ms:900}];
  assert.deepEqual(getFlowFrame(steps, 750, 150), {index:-1, progress:0});
  assert.deepEqual(getFlowFrame(steps, 850, 150), {index:1, progress:0});
  assert.deepEqual(getFlowFrame(steps, 1800, 150), {index:-1, progress:0});
});
test('never produces a negative or overflowing packet position', () => {
  for (let elapsed=0; elapsed<4000; elapsed+=13) {
    const frame=getFlowFrame([{ms:700},{ms:900}], elapsed, 150);
    assert.ok(frame.progress>=0 && frame.progress<=1);
  }
});
test('matches the edge of a wide connected node rather than a nearby node center', () => {
  const wide={x:24,y:116,width:394,height:40};
  const other={x:24,y:46,width:180,height:40};
  assert.equal(findEndpointNode([wide,other],114,116),wide);
});
test('does not light an unrelated node when an arrow ends at a group boundary', () => {
  assert.equal(findEndpointNode([{x:440,y:144,width:152,height:26}],648,116),null);
});
test('selects the smaller node when a containing group also matches', () => {
  const group={x:0,y:0,width:720,height:300};
  const node={x:20,y:20,width:120,height:40};
  assert.equal(findEndpointNode([group,node],140,40),node);
});

test('prefers a nearby node edge over the interior of its containing group', () => {
  const group={group:true,x:0,y:0,width:720,height:300};
  const node={x:20,y:20,width:120,height:40};
  assert.equal(findEndpointNode([group,node],144,40),node);
});

test('lights the receiver only after the packet reaches the endpoint, then holds it there', async () => {
  const { getPacketState } = await import('./diagram-flow.mjs');
  assert.equal(typeof getPacketState, 'function');
  assert.deepEqual(getPacketState(.4), { progress: .5, arrived: false });
  assert.deepEqual(getPacketState(.8), { progress: 1, arrived: true });
  assert.deepEqual(getPacketState(.95), { progress: 1, arrived: true });
});
