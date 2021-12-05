# jfdmk

_jfdmk_ 在 [_Jellyfin_](https://jellyfin.org/) 中添加了弹幕功能。

它使用 [CommentCoreLibrary](https://github.com/jabbany/CommentCoreLibrary) 作为弹幕渲染引擎，用 [Bilibili 弹幕](https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/danmaku/danmaku_xml.md) 作为数据源。

## 使用

### 构建数据库

为了使用它，你需要创建 `data/db.json` ，内容例如：

```json
{
  "seasons": [
    {
      "series": "Banished from the Hero's Party, I Decided to Live a Quiet Life in the Countryside",
      "season": 1,
      "bilibili_ss": "39461"
    }
  ]
}
```

这里的 `series` 需要与 Jellyfin 中的剧集名称 **完全一致** ，如果你按照 [我的博客](https://blog.std4453.com:444/nas-from-zero-media-part/) 配置媒体栈，它应当与 [TheTVDB](https://thetvdb.com/) 中的名称相同。

`season` 为 1 开始的季度编号，同样与 TheTVDB 中的数据相同。

这两个字段用于匹配 bilibili 的季度，可以根据 Jellyfin 中的实际情况调整。

`bilibili_ss` 是 Bilibili 上对应视频的 `ss` ，你可以打开对应的番剧季度介绍页然后在 console 中输入：

```js
console.log(__INITIAL_STATE__.mediaInfo.season_id);
```

默认情况下，我们假定 Jellyfin 上的剧集顺序与 bilibili 上的一一对应，如果不对应的话可以使用 `ranges` 字段进行匹配，例如：

```json
{
  "seasons": [
    {
      "series": "Banished from the Hero's Party, I Decided to Live a Quiet Life in the Countryside",
      "season": 1,
      "ranges": [
        {
          "from": 2,
          "to": 6,
          "bilibili_ss": "39461",
          "bilibili_from": 3
        }
      ]
    }
  ]
}
```

这里的 `from` 、 `to` 和 `bilibili_from` 参数均为 1 开始的集数，如上的例子即表示：

> Jellyfin 中的第 2 ~ 6 集（包括头尾）对应 bilibili 上 ss=39461 的第 3 ~ 7 集

注意：
- `bilibili_ss` 字段和 `ranges` 字段只能存在一个。
- 如果 `ranges` 中的对象不包含 `from` 字段，则视为从第一集开始。
- 如果不包含 `to` 字段，则视为 `from` 后的所有集数。
- 如果不包含 `bilibili_ss` 字段，则视为从 bilibili 的第 1 集开始。
- `ranges` 中的所有条目会从前到后匹配，直到找到第一个符合要求的。
- 相同的 `series` 和 `season` 只能存在一条，多余的会被忽略。

_TODO: 这一数据库内容应当可以公开，之后会考虑提供公共的数据库。_

### 启动服务

你可以使用 docker 镜像 `std4453/jfdmk:latest` 运行，这样的话可以跳过下面的步骤。

首先你需要安装依赖：

```bash
$ yarn install --production=true
```

然后需要编译前端：

```bash
$ yarn build
```

现在可以启动服务器了：

```bash
$ yarn start
```

默认端口为 10086，你也可以通过 `PORT` 环境变量更改端口。

请注意，使用 docker 运行时， `data/db.json` 需要从外部挂载。

### 修改 Jellyfin

最后，你需要修改 Jellyfin 的 HTML 文件，在 `index.html` 的 `</body>` 前加入：

```html
<script src="//your_jfdmk_host/dist/index.js" defer></script>
```

刷新之后，打开对应的视频，就应该能看到弹幕了。

如果你使用容器部署 Jellyfin，你需要修改的文件位于 `/usr/share/jellyfin/web/index.html` ，不过这样的问题在于并不能持久化，对此你可以在本地 build 包含 jfdmk 的 Jellyfin 镜像，例如：

```bash
docker build \
	-f Dockerfile.Jellyfin \
	--build-arg JELLYFIN_IMAGE=linuxserver/jellyfin:latest \
	--build-arg JFDMK_HOST=<your_jfdmk_host> \
	-t <your_scope>/jellyfin-jfdmk:latest \
	.
```

这里的 `JELLYFIN_IMAGE` 可以替换成其他的 Jellyfin 镜像，默认是 `linuxserver/jellyfin:latest` ，以及由于 jfdmk 本体部署在其他域名下，你需要在 build 时指定它。之所以需要本地 build 而非提供公用镜像，是因为没有什么简单的动态配置手段，如果你对自己的 jfdmk 部署域名没有保密需求，你也可以配置 CI 自动 build 并 push 到 docker hub。

镜像 build 完成之后，你可以将原先的 Jellyfin 镜像替换成 `<your_scope>/jellyfin_jfdmk:latest` 。

注意这样 build 得到的镜像无法自动更新 Jellyfin 版本，你可以写一个脚本定期自动运行上述 build 流程。

jfdmk 只在 Web 端启用，手机端的渲染效果比较差，之后可能会启用。

## 开发

开发后端时使用：

```bash
$ yarn dev:server
```

它使用 `nodemon` 监听 `server/index.js` 的变化，在变化时自动重启服务器。

它也默认在 10086 端口上运行，注意不要和运行中的服务冲突。

开发前端时首先需要启动后端，然后：

```bash
$ yarn dev:frontend
```

它会在 3000 端口启动 `webpack-dev-server` ，自动打包前端代码，并反代后端请求。

开发时你需要在 Jellyfin 中插入：

```html
<script src="//your_jfdmk_dev_host/index.js" defer></script>
```

配置里允许从任何地址访问后端，请注意权限问题。

为了从 Jellyfin 中访问 `webpack-dev-server` 的 WebSocket，你需要在 `.env` 中配置：

```
DEV_WEBSOCKET_URL=ws://your_jfdmk_dev_host/ws
```

如果不进行配置，可能无法获得 HMR 支持。
## 作者

张海川 - Haichuan Zhang - [me@std4453.com](mailto:me@std4453.com) - [Homepage](https://blog.std4453.com:444)
