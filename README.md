# Aine 微信小程序（Aine-wx-minapp）

基于 [Aine-wx-min-app](https://github.com/lyove/aine-wx-min-app) 框架搭建的微信小程序，页面交互与框架代码保持一致，接口已全部切换到同目录 `laravel-aine-master`（Aine CMS）后端。

## 当前状态

- **接口域名**：`https://api.lyove.com`（`utils/base.js` 的 `API_HOST`）
- **后端**：同目录 `laravel-aine-master`（Aine CMS，Laravel）线上部署，项目标识符 `note`
- **接口适配**：`utils/api.js` 已全部切换到 Aine CMS 接口（`/api/project/note/...`），原框架的 `article/articles`（含大小写、单复数）统一改为 `post/posts`，文件名、目录、路径同步调整；响应在 `api.js` 中标准化为页面结构，页面代码保持原框架不变
- **已实现功能**：
  - 首页 / 栏目 / 列表 / 详情页：文章、分类、搜索、页面内容
  - **账号登录**（"我的"页）：使用 api.lyove.com 后台账号（邮箱或用户名）+ 密码登录，签发 Sanctum token（有效期 30 天）
  - **我的点赞 / 我的收藏 / 我的评论**：展示当前登录用户的真实数据
  - **文章详情收藏 / 点赞**：调用当前用户接口，图标与计数实时更新
  - 未登录操作（收藏 / 点赞 / 查看用户列表 / 评论）统一提示"请先登录"

## 账号登录（我的）

- **入口**：底部"我的" → 点击顶部头像或"游客"区域
- **方式**：弹出登录框，输入 api.lyove.com 后台账号（邮箱或用户名）+ 密码
- **接口**：`POST /api/login`，成功返回 `{ access_token, expired_in, user }`
- **登录后**：页面显示真实昵称与头像；token 存入微信 storage（`utils/auth.js`），后续请求自动携带 `Authorization: Bearer <token>`
- **退出**：我的页"退出登录"清除本地用户信息与 token

## 接口适配对照

后端接口前缀：`https://api.lyove.com/api/project/note`（`note` 为项目标识符，可在后台「项目设置 → API Settings」查看，支持 slug 或 UUID）

### 内容接口

| 页面调用（原框架） | Aine CMS 实际接口 |
| --- | --- |
| 站点信息 `getSiteInfo` | `GET /api/project/note`（返回 name / description） |
| 文章列表 `getPostsList` | `GET /api/project/note/posts?sort=published_at:desc&limit=10&offset=0&timestamps=true` |
| 分类过滤 | 追加 `&filters.category.id={分类id}`（关联过滤） |
| 搜索 | `GET /api/project/note/posts/search?query={关键词}&limit=10&offset=0` |
| 首页轮播 `getStickyPosts` | `GET /api/project/note/portal?collection=posts` → `data.slider` |
| 文章详情 `getPostByID` | `GET /api/project/note/posts/{id}?timestamps=true` |
| 分类列表 `getCategories` | `GET /api/project/note/categories` |
| 分类详情 `getCategoryByID` | `GET /api/project/note/categories/{id}` |
| 页面列表 `getPagesList` | `GET /api/project/note/pages?timestamps=true` |
| 页面详情 `getPageByID` | `GET /api/project/note/pages/{id}?timestamps=true` |

### 登录与用户数据接口

| 功能 | 接口 | 认证 |
| --- | --- | --- |
| 账号登录 `loginByPassword` | `POST /api/login` `{account, password}` | 无 |
| 我的收藏 `getUserFavPosts` | `GET /api/me/favorites` | Bearer token |
| 我的点赞 `getUserLikePosts` | `GET /api/me/likes` | Bearer token |
| 我的评论 `getUserCommentsPosts` | `GET /api/me/comments` | Bearer token |

### 收藏 / 点赞（文章详情）

| 功能 | 接口 | 认证 |
| --- | --- | --- |
| 收藏 `addFavorite` | `POST /api/project/note/favorites` `{content_id}` | Bearer token |
| 取消收藏 `removeFavorite` | `DELETE /api/project/note/favorites/{content_id}` | Bearer token |
| 点赞 `addLike` | `POST /api/project/note/likes` `{content_id}` | Bearer token |
| 取消点赞 `removeLike` | `DELETE /api/project/note/likes/{content_id}` | Bearer token |
| 状态查询 `getPostInteractions` | `GET /api/project/note/interactions/{content_id}` | 可选（登录携带 token 返回个人状态） |

以上接口返回统一为 `{ success, code, message, data }`，`base.js` 自动解包；401 时提示"登录已过期，请重新登录"。

### 数据标准化（utils/api.js 内）

内容字段在 `api.js` 中标准化为页面结构：

| 页面使用 | 后端字段 |
| --- | --- |
| `item.title.rendered` | `item.title` |
| `item.excerpt.rendered` | `item.excerpt` |
| `item.meta.thumbnail` | `item['featured-image'].full_url_thumb`（无缩略图则用 full_url） |
| `item.category[0].name` | `item.category.title` |
| `item.author.name` | `item.author.name` |
| `item.date` | `item.published_at`（取日期部分） |

用户数据（收藏 / 点赞 / 评论）同样在 `api.js` 中适配为列表页结构：收藏/点赞展示文章标题与来源项目，评论展示评论内容与对应文章标题，点击列表项跳转文章详情。

## 页面结构

| 页面 | 路径 | 状态 |
| --- | --- | --- |
| 首页 | `pages/home/index` | 已对接接口 |
| 栏目 | `pages/category/index` | 已对接接口 |
| 文章列表 | `pages/postList/index` | 已对接接口（含我的收藏 / 点赞 / 评论） |
| 文章详情 | `pages/post/index` | 已对接接口（含收藏 / 点赞） |
| 页面列表 | `pages/pagesList/index` | 已对接接口 |
| 页面详情 | `pages/page/index` | 已对接接口 |
| 我的（登录） | `pages/userProfile/index` | 已对接接口（账号登录 + 我的收藏 / 点赞 / 评论） |

## 部署与运维注意

- **403 白名单**：微信小程序请求会携带 `Referer: https://servicewechat.com/...`，需在线上后台 note 项目「项目设置 → 域名白名单」加入 `servicewechat.com`，否则所有项目接口返回 403
- **后端接口**：登录（`/api/login`）、用户数据（`/api/me/*`）、收藏 / 点赞（project 下 favorites / likes）均支持 Sanctum Bearer token；收藏 / 点赞写接口已在后端 `bootstrap/app.php` 做 CSRF 豁免（本身有登录认证保护）
- 后端代码改动需部署到线上 `api.lyove.com` 后生效

## 开发/预览

使用微信开发者工具导入本目录即可。`project.config.json` 中的 `appid` 为模板原值，请替换为你自己的小程序 AppID。

## 原框架说明

- 原作者：NiceBoy
- 原仓库：https://github.com/kothing/WordPress-MinApp
