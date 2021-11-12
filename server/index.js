import express from "express";
import qs from "qs";
import axios from "axios";
import zlib from "zlib";
import { promisify } from "util";
import fs from "fs";

const app = express();

const inflate = promisify(zlib.inflateRaw);

app.get("/danmaku", async (req, res) => {
  try {
    const { data } = await axios({
      // override local dns
      url: `https://${
        process.env.BILIBILI_API_ENDPOINT
      }/x/v1/dm/list.so?${qs.stringify(req.query)}`,
      responseType: "arraybuffer",
      decompress: false,
      headers: {
        host: "api.bilibili.com",
        "accept-encoding": "gzip, deflate, br",
      },
    });
    const xmlStr = await inflate(data);
    res.type("text/xml");
    res.header("access-control-allow-origin", "*");
    res.send(xmlStr);
  } catch (e) {
    res.status(500);
    res.send("internal server error");
    console.log(e);
  }
});

app.use("/static", express.static("static"));

const readFile = promisify(fs.readFile);

let data = JSON.parse(await readFile("data/db.json", "utf8"));

fs.watchFile("data/db.json", async () => {
  try {
    console.log("db changed, loading new data");
    const newData = JSON.parse(await readFile("data/db.json", "utf8"));
    data = newData;
    console.log("db updated");
  } catch (e) {
    console.error("db reload failed", e);
  }
});

app.get("/query", async (req, res) => {
  try {
    const { data: jfEpisodeData } = await axios(
      `${process.env.JELLYFIN_HOST}/Users/${process.env.JELLYFIN_SERVICE_USER}/Items/${req.query.id}`,
      {
        headers: {
          "X-Emby-Token": process.env.JELLYFIN_API_KEY,
        },
      }
    );
    if (jfEpisodeData.Type !== "Episode") {
      res.send({ code: 404 });
      return;
    }
    const {
      SeriesName: seriesName,
      ParentIndexNumber: seasonIndex,
      IndexNumber: episodeIndex,
    } = jfEpisodeData;
    const season = data.seasons.find(
      ({ series, season }) => series === seriesName && season === seasonIndex
    );
    if (!season) {
      res.send({ code: 404 });
      return;
    }
    const { bilibili_ss } = season;
    const { data: bilibiliSeasonData } = await axios({
      url: `https://${process.env.BILIBILI_API_ENDPOINT}/pgc/web/season/section?season_id=${bilibili_ss}`,
      headers: {
        host: "api.bilibili.com",
      },
    });
    if (bilibiliSeasonData.code !== 0) {
      res.send({ code: 404 });
      return;
    }
    const {
      result: {
        main_section: { episodes },
      },
    } = bilibiliSeasonData;
    const episode = episodes[episodeIndex - 1];
    if (!episode) {
      res.send({ code: 404 });
      return;
    }
    const { aid, cid } = episode;
    res.header("access-control-allow-origin", "*");
    res.send({
      code: 200,
      query: `oid=${cid}&pid=${aid}`,
    });
  } catch (e) {
    res.status(500);
    res.send("Internal Server Error");
    console.error(e);
  }
});

app.listen(parseInt(process.env.PORT ?? '10086'), () => {
  console.log("Server started");
});
