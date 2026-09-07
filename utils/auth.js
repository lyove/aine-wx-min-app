/**
 * Author: Lyove
 */

const Auth = {};

/**
 * Get current logged-in user info
 * @return {object}
 */
Auth.user = function () {
  return wx.getStorageSync('user');
}

/**
 * Get token
 * @return {string}
 */
Auth.token = function () {
  return wx.getStorageSync('token');
}

/**
 * Check whether still valid
 * @return {boolean}
 */
Auth.check = function () {
  let user = Auth.user();
  let token = Auth.token();
  if (user && Date.now() < wx.getStorageSync('expired_in') && token) {
    console.log('access_token过期时间：', (wx.getStorageSync('expired_in') - Date.now()) / 1000, '秒');
    return true;
  } else {
    return false;
  }
}

/**
 * Login
 *  {Promise} Login info
 */
Auth.login = function () {
  return new Promise(function (resolve, reject) {
    wx.login({
      success: function (res) {
        resolve(res);
      },
      fail: function (err) {
        reject(err);
      }
    });
  });
}

/**
 * Logout
 * @return {boolean}
 */
Auth.logout = function () {
  wx.removeStorageSync('user');
  wx.removeStorageSync('token');
  wx.removeStorageSync('expired_in');
  return true;
}

/**
 * Get encrypted data from authorized login
 */
Auth.getUserInfo = function () {
  return new Promise(function (resolve, reject) {
    Auth.login().then(data => {
      let args = {};
      args.code = data.code;
      wx.getUserInfo({
        success: function (res) {
          args.iv = encodeURIComponent(res.iv);
          args.encryptedData = encodeURIComponent(res.encryptedData);
          resolve(args);
        },
        fail: function (err) {
          reject(err);
        }
      });
    })
  });
}

export default Auth