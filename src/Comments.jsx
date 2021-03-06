import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";

import {
  CommentManager,
  CommentProvider,
  BilibiliFormat,
} from "@std4453/comment-core-library";
import "@std4453/comment-core-library/dist/css/style.min.css";
import DanmakuButton from "./DanmakuButton";

import "./index.css";

const Comments = ({ video, buttonContainer, itemIdSubject, basePath }) => {
  const [container, setContainer] = useState(null);
  const cm = useMemo(() => {
    if (!container) return;
    return new CommentManager(container);
  }, [container]);
  useEffect(() => {
    if (!cm) return;
    cm.init();
  }, [cm]);
  useEffect(() => {
    if (!video || !cm) return;
    video.addEventListener("timeupdate", () => {
      cm.time(video.currentTime * 1000);
    });
    video.addEventListener("play", () => {
      cm.start();
    });
    video.addEventListener("playing", () => {
      cm.start();
    });
    video.addEventListener("waiting", () => {
      cm.stop();
    });
    video.addEventListener("pause", () => {
      cm.stop();
    });
    video.addEventListener("seeked", () => {
      cm.clear();
    });
  }, [cm, video]);
  useEffect(() => {
    if (!cm) return;
    const listener = () => {
      cm.width = window.innerWidth;
      cm.height = window.innerHeight;
      cm.setBounds();
    };
    window.addEventListener("resize", listener);
    return () => {
      window.removeEventListener("resize", listener);
    };
  }, [cm]);

  const [visible, setVisible] = useState(true);

  const [itemId, setItemId] = useState(itemIdSubject.getValue());
  useEffect(() => {
    const subscription = itemIdSubject.subscribe((itemId) => setItemId(itemId));
    return () => {
      subscription.unsubscribe();
    };
  }, [itemIdSubject]);

  useEffect(() => {
    if (!itemId || !video || !cm) return;
    (async () => {
      try {
        const data = await ApiClient.getItem(
          ApiClient.getCurrentUserId(),
          itemId
        );
        const { Type, SeriesName, ParentIndexNumber, IndexNumber } = data;
        if (Type !== "Episode") {
          throw new Error("not_found");
        }
        const resp = await fetch(
          `${basePath}/query?series=${encodeURIComponent(
            SeriesName
          )}&season=${ParentIndexNumber}&episode=${IndexNumber}`
        );
        const { code, query } = await resp.json();
        if (code !== 200) {
          throw new Error("not_found");
        }
        const provider = new CommentProvider();
        provider.addParser(
          new BilibiliFormat.XMLParser(),
          CommentProvider.SOURCE_XML
        );
        provider.addTarget(cm);
        provider.addStaticSource(
          CommentProvider.XMLProvider("GET", `${basePath}/danmaku?${query}`),
          CommentProvider.SOURCE_XML
        );
        await provider.load();
        if (!video.paused) {
          console.log("[jfdmk] Danmaku loaded, starting CommentManager");
          cm.start();
          cm.time(video.currentTime * 1000);
          cm.clear();
        }
      } catch (e) {
        if (e.message === "not_found") {
          console.log(`[jfdmk] ${itemId} has no matching danmaku`);
        } else {
          console.error(`[jfdmk] loading danmaku failed for ${itemId}`);
          console.error(e);
        }
      }
    })();
  }, [itemId, cm, video, basePath]);

  const [opacity, setOpacity] = useState(1.0);
  const [speed, setSpeed] = useState(0.75);
  useEffect(() => {
    if (!cm) return;
    cm.options.scroll.scale = 1 / speed;
  }, [cm, speed]);
  const [fontSize, setFontSize] = useState(1.0);

  return (
    <>
      <div className="abp">
        <div
          style={{
            position: "fixed",
            left: 0,
            top: 0,
            width: "100vw",
            height: "100vh",
            pointerEvents: "none",
            zIndex: 1,
            visibility: visible ? "visible" : "hidden",
            opacity,
          }}
          className="container"
          ref={setContainer}
        ></div>
      </div>
      {ReactDOM.createPortal(
        <DanmakuButton 
          visible={visible} 
          setVisible={setVisible} 
          opacity={opacity}
          setOpacity={setOpacity}
          speed={speed}
          setSpeed={setSpeed}
          fontSize={fontSize}
          setFontSize={setFontSize}
        />,
        buttonContainer
      )}
    </>
  );
};

export default Comments;
