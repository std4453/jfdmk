import { BehaviorSubject } from "rxjs";
import commentsEffect from "./effect";
import shimmer from "shimmer";

const baseURL = new URL(document.currentScript.src);
const basePath = `${baseURL.protocol}//${baseURL.host}`;
const itemIdSubject = new BehaviorSubject("");

const preHook = (obj, name, hook) => {
  shimmer.wrap(
    obj,
    name,
    (original) =>
      function () {
        hook(...arguments);
        return original.apply(this, arguments);
      }
  );
};

if (Math.max(window.innerWidth, window.innerHeight) >= 1000) {
  const videoPlayer = Xp.playback.playbackmanager.x.playbackManager
    .getPlayers()
    .find(({ id }) => id === "htmlvideoplayer");
  shimmer.wrap(
    videoPlayer,
    "createMediaElement",
    (original) =>
      async function (options) {
        itemIdSubject.next(options.item.Id);
        return (videoPlayer.videoElement = 
          await original.apply(this, arguments));
      }
  );
  preHook(videoPlayer, "onStartedAndNavigatedToOsd", () => {
    if (videoPlayer.unmount) {
      return;
    }
    console.log("[jfdmk] initializing comments...");
    const page = Xp.viewManager._.currentView();
    const buttons = page.querySelector(".buttons.focuscontainer-x");
    const osdTimeText = buttons.querySelector(".osdTimeText");
    videoPlayer.unmount = commentsEffect({
      video: videoPlayer.videoElement,
      buttons,
      osdTimeText,
      itemIdSubject,
      basePath,
    });
  });
  preHook(videoPlayer, "destroy", () => {
    console.log("[jfdmk] finalizing comments...");
    videoPlayer.unmount?.();
    videoPlayer.unmount = undefined;
    itemIdSubject.next("");
  });
}
