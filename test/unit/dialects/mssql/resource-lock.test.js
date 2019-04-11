'use strict';

const ResourceLock = require('../../../../lib/dialects/mssql/resource-lock'),
  assert = require('assert'),
  Support = require('../../support'),
  dialect = Support.getTestDialect();

function delay(ms) {
  return new Promise(res => setTimeout(res, ms));
}

if (dialect === 'mssql') {
  describe('[MSSQL Specific] ResourceLock', () => {
    it('should process requests serially', () => {
      const expected = {};
      const lock = new ResourceLock(expected);
      let last = 0;

      function validateResource(actual) {
        assert.equal(actual, expected);
      }

      return Promise.all([
        lock.lock(resource => {
          validateResource(resource);
          assert.equal(last, 0);
          last = 1;

          return delay(15);
        }),
        lock.lock(resource => {
          validateResource(resource);
          assert.equal(last, 1);
          last = 2;
        }),
        lock.lock(resource => {
          validateResource(resource);
          assert.equal(last, 2);
          last = 3;

          return delay(5);
        })
      ]);
    });

    it('should still return resource after failure', () => {
      const expected = {};
      const lock = new ResourceLock(expected);

      function validateResource(actual) {
        assert.equal(actual, expected);
      }

      return Promise.all([
        lock.lock(resource => {
          validateResource(resource);

          throw new Error('unexpected error');
        }).catch(() => {}),
        lock.lock(validateResource)
      ]);
    });

    it('should be able to.lock resource without waiting on lock', () => {
      const expected = {};
      const lock = new ResourceLock(expected);

      assert.equal(lock.unwrap(), expected);
    });
  });
}
