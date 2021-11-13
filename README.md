# jfdmk

*jfdmk* 在 [*Jellyfin*](https://jellyfin.org/) 中添加了弹幕功能。


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
console.log(__INITIAL_STATE__.mediaInfo.season_id)
```

这里我们假定 Jellyfin 上的剧集顺序与 bilibili 上的一一对应，同一季度在记录数据后无需对每一集进行补充，之后可能会支持其他的匹配模式。

这一数据库内容应当可以公开，之后会考虑提供公共的数据库。

### 配置服务

然后你需要配置服务，复制 `.env.example` 文件到 `.env` 并填写，例如：

```
PORT=10086
BILIBILI_API_ENDPOINT=api.bilibili.com
```

配置完成之后，就可以启动服务器了：（需要 `node >= 16.0.0` ）

```bash
$ yarn start
```

或者使用 docker 镜像 `std4453/jfdmk:latest` 运行，默认端口 10086，注意 `data/db.json` 需要从外部挂载。

### 修改 Jellyfin

最后，你需要修改 Jellyfin 的 HTML 文件，在 `index.html` 的 `</body>` 前加入：

```html
<script src="//your_jfdmk_host/static/index.js" defer></script>
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

## 作者

张海川 - Haichuan Zhang - [me@std4453.com](mailto:me@std4453.com) - [Homepage](https://blog.std4453.com:444)
