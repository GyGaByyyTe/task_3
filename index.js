var MAX_HOURS = 24;
var MIN_HOURS = 0;
var WATT_IN_KW = 1000;

/** Основная функция, принимающая на вход данные о тарифах и устройствах
 * и возвращающая расписание работы устройств, оптимизированное под минимальное
 * потребление энергии
 * @param {Object} data Объект с входными данными
 * @returns {Object} График работы устройств
 */
function Calculate(data) {
  var result = {};

  var maxPower = data.maxPower;

  /* Вспомогательный объект с именами и мощностью устройств распределенными
   * по их идентификаторам */
  var _devicesNamePower = {};
  data.devices.forEach(device => {
    _devicesNamePower[device.id] = { name: device.name, power: device.power };
  });

  /* Начинаем формировать расписание 
   * var hours = [ 0, 1, 2, 3, ...] */
  var hours = [...Array(MAX_HOURS).keys()];

  /* hours = {
   *  '0': {power : Доступная_мощность},
   *  '1': {power : Доступная_мощность}, ... } */
  hours = hours.reduce(function(acc, item, index) {
    acc[index] = { power: maxPower, devices: [] };
    return acc;
  }, {});

  /* Добавляем в объект каждого часа поле - стоимость одного Ватта */
  data.rates.forEach(element => {
    if (element.from === element.to) {
      Object.assign(
        hours,
        getWattCost(
          hours,
          { start: element.from, end: element.from + 1 },
          element.from + 1,
          element.value
        )
      );
    } else if (element.from > element.to) {
      Object.assign(
        hours,
        getWattCost(
          hours,
          { start: element.from, end: MAX_HOURS },
          element.value
        )
      );
      Object.assign(
        hours,
        getWattCost(hours, { start: MIN_HOURS, end: element.to }, element.value)
      );
    } else {
      Object.assign(
        hours,
        getWattCost(
          hours,
          { start: element.from, end: element.to },
          element.value
        )
      );
    }
  });

  /* Получаем объект круглосуточных устройств */
  var fullTime = fullTimeDevices(data);
  /* Получаем массив НЕ круглосуточных устройств */
  var partTime = partTimeDevicesSorted(data);

  /* Заполняем каждый час круглосуточными устройствами, 
   * уменьшаем доступную мощность часа */
  for (const time in hours) {
    if (hours[time].power >= fullTime.totalPower) {
      hours[time].devices = hours[time].devices.concat(fullTime.list);
      hours[time].power -= fullTime.totalPower;
    } else {
      throw new Error('Power of set of devices much more than maximum');
    }
  }

  /* вписываем НЕкруглосуточные устройства на ближайший диапазон времени,
   * соответствующий циклу устройства */
  var arr = {};
  partTime.forEach(device => {
    arr = [];
    switch (device.mode) {
      case 'day':
        arr = getMinimalRange(hours, device, { start: 7, end: 21 });
        break;
      case 'night':
        arr = getMinimalRange(hours, device, { start: 21, end: 7 });
        break;
      default:
        arr = getMinimalRange(hours, device, { start: 0, end: 24 });
        break;
    }
    Object.assign(hours, fillHoursByDevice(hours, arr, device));
  });

  /* потребленная по факту энергия */
  var consumedEnergy = totalEnergy(hours, _devicesNamePower);

  /* Формируем результирующий объект из расписания
   * и данных по потребленной энергии */
  result = {
    ...result,
    schedule: hours,
    consumedEnergy: consumedEnergy
  };

  return result;
}

/** Распределяем по часам стоимость одного Ватта
 * @param {Object} data_obj Объект с соответствием час - список устройств
 * @param {Object} timeRange Начало и конец временного промежутка
 * @param {Number} timeRange.start Стартовый час временного промежутка
 * @param {Number} timeRange.end Конечный час временного промежутка
 * @param {Number} value Стоимость 1 кВт энергии
 * @returns {Object}
 */
function getWattCost(data_obj, timeRange, value) {
  var result = data_obj;
  for (var i = timeRange.start; i < timeRange.end; i++) {
    var tax = +(value / WATT_IN_KW).toFixed(5);
    result[i] = { ...result[i], tax: tax };
  }
  return result;
}

/** Считаем потраченную энергию по устройствам и тотально
 * @param {Object} data_obj Объект с соответствием час - список устройств
 * @param {Object} obj_devices Объект с коллекцией устройств
 * @returns {Object}
 */
function totalEnergy(data_obj, obj_devices) {
  var consumedEnergy = { value: 0, devices: {} };
  for (const time in data_obj) {
    data_obj[time].devices.forEach(device => {
      var costDeviceInHour = data_obj[time].tax * obj_devices[device].power;
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
 * @param {Object} data Объект с исходными данными
 * @returns {Object}
 */
function fullTimeDevices(data) {
  var fullTime = { list: [], totalPower: 0 };
  data.devices.forEach(device => {
    if (device.power <= data.maxPower) {
      if (device.duration === MAX_HOURS) {
        fullTime.list.push(device.id);
        fullTime.totalPower += device.power;
      }
    } else {
      throw new Error('Мощность устройства больше доступной в час');
    }
  });
  return fullTime;
}

/** Получаем массив объектов из id НЕ круглосуточных устройств, и их мощностью в порядке возрастания мощности
 * @param {Object} data Объект с исходными данными
 * @returns {Array}
 */
function partTimeDevicesSorted(data) {
  var partTime = [];
  data.devices.forEach(device => {
    if (device.power <= data.maxPower) {
      if (device.duration !== MAX_HOURS) {
        partTime.push({
          id: device.id,
          power: device.power,
          duration: device.duration,
          mode: device.mode || 'any'
        });
      }
    } else {
      throw new Error('Мощность устройства больше доступной в час');
    }
  });
  var result = partTime.sort((a, b) => b.power - a.power);
  return result;
}

/** Заполняем диапазон часов устройством
 * @param {Object} data_obj Объект с соответствием час - список устройств
 * @param {Array} arr_hours Последовательность оптимальных часов
 * @param {Object} obj_device Объект-устройство
 * @returns {Object}
 */
function fillHoursByDevice(data_obj, arr_hours, obj_device) {
  var result = data_obj;
  var counter = obj_device.duration;
  arr_hours.forEach(time => {
    result[time].devices.push(obj_device.id);
    result[time].power -= obj_device.power;
  });
  return result;
}
/** Получаем массив, длительностью в цикл устройства, из часов с минимальной стоимостью энергии
 * @param {Object} obj_data Объект с соответствием час - список устройств
 * @param {Object} obj_device Объект-устройство
 * @param {Object} fullDuration
 * @param {Number} fullDuration.start Начало периода для расчета
 * @param {Number} fullDuration.end Окончание периода для расчета
 * @returns {Array}
 */
function getMinimalRange(obj_data, obj_device, fullDuration) {
  var result = [];
  var _timeRange = fullDuration.end - fullDuration.start;
  if (_timeRange < 0)
    _timeRange = MAX_HOURS - fullDuration.start + fullDuration.end;
  if (obj_device.duration > _timeRange) {
    throw new Error(
      'Размер цикла больше чем доступный период работы устройства ' +
        obj_device.name
    );
  }
  var arrCount = [];
  for (
    var i = fullDuration.start;
    i <= fullDuration.start + _timeRange - obj_device.duration;
    i++
  ) {
    var isAvailable = true;
    var temp_arr = [];
    var sum = 0;
    var index = 0;
    for (var dt = 0; dt < obj_device.duration; dt++) {
      index = (i + dt) % MAX_HOURS;
      if (obj_data[index].power < obj_device.power) {
        isAvailable = false;
        break;
      }
      sum += obj_data[index].tax;
      temp_arr.push(index);
    } // узнали, подходит ли требуемый промежуток
    if (isAvailable) {
      arrCount.push({ sum: sum, time: temp_arr });
    }
  }
  if (arrCount.length === 0) {
    throw new Error(
      'Нет свободного времени в расписании для устройства ' + obj_device.name
    );
  }
  // сортируем и возвращаем промежуток с минимальной общей стоимостью Ватта, при равных суммах - где час раньше
  return arrCount.sort((a, b) => {
    if (a.sum < b.sum) {
      return -1;
    }
    if (a.sum > b.sum) {
      return 1;
    }
    if (a.sum === b.sum) {
      if (obj_device.mode === 'night') {
        if (b.time[0] < a.time[0]) {
          return -1;
        } else {
          return 1;
        }
      } else {
        if (a.time[0] < b.time[0]) {
          return -1;
        } else {
          return 1;
        }
      }
    }
  })[0].time;
}

module.exports.Calculate = Calculate;
module.exports.getWattCost = getWattCost;
module.exports.fullTimeDevices = fullTimeDevices;
module.exports.partTimeDevicesSorted = partTimeDevicesSorted;
module.exports.getMinimalRange = getMinimalRange;
