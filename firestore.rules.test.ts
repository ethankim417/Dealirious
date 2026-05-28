import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-test-wishlist',
    firestore: {
      rules: fs.readFileSync('firestore.rules', 'utf8'),
      host: '127.0.0.1',
      port: 8080
    },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
});

describe('Wishlist Security Rules', () => {
  const aliceId = 'alice123';
  const bobId = 'bob456';
  const gameId = 'steam-123';

  const validGame = {
    userId: aliceId,
    id: gameId,
    name: 'Cyberpunk 2077',
    price: '$29.99',
    image: 'http://image.com',
    platform: 'steam',
    url: 'http://url.com',
  };

  it('allows user to read their own wishlist', async () => {
    const alice = testEnv.authenticatedContext(aliceId);
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc(`users/${aliceId}/wishlist/${gameId}`).set(validGame);
    });
    
    await assertSucceeds(alice.firestore().doc(`users/${aliceId}/wishlist/${gameId}`).get());
  });

  it('denies user from reading another users wishlist', async () => {
    const alice = testEnv.authenticatedContext(aliceId);
    const bob = testEnv.authenticatedContext(bobId);
    
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().doc(`users/${aliceId}/wishlist/${gameId}`).set(validGame);
    });
    
    await assertFails(bob.firestore().doc(`users/${aliceId}/wishlist/${gameId}`).get());
  });
});
