/**
 * Author: Lyove
 * Description: Aine Mini Program base request layer -- adapted to Aine CMS (laravel-aine-master) backend
 *      The backend wraps every response as { success, code, message, data }; unwrap here and return data
 */

const API_HOST = 'https://api.lyove.com'  // Aine CMS online API domain
import Auth from './auth';

const templates = {
	comments: ['', ''], // Template IDs for comment reply & review
	subscribe: [''] // Template IDs for news update notifications
}

const API = {}

API.getHost = function () {
	return API_HOST;
}

API.template = function () {
	return templates;
}

API.request = function (url, method = "GET", data = {}, args = { token: true }) {

	return new Promise(function (resolve, reject) {
		url = API_HOST + url;
		// Attach the Sanctum bearer token for authenticated endpoints
		const token = (args && args.token === true) ? Auth.token() : false;
		const header = {};
		if (token) {
			header.Authorization = 'Bearer ' + token;
		}
		wx.request({
			url: url,
			data: data,
			method: method,
			header: header,
			success: function (res) {
				const body = res.data || {};
				if (res.statusCode === 200 && body.success !== false) {
					// Unwrap { success, code, message, data } -> data
					resolve(body.data !== undefined ? body.data : body);
				} else if (body.code === "rest_post_invalid_page_number") {
					wx.showToast({
						title: '没有更多内容',
						mask: false,
						duration: 1000
					});
				} else if (body.message) {
					// Show the backend-provided error message (e.g. login failures)
					const msg = (body.message === 'Unauthenticated.' || body.message === 'Unauthenticated')
						? '登录已过期，请重新登录'
						: body.message;
					wx.showToast({
						title: msg,
						icon: 'none',
						duration: 2000
					});
					reject(body);
				} else {
					wx.showToast({
						title: "请求数据出错",
						icon: 'loading',
						duration: 1500
					});
					reject(body);
				}
			},
			fail: function (err) {
				console.log(err);
				reject(err);
			}
		})
	});
}

API.get = function (url, data = {}, args = { token: false }) {
	return API.request(url, "GET", data, args);
}

API.post = function (url, data, args = { token: true }) {
	return API.request(url, "POST", data, args);
}

API.delete = function (url, data = {}, args = { token: true }) {
	return API.request(url, "DELETE", data, args);
}

API.getUser = function () {
	if (Auth.check()) {
		return Auth.user();
	} else {
		return false;
	}
}

API.login = function () {
	return new Promise(function (resolve, reject) {
		if (Auth.check()) {
			resolve(Auth.user());
		} else {
			Auth.login().then(res => {
				resolve(res);
			}).catch(err => {
				reject(err);
			})
		}
	});
}

API.logout = function () {
	if (Auth.logout()) {
		getApp().globalData.user = '';
	} else {
		wx.showToast({
			title: '注销失败!',
			icon: 'loading',
			duration: 1000,
		})
	}
}

/**
 * Login: the backend (Aine CMS) has no mini program login API yet; under development
 * Keep the original calling logic; replace the URL below once the API is ready
 */
API.getUserProfile = function () {
	return new Promise(function (resolve, reject) {
		Auth.getUserInfo().then(data => {
			API.post('/user', data, { token: false }).then(res => {
				API.storageUser(res);
				resolve(res.user);
			}, err => {
				reject(err);
			});
		})
			.catch(err => {
				reject(err);
			})
	});
}

API.token = function () {
	let token = Auth.token();
	let datetime = Date.now();
	if (token && datetime < wx.getStorageSync('expired_in')) {
		return token;
	} else {
		return false;
	}
}

API.storageUser = function (res) {
	getApp().globalData.user = res.user;
	wx.setStorageSync('user', res.user);
	wx.setStorageSync('openid', res.openid);
	if (res.access_token) {
		wx.setStorageSync('token', res.access_token);
		wx.setStorageSync('expired_in', res.expired_in);
	}
}

API.guard = function (fn) {
	const _this = this
	return function () {
		if (API.getUser()) {
			return fn.apply(_this, arguments);
		} else {
			return API.getUserProfile().then(res => {
				console.log('登录成功', res);
				return fn.apply(_this, arguments);
			}, err => {
				console.log('登录失败', err);
				return err;
			})
		}
	}
}

export default API
