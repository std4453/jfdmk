import { BehaviorSubject } from 'rxjs';
import commentsEffect from './comments';

let unmount = null;
const baseURL = new URL(document.currentScript.src);
const basePath = `${baseURL.protocol}//${baseURL.host}`;
const itemIdSubject = new BehaviorSubject('');

if (Math.max(window.innerWidth, window.innerHeight) >= 1000) {
  const tryMount = () => {
    if (location.hash !== "#!/video") return false;
    const video = document.querySelector('video');
    if (!video) return false;
    const page = Array.from(
      document.querySelectorAll("div[id=videoOsdPage]")
    ).find((el) => !el.classList.contains("hide"));
    if (!page) return false;
    const buttons = page.querySelector(".buttons.focuscontainer-x");
    if (!buttons) return false;
    const osdTimeText = buttons.querySelector(".osdTimeText");
    if (!osdTimeText) return false;
    if (!itemIdSubject.getValue()) return false;
    if (!unmount) {
      console.log('[jfdmk] initializing comments...');
      unmount = commentsEffect({
        video,
        buttons,
        osdTimeText,
        itemIdSubject,
        basePath,
      });
    }
    return true;
  };
  const update = () => {
    if (!tryMount()) {
      if (unmount) {
        console.log('[jfdmk] finalizing comments...');
        unmount();
        unmount = null;
        itemIdSubject.next('');
      }
    }
  };
  setInterval(update, 250);

  // intercept fetch to get itemId
  const originalFetch = window.fetch;
  window.fetch = (...args) => {
    const url = args[0];
    {
      const result = /\/Items\/([0-9a-fA-F]+)\/PlaybackInfo/.exec(url);
      if (result) {
        if (itemIdSubject.getValue() !== result[1]) {
          itemIdSubject.next(result[1]);
        }
      }
    }
    return originalFetch(...args);
  };

  console.log('[jfdmk] waiting...');
}
