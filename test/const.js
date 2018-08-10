var testData1 = {
  devices: [
    {
      id: 'F972B82BA56A70CC579945773B6866FB',
      name: 'Посудомоечная машина',
      power: 950,
      duration: 3,
      mode: 'night'
    },
    {
      id: 'C515D887EDBBE669B2FDAC62F571E9E9',
      name: 'Духовка',
      power: 2000,
      duration: 2,
      mode: 'day'
    },
    {
      id: '02DDD23A85DADDD71198305330CC386D',
      name: 'Холодильник',
      power: 50,
      duration: 24
    },
    {
      id: '1E6276CC231716FE8EE8BC908486D41E',
      name: 'Термостат',
      power: 50,
      duration: 24
    },
    {
      id: '7D9DC84AD110500D284B33C82FE6E85E',
      name: 'Кондиционер',
      power: 850,
      duration: 1
    }
  ],
  rates: [
    {
      from: 7,
      to: 10,
      value: 6.46
    },
    {
      from: 10,
      to: 17,
      value: 5.38
    },
    {
      from: 17,
      to: 21,
      value: 6.46
    },
    {
      from: 21,
      to: 23,
      value: 5.38
    },
    {
      from: 23,
      to: 7,
      value: 1.79
    }
  ],
  maxPower: 2100
};
var mockObjectForMin_1 = {
  '0': { power: 2100, devices: [], tax: 0.00179 },
  '1': { power: 2100, devices: [], tax: 0.00179 },
  '2': { power: 2100, devices: [], tax: 0.00179 },
  '3': { power: 2100, devices: [], tax: 0.00179 },
  '4': { power: 2100, devices: [], tax: 0.00179 },
  '5': { power: 2100, devices: [], tax: 0.00179 },
  '6': { power: 2100, devices: [], tax: 0.00179 },
  '7': { power: 2100, devices: [], tax: 0.00646 },
  '8': { power: 2100, devices: [], tax: 0.00646 },
  '9': { power: 2100, devices: [], tax: 0.00646 },
  '10': { power: 2100, devices: [], tax: 0.00538 },
  '11': { power: 2100, devices: [], tax: 0.00538 },
  '12': { power: 2100, devices: [], tax: 0.00538 },
  '13': { power: 2100, devices: [], tax: 0.00538 },
  '14': { power: 2100, devices: [], tax: 0.00538 },
  '15': { power: 2100, devices: [], tax: 0.00538 },
  '16': { power: 2100, devices: [], tax: 0.00538 },
  '17': { power: 2100, devices: [], tax: 0.00646 },
  '18': { power: 2100, devices: [], tax: 0.00646 },
  '19': { power: 2100, devices: [], tax: 0.00646 },
  '20': { power: 2100, devices: [], tax: 0.00646 },
  '21': { power: 2100, devices: [], tax: 0.00538 },
  '22': { power: 2100, devices: [], tax: 0.00538 },
  '23': { power: 2100, devices: [], tax: 0.00179 }
};
module.exports.testData1 = testData1;
module.exports.mockObjectForMin_1 = mockObjectForMin_1;
