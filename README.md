# Aine 微信小程序（Aine-wx-minapp）

基于 [WordPress-MinApp](https://github.com/kothing/WordPress-MinApp) 框架搭建的微信小程序，页面交互与框架代码保持一致。

## 当前状态

- **接口域名**：`https://api.lyove.com`（`utils/base.js` 的 `API_HOST`）
- **后端**：同目录 `laravel-aine-master`（Aine CMS，Laravel + Vue）线上部署，项目标识符 `cms`
- **接口适配**：`utils/api.js` 已全部切换到 Aine CMS 接口（`/api/project/cms/...`），并将响应标准化为页面使用的结构，页面代码保持原框架不变
- **首页 / 栏目 / 列表 / 详情页**：已对接真实接口，可展示文章、分类、搜索、页面内容
- **登录页（我的）**：
  - 账户登录界面完整保留（顶部栏头像登录入口 + "我的"页登录/登出/清除缓存）
  - 登录后的业务功能（我的点赞、我的收藏、我的评论、订阅更新、工具箱）**暂未实现**，点击提示"功能开发中，敬请期待"

## 接口适配对照

后端接口前缀：`https://api.lyove.com/api/project/cms`（`cms` 为项目标识符，可在后台「项目设置 → API Settings」查看，支持 slug 或 UUID）

| 页面调用（原框架） | Aine CMS 实际接口 |
| --- | --- |
| 站点信息 `getSiteInfo` | `GET /api/project/cms`（返回 name / description） |
| 文章列表 `getArticlesList` | `GET /api/project/cms/articles?sort=published_at:desc&limit=10&offset=0&timestamps=true` |
| 分类过滤 | 追加 `&filters.category.id={分类id}`（关联过滤） |
| 搜索 | `GET /api/project/cms/articles/search?query={关键词}&limit=10&offset=0` |
| 首页轮播 `getStickyArticles` | `GET /api/project/cms/portal` → `data.slider` |
| 文章详情 `getArticleByID` | `GET /api/project/cms/articles/{id}?timestamps=true` |
| 分类列表 `getCategories` | `GET /api/project/cms/categories` |
| 分类详情 `getCategoryByID` | `GET /api/project/cms/categories/{id}` |
| 页面列表 `getPagesList` | `GET /api/project/cms/pages?timestamps=true` |
| 页面详情 `getPageByID` | `GET /api/project/cms/pages/{id}?timestamps=true` |

### 数据标准化（utils/api.js 内）

后端响应统一为 `{ success, code, message, data }`，`base.js` 自动解包；内容字段在 `api.js` 中标准化为页面结构：

| 页面使用 | 后端字段 |
| --- | --- |
| `item.title.rendered` | `item.title` |
| `item.excerpt.rendered` | `item.excerpt` |
| `item.meta.thumbnail` | `item['featured-image'].full_url_thumb`（无缩略图则用 full_url） |
| `item.category[0].name` | `item.category.title` |
| `item.author.name` | `item.author.name` |
| `item.date` | `item.published_at`（取日期部分） |

## 页面结构

| 页面 | 路径 | 状态 |
| --- | --- | --- |
| 首页 | `pages/home/index` | 已对接接口 |
| 栏目 | `pages/category/index` | 已对接接口 |
| 文章列表 | `pages/articleList/index` | 已对接接口 |
| 文章详情 | `pages/article/index` | 已对接接口 |
| 页面列表 | `pages/pagesList/index` | 已对接接口 |
| 页面详情 | `pages/page/index` | 已对接接口 |
| 我的（登录） | `pages/userProfile/index` | 登录界面保留，业务功能待开发 |

## 开发/预览

使用微信开发者工具导入本目录即可。`project.config.json` 中的 `appid` 为模板原值，请替换为你自己的小程序 AppID。

## 原框架说明

- 原作者：NiceBoy
- 原仓库：https://github.com/kothing/WordPress-MinApp
