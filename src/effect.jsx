import ReactDOM from "react-dom";
import React from "react";
import Comments from "./Comments";

const effect = ({ video, buttons, osdTimeText, itemIdSubject, basePath }) => {
  const root = document.createElement("div");
  document.body.appendChild(root);
  const buttonContainer = document.createElement("div");
  buttons.insertBefore(buttonContainer, osdTimeText.nextSibling);
  ReactDOM.render(
    <Comments
      video={video}
      buttonContainer={buttonContainer}
      itemIdSubject={itemIdSubject}
      basePath={basePath}
    />,
    root
  );

  return () => {
    ReactDOM.unmountComponentAtNode(root);
    buttonContainer.remove();
    root.remove();
  };
};

export default effect;
