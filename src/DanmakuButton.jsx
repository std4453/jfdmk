import {
  Backdrop,
  List,
  ListItem,
  ListItemText,
  Popper,
  Paper,
  Grow,
  createTheme,
  ThemeProvider,
  Slider,
  Grid,
} from "@mui/material";
import { makeStyles } from "@mui/styles";
import clsx from "clsx";
import React, { useCallback, useState } from "react";

const theme = createTheme({
  palette: {
    mode: "dark",
  },
});

const useStyles = makeStyles({
  list: {
    width: 300,
  },
  text: {
    width: 100,
  },
  slider: {
    margin: '-8px 0',
  },
});

const DanmakuButton = ({ 
  visible, 
  setVisible,
  opacity,
  setOpacity,
  speed,
  setSpeed,
  fontSize,
  setFontSize,
}) => {
  const [buttonEl, setButtonEl] = useState(null);
  const [open, setOpen] = useState(false);
  const handleSubtitlesClick = useCallback(() => {
    setVisible((visible) => !visible);
  }, [setVisible]);
  const handleSettingsClick = useCallback(() => {
    setOpen((open) => !open);
  }, []);
  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);
  const handleOpacityChange = useCallback((event, value) => {
    setOpacity(value / 100);
  }, [setOpacity]);
  const handleSpeedChange = useCallback((event, value) => {
    setSpeed(value / 100);
  }, [setSpeed]);
  const handleFontSizeChange = useCallback((event, value) => {
    setFontSize(value / 100);
  }, [setFontSize]);

  const classes = useStyles();

  return (
    <ThemeProvider theme={theme}>
      <button
        className="paper-icon-button-light"
        onClick={handleSubtitlesClick}
      >
        <span
          className={clsx(
            "material-icons",
            visible ? "subtitles" : "subtitles_off"
          )}
        />
      </button>
      <button
        className="paper-icon-button-light"
        onClick={handleSettingsClick}
        ref={setButtonEl}
      >
        <span className={clsx("material-icons", "settings_input_component")} />
      </button>
      <Backdrop
        open={open}
        onClick={handleClose}
        style={{
          zIndex: 10,
        }}
      />
      <Popper
        open={open}
        anchorEl={buttonEl}
        style={{
          zIndex: 11,
        }}
        transition
      >
        {({ TransitionProps }) => (
          <Grow {...TransitionProps} timeout={250}>
            <Paper
              elevation={16}
              sx={{
                backgroundColor: "background.paper",
                backgroundImage: "none",
                transformOrigin: "center bottom",
              }}
            >
              <List className={classes.list}>
                <ListItem>
                  <Grid container alignItems="center">
                    <Grid item className={classes.text}>
                      <ListItemText primary="弹幕透明度" />
                    </Grid>
                    <Grid item xs>
                      <Slider
                        min={0}
                        max={100}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(x) => `${x}%`}
                        defaultValue={opacity * 100}
                        onChangeCommitted={handleOpacityChange}
                        className={classes.slider}
                      />
                    </Grid>
                  </Grid>
                </ListItem>
                <ListItem>
                  <Grid container alignItems="center">
                    <Grid item className={classes.text}>
                      <ListItemText primary="弹幕速度" />
                    </Grid>
                    <Grid item xs>
                      <Slider
                        min={20}
                        max={160}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(x) => `${(x / 100).toFixed(2)}x`}
                        defaultValue={speed * 100}
                        onChangeCommitted={handleSpeedChange}
                        className={classes.slider}
                      />
                    </Grid>
                  </Grid>
                </ListItem>
                <ListItem>
                  <Grid container alignItems="center">
                    <Grid item className={classes.text}>
                      <ListItemText primary="弹幕字号" />
                    </Grid>
                    <Grid item xs>
                      <Slider
                        min={50}
                        max={170}
                        valueLabelDisplay="auto"
                        valueLabelFormat={(x) => `${x}%`}
                        defaultValue={fontSize * 100}
                        onChangeCommitted={handleFontSizeChange}
                        className={classes.slider}
                      />
                    </Grid>
                  </Grid>
                </ListItem>
              </List>
            </Paper>
          </Grow>
        )}
      </Popper>
    </ThemeProvider>
  );
};

export default DanmakuButton;
