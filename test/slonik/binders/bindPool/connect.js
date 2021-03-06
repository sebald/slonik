// @flow

import test from 'ava';
import sinon from 'sinon';
import sql from '../../../../src/templateTags/sql';
import bindPool from '../../../../src/binders/bindPool';
import log from '../../../helpers/Logger';

const createConnection = () => {
  return {
    connection: {
      slonik: {
        connectionId: '1'
      }
    },
    query: () => {},
    release: () => {}
  };
};

const createPool = (clientConfiguration = {}) => {
  const connection = createConnection();

  const internalPool = {
    connect: () => {
      return connection;
    },
    slonik: {
      poolId: '1'
    }
  };

  const connectSpy = sinon.spy(internalPool, 'connect');
  const releaseSpy = sinon.spy(connection, 'release');

  const pool = bindPool(
    log,
    internalPool,
    {
      interceptors: [],
      typeParsers: [],
      ...clientConfiguration
    }
  );

  return {
    ...pool,
    connectSpy,
    releaseSpy
  };
};

test('releases connection after promise is resolved', async (t) => {
  const pool = createPool();

  await pool.connect(() => {
    return Promise.resolve('foo');
  });

  t.true(pool.connectSpy.callCount === 1);
  t.true(pool.releaseSpy.callCount === 1);
});

test('releases connection after promise is rejected', async (t) => {
  const pool = createPool();

  await t.throwsAsync(pool.connect(async () => {
    return Promise.reject(new Error('foo'));
  }));

  t.true(pool.connectSpy.callCount === 1);
  t.true(pool.releaseSpy.callCount === 1);
});

test('does not connect if beforePoolConnection throws an error', async (t) => {
  const pool = createPool({
    interceptors: [
      {
        beforePoolConnection: () => {
          return Promise.reject(new Error('foo'));
        }
      }
    ]
  });

  await t.throwsAsync(pool.connect(async () => {
    return null;
  }));

  t.true(pool.connectSpy.callCount === 0);
  t.true(pool.releaseSpy.callCount === 0);
});

test('releases connection if afterPoolConnection throws an error', async (t) => {
  const pool = createPool({
    interceptors: [
      {
        afterPoolConnection: () => {
          return Promise.reject(new Error('foo'));
        }
      }
    ]
  });

  await t.throwsAsync(pool.connect(async () => {
    return null;
  }));

  t.true(pool.connectSpy.callCount === 1);
  t.true(pool.releaseSpy.callCount === 1);
});

test('releases connection if beforePoolConnectionRelease throws an error', async (t) => {
  const pool = createPool({
    interceptors: [
      {
        afterPoolConnection: () => {
          return Promise.reject(new Error('foo'));
        }
      }
    ]
  });

  await t.throwsAsync(pool.connect(async () => {
    return null;
  }));

  t.true(pool.connectSpy.callCount === 1);
  t.true(pool.releaseSpy.callCount === 1);
});

test('if beforePoolConnection returns pool object, then the returned pool object is used to create a connection', async (t) => {
  const pool0 = createPool();

  const pool1 = createPool({
    interceptors: [
      {
        beforePoolConnection: () => {
          // $FlowFixMe
          return pool0;
        }
      }
    ]
  });

  await pool1.query(sql`SELECT 1`);

  t.true(pool0.connectSpy.callCount === 1);
  t.true(pool0.releaseSpy.callCount === 1);

  t.true(pool1.connectSpy.callCount === 0);
  t.true(pool1.releaseSpy.callCount === 0);
});

test('if beforePoolConnection returns null, then the current pool object is used to create a connection', async (t) => {
  const pool = createPool({
    interceptors: [
      {
        beforePoolConnection: () => {
          return null;
        }
      }
    ]
  });

  await pool.query(sql`SELECT 1`);

  t.true(pool.connectSpy.callCount === 1);
  t.true(pool.releaseSpy.callCount === 1);
});
