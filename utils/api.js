/**
 * Author: Lyove
 * Description: Aine Mini Program API layer -- adapted to Aine (laravel-aine-master) backend
 *      Backend endpoints: GET /api/project/{project_identifier}/... (response { success, code, message, data })
 *      Data is normalized here to the structure pages expect; page code stays unchanged from the original framework
 */

import API from './base';

// ==================== Aine Configuration ====================
// Project identifier (slug or UUID), viewable in Admin -> Project Settings -> API Settings;
const PROJECT_IDENTIFIER = 'note';
// Collection slug for posts
const POSTS_SLUG = 'posts';
// Posts per page
const LIMIT = 10;

// ==================== Data Normalization ====================

/**
 * Content object -> structure used by pages (title.rendered / excerpt.rendered / meta.thumbnail etc.)
 */
function normalizePost(item) {
	if (!item || typeof item !== 'object') {
    return item;
  }
	const featured = item['featured-image'] || {};
	const category = item.category || {};
	const author = item.author || {};
	return {
		...item,
		id: item.id,
		date: String(item.published_at || item.created_at || '').slice(0, 10),
		title: { rendered: item.title || '' },
		excerpt: { rendered: item.excerpt || '' },
		content: { rendered: item.content || '' },
		meta: { thumbnail: featured.full_url_thumb || featured.full_url || '' },
		category: [{ id: category.id, name: category.title || '' }],
		author: { name: author.name || '', avatar: '' },
		comments: 0
	};
}

/**
 * Category object -> structure used by pages (id / name / description / cover)
 */
function normalizeCategory(item) {
	if (!item || typeof item !== 'object') {
	  return item;
	}
	const media = item.image || item['featured-image'] || {};
	const cover = typeof media === 'object' && media !== null
		? (media.full_url_thumb || media.full_url || '')
		: (typeof media === 'string' ? media : '');
	return {
		...item,
		id: item.id,
		name: item.title || '',
		description: item.description || '',
		cover: cover
	};
}

/**
 * Page object (pages list uses the description field)
 */
function normalizePage(item) {
	const page = normalizePost(item);
	page.description = item.description || item.excerpt || '';
	return page;
}

/**
 * Favorite / like row -> postList display structure.
 * Backend /api/me/favorites & /api/me/likes return
 * { content_id, title, slug, collection, project_identifier, project_name, published, favorited_at | liked_at }
 */
function normalizeUserInteraction(item, label) {
	if (!item || typeof item !== 'object') {
		return item;
	}
	const when = item.favorited_at || item.liked_at || '';
	return {
		id: item.content_id,
		title: { rendered: item.title || '' },
		excerpt: { rendered: (item.project_name ? item.project_name + ' · ' : '') + String(when).slice(0, 10) },
		meta: { thumbnail: '' },
		category: [{ id: 0, name: label }],
		author: { name: '', avatar: '' },
		comments: 0
	};
}

/**
 * Comment row -> postList display structure.
 * Backend /api/me/comments returns
 * { id, comment, status, article_id, article_title, article_slug, project_identifier, project_name, created_at }
 */
function normalizeUserComment(item) {
	if (!item || typeof item !== 'object') {
		return item;
	}
	return {
		id: item.article_id || item.id,
		title: { rendered: item.article_title || '评论' },
		excerpt: { rendered: item.comment || '' },
		meta: { thumbnail: '' },
		category: [{ id: 0, name: '我的评论' }],
		author: { name: item.project_name || '', avatar: '' },
		comments: 0
	};
}

/**
 * Pagination conversion: page -> offset/limit
 */
function buildPagination(data) {
	const page = (data && data.page) || 1;
	return `limit=${LIMIT}&offset=${(page - 1) * LIMIT}`;
}

// ==================== API Definitions ====================

const BOOLEAN_FILTERS = {
	featured: 'featured',
	recommended: 'recommended',
	slider: 'slider'
};

/**
 * Site info
 * GET /api/project/note
 */
const getSiteInfo = function () {
	return API.get(`/api/project/${PROJECT_IDENTIFIER}`);
}

/**
 * Post list
 * GET /api/project/note/posts
 * Supports category filter (filters.category.id) and search (/search)
 */
const getPostsList = function (type, data) {
	if (type && typeof type === 'object') {
		data = type;
		type = undefined;
	}
	data = data || {};

	// Private lists for the current logged-in user (favorites / likes / comments)
	if (type === 'userFav') {
		return getUserFavPosts();
	}
	if (type === 'userLike') {
		return getUserLikePosts();
	}
	if (type === 'userComments') {
		return getUserCommentsPosts();
	}

	// Search
	if (type === 'search' || data.search) {
		return API.get(`/api/project/${PROJECT_IDENTIFIER}/${POSTS_SLUG}/search`, {
			query: data.search,
			limit: LIMIT,
			offset: ((data.page || 1) - 1) * LIMIT
		}).then(list => (list || []).map(normalizePost));
	}

	// Sticky / carousel -> portal.slider
	if (type === 'sticky') {
		return getStickyPosts();
	}

	// Category filter
	let filter = '';
	if (data.categories) {
		filter = `&filters.category.id=${data.categories}`;
	}

	// Boolean flag filter (featured / recommended / slider)
	if (type && BOOLEAN_FILTERS[type]) {
		filter += `&filters.${BOOLEAN_FILTERS[type]}=1`;
	}

	return API.get(`/api/project/${PROJECT_IDENTIFIER}/${POSTS_SLUG}?sort=published_at:desc&timestamps=true&${buildPagination(data)}${filter}`)
		.then(list => (list || []).map(normalizePost));
}

/**
 * Sticky posts (homepage carousel) -> GET /api/project/note/portal?collection=posts -> data.slider
 */
const getStickyPosts = function () {
	return API.get(`/api/project/${PROJECT_IDENTIFIER}/portal?collection=${POSTS_SLUG}`).then(portal => {
		return ((portal && portal.slider) || []).map(normalizePost);
	});
}

/**
 * Random posts (no backend endpoint yet; returns the latest list)
 */
const getRandPosts = function () {
	return getPostsList();
}

/**
 * Related posts (no backend endpoint yet; returns the latest list)
 */
const getRelatedPosts = function () {
	return getPostsList();
}

/**
 * Most viewed (no backend endpoint yet; returns the latest list)
 */
const getMostViewsPosts = function () {
	return getPostsList();
}

/**
 * Most favorited (no backend endpoint yet; returns the latest list)
 */
const getMostFavPosts = function () {
	return getPostsList();
}

/**
 * Most liked (no backend endpoint yet; returns the latest list)
 */
const getMostLikePosts = function () {
	return getPostsList();
}

/**
 * Most commented (no backend endpoint yet; returns the latest list)
 */
const getMostCommentPosts = function () {
	return getPostsList();
}

/**
 * Recent comments (no backend endpoint yet; returns the latest list)
 */
const getRecentCommentPosts = function () {
	return getPostsList();
}

/**
 * Post detail
 * GET /api/project/note/posts/{id}
 */
const getPostByID = function (id) {
	return API.get(`/api/project/${PROJECT_IDENTIFIER}/${POSTS_SLUG}/${id}?timestamps=true`).then(res => normalizePost(res));
}

/**
 * Page list
 * GET /api/project/note/pages
 */
const getPagesList = function () {
	return API.get(`/api/project/${PROJECT_IDENTIFIER}/pages?timestamps=true`).then(list => (list || []).map(normalizePage));
}

/**
 * Page detail
 * GET /api/project/note/pages/{id}
 */
const getPageByID = function (id) {
	return API.get(`/api/project/${PROJECT_IDENTIFIER}/pages/${id}?timestamps=true`).then(res => normalizePost(res));
}

/**
 * Category list
 * GET /api/project/note/categories
 */
const getCategories = function () {
	return API.get(`/api/project/${PROJECT_IDENTIFIER}/categories`).then(list => (list || []).map(normalizeCategory));
}

/**
 * Category detail
 * GET /api/project/note/categories/{id}
 */
const getCategoryByID = function (id) {
	return API.get(`/api/project/${PROJECT_IDENTIFIER}/categories/${id}`).then(res => normalizeCategory(res));
}

/**
 * Tags (not provided by backend; returns empty)
 */
const getTags = function () {
	return Promise.resolve([]);
}

/**
 * Tag detail (not provided by backend; returns empty)
 */
const getTagByID = function () {
	return Promise.resolve({});
}

/**
 * Comment list (no backend comment API yet; returns empty list)
 */
const getComments = function () {
	return Promise.resolve([]);
}

/**
 * Favorite post (backend not ready; under development)
 */
const setFavComments = function () {
	return Promise.reject(new Error('功能开发中'));
}

/**
 * Like post (backend not ready; under development)
 */
const setLikeComments = function () {
	return Promise.reject(new Error('功能开发中'));
}

/**
 * Publish comment (backend not ready; under development)
 */
const addComment = function () {
	return Promise.reject(new Error('功能开发中'));
}

/**
 * Like comment (backend not ready; under development)
 */
const markComment = function () {
	return Promise.reject(new Error('功能开发中'));
}

/**
 * Current user's favorites (Sanctum token required)
 * GET /api/me/favorites
 */
const getUserFavPosts = function () {
	return API.get('/api/me/favorites', {}, { token: true })
		.then(list => (list || []).map(item => normalizeUserInteraction(item, '我的收藏')));
}

/**
 * Current user's likes (Sanctum token required)
 * GET /api/me/likes
 */
const getUserLikePosts = function () {
	return API.get('/api/me/likes', {}, { token: true })
		.then(list => (list || []).map(item => normalizeUserInteraction(item, '我的点赞')));
}

/**
 * Current user's comments (Sanctum token required)
 * GET /api/me/comments
 */
const getUserCommentsPosts = function () {
	return API.get('/api/me/comments', {}, { token: true })
		.then(list => (list || []).map(normalizeUserComment));
}

/**
 * Subscribe message (backend not ready; under development)
 */
const subscribeMessage = function () {
	return Promise.reject(new Error('功能开发中'));
}

/**
 * QR code poster (backend not ready; under development)
 */
const getCodeImg = function () {
	return Promise.reject(new Error('功能开发中'));
}

/**
 * Navigation menu (not provided by backend; returns empty)
 */
const getMenuSetting = function () {
	return Promise.resolve([]);
}

/**
 * Ads (not provided by backend; returns empty; pages only render when status === 200)
 */
const indexAdsense = function () {
	return Promise.resolve({ status: 404 });
}
const listAdsense = function () {
	return Promise.resolve({ status: 404 });
}
const detailAdsense = function () {
	return Promise.resolve({ status: 404 });
}
const pageAdsense = function () {
	return Promise.resolve({ status: 404 });
}

/**
 * Tweet list (not provided by backend; returns empty)
 */
const getTwitterPosts = function () {
	return Promise.resolve([]);
}

/**
 * Tweet detail (not provided by backend; returns empty)
 */
const getTwitterDetail = function () {
	return Promise.resolve({});
}

/**
 * Logout
 */
const Loginout = function () {
	return API.logout();
}

/**
 * Login with an Aine account (email or name + password)
 * POST /api/login -> { access_token, expired_in, user }
 */
const loginByPassword = function (account, password) {
	return API.post('/api/login', { account, password }, { token: false });
}

// ==================== Exports ====================

API.getSiteInfo = getSiteInfo;
API.getStickyPosts = getStickyPosts;
API.getPostsList = getPostsList;
API.getPostByID = getPostByID;
API.getPagesList = getPagesList;
API.getPageByID = getPageByID;
API.getCategories = getCategories;
API.getCategoryByID = getCategoryByID;
API.getTags = getTags;
API.getTagByID = getTagByID;
API.getRandPosts = getRandPosts;
API.getRelatedPosts = getRelatedPosts;
API.getMostViewsPosts = getMostViewsPosts;
API.getMostFavPosts = getMostFavPosts;
API.getMostLikePosts = getMostLikePosts;
API.getMostCommentPosts = getMostCommentPosts;
API.getRecentCommentPosts = getRecentCommentPosts;
API.getComments = getComments;
API.setFavComments = API.guard(setFavComments);
API.setLikeComments = API.guard(setLikeComments);
API.getUserFavPosts = getUserFavPosts;
API.getUserLikePosts = getUserLikePosts;
API.getUserCommentsPosts = getUserCommentsPosts;
API.addComment = API.guard(addComment);
API.subscribeMessage = API.guard(subscribeMessage);
API.getCodeImg = getCodeImg;
API.Loginout = Loginout;
API.loginByPassword = loginByPassword;
API.getMenuSetting = getMenuSetting;
API.indexAdsense = indexAdsense;
API.listAdsense = listAdsense;
API.detailAdsense = detailAdsense;
API.pageAdsense = pageAdsense;
API.getTwitterPosts = getTwitterPosts;
API.getTwitterDetail = getTwitterDetail;
API.markComment = API.guard(markComment);

export default API;
