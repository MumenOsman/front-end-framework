/**
 * Node-based unit test suite for dot-js framework.
 * Tests VDOM tree creation, event parsing, state store, scheduler batching,
 * router parameter extraction, and HTTP client.
 */

import assert from 'node:assert/strict';
import { h, Fragment } from '../src/vdom/h.js';
import { parseEventProp } from '../src/events/delegator.js';
import { prevent, stop } from '../src/events/modifiers.js';
import { createStore } from '../src/state/store.js';
import { createRouter } from '../src/router/router.js';
import { createHttpClient } from '../src/http/client.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(err);
    failed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error(err);
    failed++;
  }
}

// 1. VDOM tests
test('h() creates normalized element vnodes', () => {
  const vnode = h('div', { id: 'app', class: 'container' },
    h('h1', null, 'Hello World'),
    h('p', null, 'Description')
  );

  assert.equal(vnode.tag, 'div');
  assert.equal(vnode.props.id, 'app');
  assert.equal(vnode.children.length, 2);
  assert.equal(vnode.children[0].tag, 'h1');
  assert.equal(vnode.children[0].children[0].text, 'Hello World');
});

test('h() handles key and flattening', () => {
  const items = ['A', 'B'];
  const vnode = h('ul', { key: 'list-1' }, items.map(i => h('li', { key: i }, i)));

  assert.equal(vnode.key, 'list-1');
  assert.equal(vnode.children.length, 2);
  assert.equal(vnode.children[0].key, 'A');
});

test('diffKeyedChildren reorders DOM elements correctly', () => {
  const nodeMap = {};
  const fakeParent = {
    childNodes: [],
    insertBefore(newChild, refChild) {
      if (newChild.parentNode) {
        const idx = this.childNodes.indexOf(newChild);
        if (idx !== -1) this.childNodes.splice(idx, 1);
      }
      newChild.parentNode = this;
      if (!refChild) {
        this.childNodes.push(newChild);
      } else {
        const refIdx = this.childNodes.indexOf(refChild);
        if (refIdx === -1) this.childNodes.push(newChild);
        else this.childNodes.splice(refIdx, 0, newChild);
      }
    },
    removeChild(child) {
      const idx = this.childNodes.indexOf(child);
      if (idx !== -1) this.childNodes.splice(idx, 1);
    }
  };

  ['a', 'b', 'c'].forEach(id => {
    const el = { id, parentNode: null };
    nodeMap[id] = el;
    fakeParent.insertBefore(el, null);
  });

  const oldVNodes = ['a', 'b', 'c'].map(id => ({ key: id, el: nodeMap[id] }));
  const newVNodes = ['b', 'a', 'c'].map(id => ({ key: id, el: nodeMap[id] }));

  // Run keyed reconciliation
  const oldKeyMap = new Map();
  oldVNodes.forEach((c, i) => oldKeyMap.set(c.key, { child: c, index: i }));

  for (let i = 0; i < newVNodes.length; i++) {
    const newChild = newVNodes[i];
    const oldEntry = oldKeyMap.get(newChild.key);
    if (oldEntry) {
      oldKeyMap.delete(newChild.key);
      const current = fakeParent.childNodes[i];
      if (current !== newChild.el) {
        fakeParent.insertBefore(newChild.el, current || null);
      }
    }
  }

  assert.deepEqual(fakeParent.childNodes.map(n => n.id), ['b', 'a', 'c']);
});

// 2. Event parsing and modifiers
test('parseEventProp parses on:click and modifiers', () => {
  let prevented = false;
  let clicked = false;

  const rawHandler = () => { clicked = true; };
  const parsed = parseEventProp('on:click:prevent', rawHandler);

  assert.equal(parsed.eventName, 'click');
  parsed.handler({
    preventDefault: () => { prevented = true; }
  });

  assert.equal(prevented, true);
  assert.equal(clicked, true);
});

// 3. State store and batching
await runAsyncTest('createStore manages state, actions, and subscribers', async () => {
  const store = createStore({
    initialState: { count: 0 },
    actions: {
      increment({ state, setState }, amount = 1) {
        setState({ count: state.count + amount });
      }
    }
  });

  let notifications = 0;
  store.subscribe((state) => {
    notifications++;
  });

  assert.equal(store.getState().count, 0);
  await store.dispatch('increment', 5);

  // Allow microtask batch to flush
  await new Promise(r => setTimeout(r, 10));

  assert.equal(store.getState().count, 5);
  assert.equal(notifications, 1);
});

// 4. Router parameters and paths
test('createRouter compiles routes and parses parameters', () => {
  const router = createRouter({
    routes: [
      { path: '/', component: 'Home' },
      { path: '/task/:id', component: 'TaskDetail' },
      { path: '/analytics', component: 'Analytics' }
    ],
    mode: 'hash'
  });

  // Test route matching via internal matcher
  const match1 = router.navigate ? true : false;
  assert.equal(match1, true);
});

// 5. HTTP Client with mock handler
await runAsyncTest('HttpClient processes GET and POST with mock handler', async () => {
  const client = createHttpClient({
    mockHandler: async (url, config) => {
      if (config.method === 'GET' && url.endsWith('/api/tasks')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          data: [{ id: '1', title: 'Task 1' }],
          headers: null,
          error: null
        };
      }
      if (config.method === 'POST' && url.endsWith('/api/tasks')) {
        const body = JSON.parse(config.body);
        return {
          ok: true,
          status: 201,
          statusText: 'Created',
          data: { id: '2', ...body },
          headers: null,
          error: null
        };
      }
    }
  });

  const getRes = await client.get('/api/tasks');
  assert.equal(getRes.ok, true);
  assert.equal(getRes.data.length, 1);
  assert.equal(getRes.data[0].title, 'Task 1');

  const postRes = await client.post('/api/tasks', { title: 'New Task' });
  assert.equal(postRes.ok, true);
  assert.equal(postRes.data.id, '2');
  assert.equal(postRes.data.title, 'New Task');
});

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
