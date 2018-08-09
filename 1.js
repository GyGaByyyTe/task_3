var fs = require('fs');
var obj_1 = require('./test/const');

var MAX_HOURS = 24;
var MIN_HOURS = 0;
var WATT_IN_KW = 1000;

function Calculate(data) {
  var result = {};

  var maxPower = data.maxPower;
  //вспомогательный объект с именами и мощностью устройств
  var _devicesNamePower = {}; // объект устройство: {имя,мощность}
  data.devices.forEach(device => {
    _devicesNamePower[device.id] = { name: device.name, power: device.power };
  });

  //var hours = [ 0, 1, 2, 3, ...]
  var hours = [...Array(MAX_HOURS).keys()];

  /* hours = {
   *  '0': {power : Доступная_мощность},
   *  '1': {power : Доступная_мощность}, ... } */
  hours = hours.reduce(function(acc, item, index) {
    acc[index] = { power: maxPower, devices: [] };
    return acc;
  }, {});

  /* Получаем объект с полями =>  'час': { power: Доступная_мощность , tax: Стоимость_одного_Ватта }, ... */
  data.rates.forEach(element => {
    if (element.from === element.to) {
      Object.assign(
        hours,
        setTax(hours, element.from, element.from + 1, element.value)
      );
    } else if (element.from > element.to) {
      Object.assign(
        hours,
        getWattCost(hours, element.from, MAX_HOURS, element.value)
      );
      Object.assign(
        hours,
        getWattCost(hours, MIN_HOURS, element.to, element.value)
      );
    } else {
      Object.assign(
        hours,
        getWattCost(hours, element.from, element.to, element.value)
      );
    }
  });
  result = hours;
  return result;
}
function getWattCost(obj, from, to, value) {
  var result = obj;
  for (var i = from; i < to; i++) {
    var tax = +(value / WATT_IN_KW).toFixed(5);
    result[i] = { ...result[i], tax: tax };
  }
  return result;
}
/** Получаем массив объектов из id НЕ круглосуточных устройств, и их мощностью в порядке возрастания мощности
 * @param {Object} data_obj
 * @param {Object} device
 * @param {Object} fullDuration
 * @returns {Array}
 */
function getMinimalRange(data_obj, device, fullDuration) {
  var result = [];
  var _timeRange = Math.abs(fullDuration.end - fullDuration.start); // 14
  if (device.duration > _timeRange) {
    throw new Error('Размер цикла больше чем доступный период работы');
  }
  var arrCount = [];
  for (
    var i = fullDuration.start; // 7
    i <= fullDuration.end - device.duration; //21 -3 = 18
    i++ // 7, 8, ... 17
  ) {
    var isAvailable = true;
    var temp_arr = [];
    var sum = 0;
    for (
      var j = 0;
      j < device.duration;
      j++ // 0, 1, 2
    ) {
      if (data_obj[i + j].power < device.power) {
        isAvailable = false;
        break;
      }
      sum += data_obj[i + j].tax;
      temp_arr.push(i + j);
    } // узнали, подходит ли требуемый промежуток
    if (isAvailable) {
      arrCount.push({ sum: sum, time: temp_arr });
    }
  }
  if (arrCount.length < 0) {
    throw new Error('Нет свободного времени в расписании');
  }
  // сортируем и возвращаем промежуток с минимальной общей стоимостью Ватта
  return arrCount.sort((a, b) => a.sum - b.sum)[0].time;
}
fs.writeFileSync('2.js', `var k = ${JSON.stringify(Calculate(obj_1))}`);
fs.writeFileSync(
  '3.js',
  `var k = ${JSON.stringify(
    getMinimalRange(
      Calculate(obj_1),
      { power: 200, mode: 'day', duration: 6 },
      { start: 21, end: 7 }
    )
  )}`
);
