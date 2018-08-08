var assert = require('assert');
var fs = require('fs');
var obj_1 = require('./const');
const main = require('../index.js');

describe('Output', function() {
  it('main.setTax({7: { power: 2100 },8: { power: 2100 },9: { power: 2100 }}, 7, 10, 6.46) should return {"7": { tax: 0.00646 },"8": { tax: 0.00646 },"9": { tax: 0.00646 }}', function() {
    assert.deepEqual(
      main.getWattCost(
        {
          '7': { power: 2100 },
          '8': { power: 2100 },
          '9': { power: 2100 }
        },
        7,
        10,
        6.46
      ),
      {
        '7': { power: 2100, tax: 0.00646 },
        '8': { power: 2100, tax: 0.00646 },
        '9': { power: 2100, tax: 0.00646 }
      }
    );
  });
});
console.log(JSON.stringify(main.Calculate(obj_1)));
fs.writeFileSync('hello.js', `var k = ${JSON.stringify(main.Calculate(obj_1))}`);
