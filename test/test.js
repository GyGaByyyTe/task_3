var assert = require('assert');
var fs = require('fs');
var mockUp = require('./const');
const main = require('../index.js');

describe('Output', function() {
  describe('Test wattAnHour calculate', function() {
    it('getWattCost for 3 hours(7-10) should return {"7": { power: 2100, tax: 0.00646 },"8": { power: 2100, tax: 0.00646 },"9": { power: 2100, tax: 0.00646 }}', function() {
      assert.deepEqual(
        main.getWattCost(
          {
            '7': { power: 2100 },
            '8': { power: 2100 },
            '9': { power: 2100 }
          },
          {
            start: 7,
            end: 10
          },
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
  describe('Test function for getting all-day-long device', function() {
    it('should return ( 02DDD23A85DADDD71198305330CC386D, 02DDD23A85DADDD71198305330CC386D ) totalPower: 100', function() {
      assert.deepEqual(main.fullTimeDevices(mockUp.testData1), {
        list: [
          '02DDD23A85DADDD71198305330CC386D',
          '1E6276CC231716FE8EE8BC908486D41E'
        ],
        totalPower: 100
      });
    });
  });
  describe('Test function for getting NOT-all-day-long device', function() {
    it('should return 3 device with Power => 2000 > 950 > 850', function() {
      assert.deepEqual(main.partTimeDevicesSorted(mockUp.testData1), [
        {
          id: 'C515D887EDBBE669B2FDAC62F571E9E9',
          power: 2000,
          duration: 2,
          mode: 'day'
        },
        {
          id: 'F972B82BA56A70CC579945773B6866FB',
          power: 950,
          duration: 3,
          mode: 'night'
        },
        {
          id: '7D9DC84AD110500D284B33C82FE6E85E',
          power: 850,
          duration: 1,
          mode: 'any'
        }
      ]);
    });
  });
  describe('Test Minimization function', function() {
    it('3 hours at "day"-mode should return [10,11,12]', function() {
      assert.deepEqual(
        main.getMinimalRange(
          mockUp.mockObjectForMin_1,
          { power: 2000, mode: 'day', duration: 3 },
          { start: 7, end: 21 }
        ),
        [10, 11, 12]
      );
    });
    it('6 hours at "night"-mode should return [23,0,1,2,3,4]', function() {
      assert.deepEqual(
        main.getMinimalRange(
          mockUp.mockObjectForMin_1,
          { power: 1000, mode: 'night', duration: 6 },
          { start: 21, end: 7 }
        ),
        [23, 0, 1, 2, 3, 4]
      );
    });
  });
});
fs.writeFileSync(
  'output.json',
  `${JSON.stringify(main.Calculate(mockUp.testData1))}`
);
console.log('Results are writed to file "output.json" for simply beautifying');
