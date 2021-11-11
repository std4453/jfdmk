import express from "express";
import qs from "qs";
import axios from "axios";
import zlib from "zlib";
import { promisify } from "util";
import fs from 'fs';

const app = express();

const inflate = promisify(zlib.inflateRaw);

app.get("/danmaku", async (req, res) => {
  try {
    const { data } = await axios({
      // override local dns
      url: `https://36.156.48.35/x/v1/dm/list.so?${qs.stringify(req.query)}`,
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

app.get("/info", async (req, res) => {
  const item = data.items.find(({ id }) => id === req.query.id);
  res.header("access-control-allow-origin", "*");
  if (item) {
    res.send({
      code: 200,
      item,
    });
  } else {
    res.send({
      code: 404,
    });
  }
});

app.listen(parseInt(process.env.PORT), () => {
  console.log("Server started");
});
