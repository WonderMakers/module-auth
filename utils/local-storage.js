const _private = {};

/**
 * @constructor
 */
export function LocalStorage () {
  throw new Error('Can\'t create instance of static class LocalStorage');
}

/**
 * Префикс для ключей в localStorage
 * @access private
 * @type {string}
 */
_private.lacalStoragePrefix = 'storage:';

/**
 * Парсит JSON
 * @access private
 * @param {String} data - Данные из localStorage
 * @returns {*}
 *
 */
_private.parseData = function (data){
  try {
    return JSON.parse(data);
  } catch (e) {
    return data;
  }
};

/**
 * Готовит данные для записи в localStorage
 * @access private
 * @param {*} data - Даные для записи
 * @returns {String}
 *
 */
_private.stringifyData = function (data){
  return (JSON.stringify({
    date: (new Date()).toString(),
    time: Date.now(),
    data: data
  }));
};

/**
 * Проверяет поддержку localStorage
 * @access private
 * @returns {boolean}
 */
LocalStorage.isSupported = function (){
  return (typeof Storage !== 'undefined');
};

/**
 * Получает только данные из локального хранилища по ключу
 * @access public
 * @param {String} key - название ключа
 * @param {Boolean} global - поиск от глобального объекта
 * @return {Object}
 *
 */
LocalStorage.get = function (key, global) {
  if (this.isSupported()) {
    let res = _private.parseData(localStorage.getItem((global?'':_private.lacalStoragePrefix) + key));
    return res && (res.data||null);
  } else {
    return null
  }
};

/**
 * Записывает данные в локальное хранилище
 * @access public
 * @param {String} key - название ключа
 * @param {*} data - Данные
 * @return {LocalStorage}
 */
LocalStorage.set = function (key, data) {
  if (this.isSupported()) {
    localStorage.setItem(_private.lacalStoragePrefix + key, _private.stringifyData(data));
  }
  return this;
};

/**
 * Удалят данные по ключу
 * @access public
 * @param {String} key - название ключа
 * @return {Boolean|LocalStorage}
 */
LocalStorage.remove = function (key) {
  if (this.isSupported()) {
    localStorage.removeItem(_private.lacalStoragePrefix + key);
  }
  return this;
};
