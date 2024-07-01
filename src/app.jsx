import { useState, useEffect } from "preact/hooks";
import Typography from '@mui/material/Typography';
import {
  Box,
  Button,
  IconButton,
  InputLabel,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Popover,
  Radio,
  RadioGroup,
  Select,
  Slider,
  ToggleButton,
  ToggleButtonGroup,
  createTheme
} from '@mui/material';
import { random, readability, TinyColor } from '@ctrl/tinycolor'; // Import tinycolor library
import { ThemeProvider } from '@mui/material/styles';
import querystring from 'query-string';

import LightDarkTheme from './theme'
const theme = createTheme(LightDarkTheme);
const HEX = "hex";

const Mode = {
  AA: 'AA',
  AAA: 'AAA'
};

const migrate = {
  // cmyk: 'toCmykString',
  hex: 'toHexString',
  rgb: 'toRgbString',
  hsl: 'toHslString',
  // hsv: 'toHsvString',
};

const App = () => {
  const params = new URLSearchParams(window.location.search);
  const [anchorOptionsMenu, setAnchorOptionsMenu] = useState(null);
  const [anchorFormatMenu, setAnchorFormatMenu] = useState(null);
  const [anchorRatingMenu, setAnchorRatingMenu] = useState(null);
  const [foreground, setForeground] = useState(
    params && params.get("fg") ?
      new TinyColor(params.get("fg")) :
      new TinyColor(random()[migrate.hsl]())
    );
  const [background, setBackground] = useState(
    params && params.get("bg") ?
      new TinyColor(params.get("bg")) :
      new TinyColor(random()[migrate.hsl]())
    );
  const [contrastRatio, setContrastRatio] = useState("");
  const [chosenSuggestion, setChosenSuggestion] = useState(
    params.get("fg1") && params.get("bg1") ?
      { fg:params.get("fg1"), bg:params.get("bg1")  }  :
      ""
    );
  const [grid, setGrid] = useState([]);
  const [level, setLevel] = useState(params.get('level') || 'AAA');
  const [contrastThreshold, setContrastThreshold] = useState(
    params.get('threshold') ?
      parseFloat(params.get('threshold')).toFixed(1) :
      4.5
    );
  const [colorType, setColorType] = useState(HEX);
  const [errorMessage, setErrorMessage] = useState("");
  const openOptions = Boolean(anchorOptionsMenu);
  const optionsMenuId = 'options-menu';
  const openFormat = Boolean(anchorFormatMenu);
  const formatMenuId = 'format-menu';
  const openRating = Boolean(anchorRatingMenu);
  const ratingMenuId = 'rating-menu';
  
  useEffect(() => {
    let fgType = foreground.format;
    let bgType = background.format;

    if (fgType !== bgType) {
      setErrorMessage("Colors must be of the same type");
    }

    const inferredType = fgType || bgType || HEX;
    setColorType(inferredType);
    setContrastRatio(getContrastRatio(foreground, background));
  }, []);

  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(func, wait, ...args);
    };
  }

  const getContrastRatio = (color1, color2) => {
    return readability(color1, color2).toFixed(2);
  };

  // Simplify color adjustment using TinyColor
  const adjustColor = (color, amount) => {
    const newColor = new TinyColor(color);
    return newColor.lighten(amount)[migrate[colorType]]();
  };

  // Removed unnecessary rgbToHSL function, TinyColor handles this automatically
  const generateGrid = () => {
    const newGrid = [];

    // Generate more variations
    for (let i = -40; i <= 40; i += 10) {
      for (let j = -40; j <= 40; j += 10) {
        if (i === 0 && j === 0) continue;
        let newFg = adjustColor(foreground, i);
        let newBg = adjustColor(background, j);
        if (parseFloat(getContrastRatio(newFg, newBg)) >= parseFloat(contrastThreshold)) {
          let score = getContrastRatio(newFg, newBg);
          newGrid.push({
            fg: newFg,
            bg: newBg,
            score,
            weight: Math.abs(i) + Math.abs(j) + Math.abs(score-contrastThreshold),
            label: `${i > 0 ? "+" : ""}${i}, ${j > 0 ? "+" : ""}${j}`
          });
        }
      }
    }

    if (newGrid.length) {
      let filteredGrid = removeDuplicateScores(newGrid);
      let persist = chosenSuggestion && filteredGrid.findIndex(o => o.fg === chosenSuggestion.fg && o.bg === chosenSuggestion.bg);
      setGrid(filteredGrid.sort((a,b)=> a.weight - b.weight));
      setChosenSuggestion(filteredGrid[persist >= 0 ? persist : 0]);
    } else {
      setGrid([]);
      setChosenSuggestion({});
    }
  };

  const removeDuplicateScores = (arr) => {
    const uniqueScores = {};
    return arr.filter(obj => {
      const key = obj.score;
      if (!uniqueScores[key]) {
        uniqueScores[key] = [obj]; // initialize array with the current object
        return true; // keep
      }
      const existingObjs = uniqueScores[key];
      const hasDuplicateFGorBG = existingObjs.some(
        o => o.fg === obj.fg || o.bg === obj.bg
      );
      if (!hasDuplicateFGorBG) {
        existingObjs.push(obj); // add the current object to the array
        return true; // keep
      }
      return false; // duplicate, remove
    });
  }

  const copy = async () => {
    await navigator.clipboard.writeText(`color: ${chosenSuggestion.fg}; background-color:${chosenSuggestion.bg}`);
  };

  useEffect(() => {
    generateGrid();
    // Update query string on change of color values and threshold

    const query = {...location.query };
    // const encodedForeground = encodeURIComponent(foreground);
    // const encodedBackground = encodeURIComponent(background);
    // const encodedThreshold = encodeURIComponent(contrastThreshold);

    query.fg = foreground;
    query.bg = background;
    query.threshold = contrastThreshold;
    query.level = level;
    const url = new URL(location.href);
    url.search = querystring.stringify(query);
    history.pushState({}, '', url.href);
  }, [foreground, background, contrastThreshold, colorType]);

  useEffect(() => {
    const query = {...location.query };
    query.fg1 = chosenSuggestion.fg;
    query.bg1 = chosenSuggestion.bg;
    const url = new URL(location.href);
    url.search = querystring.stringify(query);
    history.pushState({}, '', url.href);
  }, [chosenSuggestion]);

  useEffect(() => {
    const query = {...location.query };
    query.level = level;
    const url = new URL(location.href);
    url.search = querystring.stringify(query);
    history.pushState({}, '', url.href);
  }, [level]);

  const handleColorChange = (hexColor, isForeground) => {
    if (isForeground) {
      setForeground(new TinyColor(hexColor));
      return;
    }
    setBackground(new TinyColor(hexColor));
  };

  const handleSlider = (event) => setContrastThreshold(event.target.value);
  const debouncedHandleChange = debounce(handleSlider, 100); // 100ms debounce time

  const handleColorTypeSelection = (event) => {
    let {value} = event.target;
    setColorType(value);
  };

  const handleModeChange = (_event, value) => {
    if (value) setLevel(value);
    handleRatingMenuClose()
  };
  
  const handleColorTypeChange = (_event, value) => {
    if (value) setColorType(value);
    handleFormatMenuClose()
  };

  const handleSuggestionPreview = (_event, value) => {
    setChosenSuggestion(grid[value]);
  };

  const rating = {
    AA: {
      min: 3,
      marks :[
        {
          value: 4.5,
          label: '4.5',
        }
      ],
    },
    AAA: {
      min: 4.5,
      marks :[
        {
          value: 7.0,
          label: '7',
        }
      ],
    },
  }

  const handleOptionsMenuOpen = (event) => {
    setAnchorOptionsMenu(event.currentTarget);
  };

  const handleFormatMenuOpen = (event) => {
    setAnchorFormatMenu(event.currentTarget);
  };
  const handleRatingMenuOpen = (event) => {
    setAnchorRatingMenu(event.currentTarget);
  };

  const handleOptionsMenuClose = () => {
    setAnchorOptionsMenu(null);
  };

  const handleFormatMenuClose = () => {
    setAnchorFormatMenu(null);
  };
  const handleRatingMenuClose = () => {
    setAnchorRatingMenu(null);
  };

  return (
      <ThemeProvider theme={theme}>
        <div>
          {errorMessage && (
            <div style={{ color: "red", marginBottom: "1rem" }}>{errorMessage}</div>
          )}
          <section>
          <div style="height: 100%">
              <div className="decision">
              <Button
                disabled
                className="original"
                style={{
                  backgroundColor: `${background[migrate[colorType]]()}`,
                  display: 'grid !important',
                  gridTemplateColumns: '50px 1fr'
                }}
              >
                <div style={{ fontSize: '18px', color: `${foreground[migrate[colorType]]()}`}}>{contrastRatio}</div>
                <div style={{ fontSize: '14px', color: `${foreground[migrate[colorType]]()}`, marginTop: '0.5rem' }}>
                  <div>{foreground[migrate[colorType]]()}</div>
                  <div>{background[migrate[colorType]]()}</div>
                </div>
              </Button>
            {
              chosenSuggestion && chosenSuggestion.bg && chosenSuggestion.fg ?
              <Button
                onClick={copy}
                className="suggestion"
                style={{
                  backgroundColor: `${chosenSuggestion.bg}`,
                  display: 'grid !important',
                  gridTemplateColumns: '50px 1fr'
                }}
              >
                <div style={{ fontSize: '18px', color: `${chosenSuggestion.fg}`}}>{chosenSuggestion.score}</div>
                <div style={{ fontSize: '14px', color: `${chosenSuggestion.fg}`, marginTop: '0.5rem' }}>
                  <div>{chosenSuggestion.fg}</div>
                  <div>{chosenSuggestion.bg}</div>
                </div>
              </Button> :
              <Button
              disabled
              className="original"
              style={{
                display: 'grid !important',
                gridTemplateColumns: '50px 1fr'
              }}
            >
              <div style={{ fontSize: '18px'}}>N/A</div>
              <div style={{ fontSize: '14px', marginTop: '0.5rem' }}>
                <div>NO PREVIEW</div>
                <div></div>
              </div>
            </Button>
            }
              </div>
            </div>            <div style={{    display: grid }}>
            <FormControl style={{display: 'none'}} fullWidth>
              <InputLabel id="demo-simple-select-label">Type</InputLabel>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={colorType}
                label={colorType}
                onChange={handleColorTypeSelection}
              >
                {Object.keys(migrate).map((type) => (
                  <MenuItem key={type} value={type}>{type}</MenuItem>
                ))}
              </Select>
            </FormControl>
                {/* <MuiColorInput format={colorType} value={foreground} onChange={(value) => debounce(setForeground(value),100)} /> */}
            <div>
              <Box className="colors">
                <input
                  aria-label="foreground"
                  type="color"
                  value={foreground[migrate[HEX]]()}
                  onChange={(e) => handleColorChange(e.target.value, true)}
                />
                <input
                  aria-label="background"
                  type="color"
                  value={background[migrate[HEX]]()}
                  onChange={(e) => handleColorChange(e.target.value, false)}
                />
                <IconButton
                  aria-describedby={optionsMenuId}
                  onClick={handleOptionsMenuOpen}
                >
                  <span class="material-symbols-outlined">
                    more_vert
                  </span>
                </IconButton>
                <Popover
                id={optionsMenuId}
                open={openOptions}
                anchorEl={anchorOptionsMenu}
                onClose={handleOptionsMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
              >
                               <ToggleButtonGroup
                >
              <ToggleButton
                aria-describedby={formatMenuId}
                onClick={handleFormatMenuOpen}
              >
                {colorType}
              </ToggleButton>
              <Popover
                id={formatMenuId}
                open={openFormat}
                anchorEl={anchorFormatMenu}
                onClose={handleFormatMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
              >
                <ToggleButtonGroup
                  value={colorType}
                  exclusive
                  onChange={handleColorTypeChange}
                  aria-label="Toggle Button Group"
                >
                  {Object.keys(migrate).map((type) => (
                    <ToggleButton key={type} value={type}>{type}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Popover>
              <ToggleButton 
                aria-describedby={ratingMenuId}
                onClick={handleRatingMenuOpen}
              >
                {level}
              </ToggleButton>
              <Popover
                id={ratingMenuId}
                open={openRating}
                anchorEl={anchorRatingMenu}
                onClose={handleRatingMenuClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
                }}
              >
                <ToggleButtonGroup
                  className="wcag-rating"
                  value={level}
                  exclusive
                  onChange={handleModeChange}
                  aria-label="WCAG Rating"
                >
                  {Object.keys(Mode).map((type) => (
                    <ToggleButton key={type} value={type}>{type}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Popover>
                </ToggleButtonGroup>
              </Popover>

                  {/* <TextField
                    label={colorType}
                    required
                    type="text"
                    value={foreground}
                    onChange={(e) => setForeground(e.target.value)}
                  /> */}
                </Box>
                <Box className="threshold-box">
                  <Slider
                    color="neutral"
                    title="Threshold"
                    track="inverted"
                    aria-labelledby="threshold"
                    value={contrastThreshold}
                    min={rating[level].min}
                    step={0.1}
                    max={21.0}
                    marks={rating[level].marks}
                    onChange={debouncedHandleChange}
                    valueLabelDisplay="auto"
                  />
                  <Typography id="threshold" gutterBottom>
                    {parseFloat(contrastThreshold).toFixed(1)}
                  </Typography>
                </Box>
                <figure>
              <figcaption class="rancho-regular">Contrast <b>Compass</b></figcaption>
              <img width="90" height="75" src="compass-companion-120x100.webp" alt=""></img>
            </figure>
              </div>
              <IconButton
                style={{display: 'none'}}
                onClick={() => {
                  setForeground(random());
                  setBackground(random());
                }}
              >
                <span class="material-symbols-outlined">
                  shuffle
                </span>
              </IconButton>
            </div>
            
          </section>
          <FormControl component="fieldset" style={{display: 'block', width: '100%'}}>
            <FormLabel component="legend" id="suggestions-label">Suggestions:</FormLabel>
            <RadioGroup
              aria-label="color-format"
              name="color-format-group"
              value={chosenSuggestion}
              onChange={handleSuggestionPreview}
              className="suggestions"
            >
            {grid.map((suggestion, index) => {
              return (
                <FormControlLabel
                  key={index}
                  style={{
                    border: "0 none",
                    backgroundColor: suggestion.bg,
                    color: suggestion.fg,
                    padding: ".5rem",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center"
                  }}
                  value={index}
                  control={<Radio checked={suggestion === chosenSuggestion} style={{width: 0, height: 0}} />} label={
                    <div>
                      <div style={{ fontSize: '18px', marginTop: '0.5rem' }}>
                        {suggestion.score}
                      </div>
                      <div style={{ fontSize: '14px', marginTop: '0.25rem' }}>
                        {suggestion.label}
                      </div>
                    </div>
                  }
                />
              );
            })}
              </RadioGroup>
          </FormControl>
        </div>
      </ThemeProvider> 
  );
};

export default App;