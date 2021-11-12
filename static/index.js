if (Math.max(window.innerWidth, window.innerHeight) >= 1000) {
  const baseURL = new URL(document.currentScript.src);
  const BASE_PATH = `${baseURL.protocol}//${baseURL.host}`;

  const script = document.createElement("script");
  script.src = `${BASE_PATH}/static/CommentCoreLibrary.min.js`;
  script.defer = true;
  let scriptLoaded = false;
  script.onload = () => {
    scriptLoaded = true;
  };
  document.head.appendChild(script);
  const loadCSS = (href) => {
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = href;
    document.head.appendChild(css);
  };
  loadCSS(`${BASE_PATH}/static/CommentCoreLibrary.css`);
  loadCSS(`${BASE_PATH}/static/index.css`);

  let abp = null;
  let container = null;
  let cm = null;

  const sleep = (time) =>
    new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, time);
    });

  let atVideoPage = false;
  let itemId = "";
  let showId = "";
  let cmInitialized = false;

  const loadDanmaku = async (itemId) => {
    try {
      if (itemId === "") {
        return;
      }
      console.log(`[jfdmk] Video itemId is ${itemId}, fetching danmaku list`);
      const resp = await fetch(`${BASE_PATH}/query?id=${itemId}`);
      const { code, query } = await resp.json();
      if (itemId === "") {
        return;
      }
      if (code !== 200) {
        console.log(`[jfdmk] ${itemId} has no matching danmaku`);
        return;
      }
      const provider = new CommentProvider();
      provider.addParser(
        new BilibiliFormat.XMLParser(),
        CommentProvider.SOURCE_XML
      );
      do {
        if (itemId === "") {
          return;
        }
        await sleep(250);
      } while (!cmInitialized);
      provider.addTarget(cm);
      provider.addStaticSource(
        CommentProvider.XMLProvider("GET", `${BASE_PATH}/danmaku?${query}`),
        CommentProvider.SOURCE_XML
      );
      await provider.load();
      const video = document.querySelector("video");
      if (video) {
        if (!video.paused) {
          console.log("[jfdmk] Danmaku loaded, starting CommentManager");
          cm.start();
          cm.time(video.currentTime * 1000);
          cm.clear();
        }
      }
    } catch (e) {
      console.error("[jfdmk] Failed to fetch danmaku");
      console.error(e);
    }
  };

  const initPlayer = async () => {
    let video = null;
    console.log("[jfdmk] Entering video page, waiting until ready");
    do {
      if (!atVideoPage) {
        return;
      }
      if (location.hash !== "#!/video") {
        console.log("[jfdmk]Hash changed, aborting");
        return;
      }
      video = document.querySelector("video");
      await sleep(250);
    } while (!scriptLoaded || !video);
    console.log("[jfdmk] Video ready, initializing danmaku");

    abp = document.createElement("div");
    abp.classList.add("abp");
    document.body.appendChild(abp);

    container = document.createElement("div");
    container.style.position = "fixed";
    container.style.left = "0px";
    container.style.top = "0px";
    container.style.width = "100vw";
    container.style.height = "100vh";
    container.style.pointerEvents = "none";
    container.classList.add("container");
    container.style.zIndex = 1;
    abp.appendChild(container);

    cm = new CommentManager(container);
    cm.options.scroll.scale = 1.75;
    window.cm = cm;

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

    cm.init();
    cmInitialized = true;
  };

  let controlsRoot = null;
  let danmakuVisible = true;

  const initControls = async () => {
    let buttons = null;
    let osdTimeText = null;
    do {
      if (!atVideoPage) {
        return;
      }
      const page = Array.from(
        document.querySelectorAll("div[id=videoOsdPage]")
      ).find((el) => !el.classList.contains("hide"));
      if (page) {
        buttons = page.querySelector(".buttons.focuscontainer-x");
        if (buttons) {
          osdTimeText = buttons.querySelector(".osdTimeText");
          if (osdTimeText) {
            break;
          }
        }
      }
      await sleep(250);
    } while (!buttons || !osdTimeText);

    controlsRoot = document.createElement("div");
    buttons.insertBefore(controlsRoot, osdTimeText.nextSibling);

    const button = document.createElement("button");
    button.classList.add("paper-icon-button-light");
    controlsRoot.appendChild(button);

    const span = document.createElement("span");
    span.classList.add("material-icons", "subtitles");
    button.appendChild(span);

    button.addEventListener("click", () => {
      danmakuVisible = !danmakuVisible;
      span.classList.remove("subtitles");
      span.classList.remove("subtitles_off");
      span.classList.add(danmakuVisible ? "subtitles" : "subtitles_off");
      container.style.visibility = danmakuVisible ? "visible" : "hidden";
    });

    console.log("[jfdmk] Control inserted");
  };

  const finiPlayer = () => {
    if (abp) {
      abp.remove();
      abp = null;
    }
    if (container) {
      container.remove();
      container = null;
    }
    if (cm) {
      cm = null;
    }
    itemId = "";
    showId = "";
    cmInitialized = false;
  };

  const finiControls = () => {
    if (controlsRoot) {
      controlsRoot.remove();
      controlsRoot = null;
    }
  };

  const onLocationChange = () => {
    if (location.hash === "#!/video") {
      if (!atVideoPage) {
        atVideoPage = true;
        initPlayer();
        initControls();
      }
    } else {
      if (atVideoPage) {
        atVideoPage = false;
        finiPlayer();
        finiControls();
      }
    }
  };

  window.addEventListener("hashchange", onLocationChange);
  window.addEventListener("popstate", onLocationChange);
  const originalPushState = history.pushState.bind(history);
  history.pushState = (...args) => {
    originalPushState(...args);
    onLocationChange();
  };
  const originalReplaceState = history.replaceState.bind(history);
  history.replaceState = (...args) => {
    originalReplaceState(...args);
    onLocationChange();
  };
  onLocationChange();

  // intercept fetch to get itemId
  const originalFetch = window.fetch;
  window.fetch = (...args) => {
    const url = args[0];
    {
      const result = /\/Shows\/([0-9a-fA-F]+)\/Episodes/.exec(url);
      if (result) {
        showId = result[1];
      }
    }
    {
      const result = /\/Items\/([0-9a-fA-F]+)\/PlaybackInfo/.exec(url);
      if (result) {
        if (itemId !== result[1]) {
          itemId = result[1];
          loadDanmaku(itemId);
        }
      }
    }
    return originalFetch(...args);
  };

  window.addEventListener("resize", () => {
    if (cm) {
      cm.width = window.innerWidth;
      cm.height = window.innerHeight;
      cm.setBounds();
    }
  });
}
