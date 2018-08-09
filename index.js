var MAX_HOURS = 24;
var MIN_HOURS = 0;
var WATT_IN_KW = 1000;

/**
 * @param {Object} data
 * @returns {Object} - результат зависит от команды
 */
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
        getWattCost(hours, element.from, element.from + 1, element.value)
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

  /* Получаем объект круглосуточных устройств */
  var fullTime = fullTimeDevices(data);
  /* Получаем массив НЕ круглосуточных устройств */
  var partTime = partTimeDevicesSorted(data);

  /* Заполняем каждый час круглосуточными устройствами, уменьшаем доступную мощность часа */
  for (const time in hours) {
    if (hours[time].power >= fullTime.power) {
      hours[time].devices = hours[time].devices.concat(fullTime.list);
      hours[time].power -= fullTime.power;
    } else {
      throw new Error('Power of set of devices much more than maximum');
    }
  }

  //вписываем НЕкруглосуточные устройства по-одному на ближайшие места
  var arr = {};
  partTime.forEach(device => {
    arr = [];
    if (device.mode === 'day') {
      // for (var time in hours) {
      //   if (parseInt(time) >= 7 && parseInt(time) < 21) {
      //     if (hours[time].power >= device.power) {
      //       arr[time] = hours[time];
      //     }
      //   }
      // }
      getMinimalRange(hours, device, { start: 7, end: 21 });
    } else if (device.mode === 'night') {
      // for (var time in hours) {
      //   if (
      //     (parseInt(time) >= 21 && parseInt(time) < 24) ||
      //     (parseInt(time) >= 0 && parseInt(time) < 7)
      //   ) {
      //     if (hours[time].power >= device.power) {
      //       arr[time] = hours[time];
      //     }
      //   }
      // }
      getMinimalRange(hours, device, { start: 21, end: 7 });
    } else {
      // for (var time in hours) {
      //   if (hours[time].power >= device.power) {
      //     arr[time] = hours[time];
      //   }
      // }
      getMinimalRange(hours, device, { start: 0, end: 24 });
    }
    Object.assign(hours, fillHoursByDevice(arr, device));
  });

  /* потребленная по факту энергия */
  var consumedEnergy = totalEnergy(hours, _devicesNamePower);

  result = {
    ...result,
    schedule: hours,
    consumedEnergy: consumedEnergy
  };

  return result;
}

/** Распределяем по часам стоимость одного Ватта
 * @param {Object} obj
 * @param {Number} from
 * @param {Number} to
 * @param {Number} value
 * @returns {Object}
 */
function getWattCost(obj, from, to, value) {
  var result = obj;
  for (var i = from; i < to; i++) {
    var tax = +(value / WATT_IN_KW).toFixed(5);
    result[i] = { ...result[i], tax: tax };
  }
  return result;
}

/** Считаем потраченную энергию по устройствам и тотально
 * @param {Object} obj_data
 * @param {Object} obj_devices
 * @returns {Object}
 */
function totalEnergy(obj_data, obj_devices) {
  var consumedEnergy = { value: 0, devices: {} };
  for (const time in obj_data) {
    obj_data[time].devices.forEach(device => {
      var costDeviceInHour = obj_data[time].tax * obj_devices[device].power;
      if (consumedEnergy.devices[device]) {
        consumedEnergy.devices[device] += costDeviceInHour;
      } else {
        consumedEnergy.devices[device] = costDeviceInHour;
      }
    });
  }
  for (const device in consumedEnergy.devices) {
    consumedEnergy.devices[device] = +consumedEnergy.devices[device].toFixed(3);
    consumedEnergy.value += consumedEnergy.devices[device];
  }
  return consumedEnergy;
}

/** Получаем объект с массивом круглосуточных устройств, и их суммарной мощностью
 * @param {Object} obj_data
 * @returns {Object}
 */
function fullTimeDevices(obj_data) {
  var fullTime = { list: [], power: 0 };
  obj_data.devices.forEach(device => {
    if (device.power <= obj_data.maxPower) {
      if (device.duration === MAX_HOURS) {
        fullTime.list.push(device.id);
        fullTime.power += device.power;
      }
    } else {
      throw new Error('Power of device much more than maximum');
    }
  });
  return fullTime;
}

/** Получаем массив объектов из id НЕ круглосуточных устройств, и их мощностью в порядке возрастания мощности
 * @param {Object} obj_data
 * @returns {Array}
 */
function partTimeDevicesSorted(obj_data) {
  var partTime = [];
  obj_data.devices.forEach(device => {
    if (device.power <= obj_data.maxPower) {
      if (device.duration !== MAX_HOURS) {
        partTime.push({
          id: device.id,
          power: device.power,
          duration: device.duration,
          mode: device.mode || 'any'
        });
      }
    } else {
      throw new Error('Power of device much more than maximum');
    }
  });
  var result = partTime.sort((a, b) => b.power - a.power);
  return result;
}

/** Заполняем диапазон часов устройством
 * @param {Object} obj_hours
 * @param {Object} obj_device
 * @returns {Object}
 */
function fillHoursByDevice(obj_hours, obj_device) {
  var result = obj_hours;
  var counter = obj_device.duration;
  for (var time in result) {
    if (counter > 0) {
      result[time].devices.push(obj_device.id);
      result[time].power -= obj_device.power;
      counter--;
    } else break;
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
  var _timeRange = fullDuration.end - fullDuration.start;
  if (device.duration > _timeRange) {
    throw new Error('Размер цикла больше чем доступный период работы');
  }
  var arrCount = [];
  for (
    var i = fullDuration.start;
    i <= fullDuration.end - device.duration;
    i++
  ) {
    var isAvailable = true;
    var temp_arr = [];
    var sum = 0;
    for (var j = 0; j < device.duration; j++) {
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

module.exports.Calculate = Calculate;
module.exports.getWattCost = getWattCost;
