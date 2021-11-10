# jfdmk

*jfdmk* 在 [*Jellyfin*](https://jellyfin.org/) 中添加了弹幕功能。

它使用 [CommentCoreLibrary](https://github.com/jabbany/CommentCoreLibrary) 作为弹幕渲染引擎，用 [Bilibili 弹幕](https://github.com/SocialSisterYi/bilibili-API-collect/blob/master/danmaku/danmaku_xml.md) 作为数据源。

为了使用它，你需要创建 `data/db.json` ，内容例如：

```json
{
  "items": [
    {
      "id": "368fb92303b596947aad104dca3186f0",
      "query": "oid=424334074&pid=676072785"
    }
  ]
}
```

这里的 `id` 是 Jellyfin 中的视频 ID，可以查看 console 输出：

```
[jfdmk] Video itemId is 368fb92303b596947aad104dca3186f0, fetching danmaku list
```

`query` 是 Bilibili 上对应视频的 `oid` 和 `pid` ，你可以打开对应的视频页面然后在 console 中输入：

```js
console.log(`oid=${__INITIAL_STATE__.epInfo.cid}&pid=${__INITIAL_STATE__.epInfo.aid}`)
```

也许这一流程能变得更简单，等我研究研究。

然后你需要启动服务器：

```bash
$ yarn start
```

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

这里的 `JELLYFIN_IMAGE` 可以替换成其他的 Jellyfin 镜像，默认是 `linuxserver/jellyfin:latest`，以及由于 jfdmk 本体部署在其他域名下，你需要在 build 时指定它。之所以需要本地 build 而非提供公用镜像，是因为没有什么简单的动态配置手段，如果你对自己的 jfdmk 部署域名没有保密需求，你也可以配置 CI 自动 build 并 push 到 docker hub。

镜像 build 完成之后，你可以将原先的 Jellyfin 镜像替换成 `<your_scope>/jellyfin_jfdmk:latest` 。

注意这样 build 得到的镜像无法自动更新 Jellyfin 版本，你可以写一个脚本定期自动运行上述 build 流程。

jfdmk 只在 Web 端启用，手机端的渲染效果比较差，之后可能会启用。

## 作者

张海川 - Haichuan Zhang - [me@std4453.com](mailto:me@std4453.com) - [Homepage](https://blog.std4453.com:444)
