import { useState, useEffect } from "preact/hooks";
import Typography from '@mui/material/Typography';
import { route } from 'preact-router';
// import { MuiColorInput } from 'mui-color-input'
import {
  Box,
  Button,
  IconButton,
  InputLabel,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Slider,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  createTheme
} from '@mui/material';
import { random, readability, TinyColor } from '@ctrl/tinycolor'; // Import tinycolor library
import { ThemeProvider } from '@mui/material/styles';
const theme = createTheme({
  components: {
    MuiFormLabel: {
      styleOverrides: {
        root: {
        color: 'inherit',
        },
      },
    },
    MuiButtonBase: {
      styleOverrides: {
        root: {
        color: 'inherit !important',
        },
      },
    },
    MuiToggleButtonBase: {
      styleOverrides: {
        root: {
        color: 'inherit',
        },
      },
    },  
    MuiInputBase: {
      styleOverrides: {
        root: {
        color: 'inherit !important',
        borderColor: 'inherit !important',
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: 'inherit !important',
          borderColor: 'inherit !important',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'inherit',
            '&:hover': {
              borderColor: 'inherit !important',
            }
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
        color: 'inherit',
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        root: {
        color: 'inherit',
        },
      },
    },
  },
 });

const App = () => {
  const [foreground, setForeground] = useState("");
  const [background, setBackground] = useState("");
  const [contrastRatio, setContrastRatio] = useState("");
  const [chosenSuggestion, setChosenSuggestion] = useState("");
  const [foregroundHex, setForegroundHex] = useState("");
  const [backgroundHex, setBackgroundHex] = useState("");
  const [grid, setGrid] = useState([]);
  const [contrastThreshold, setContrastThreshold] = useState(4.5);
  const [colorType, setColorType] = useState("hex");
  const [errorMessage, setErrorMessage] = useState("");
  const migrate = {
    // cmyk: 'toCmykString',
    hex: 'toHexString',
    rgb: 'toRgbString',
    hsl: 'toHslString',
    // hsv: 'toHsvString',
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let fg = params.get("fg");
    let bg = params.get("bg");
    let threshold = parseFloat(params.get("threshold"));
    let fgType = getColorType(fg);
    let bgType = getColorType(bg);

    if (fg && bg && fgType !== bgType) {
      setErrorMessage("Colors must be of the same type");
      fg = null;
      bg = null;
    }

    // Simplify color type handling using TinyColor
    if (fg) {
      fg = new TinyColor(fg);
    }
    if (bg) {
      bg = new TinyColor(bg);
    }

    const inferredType = fgType || bgType || "hex";
    setColorType(inferredType);
    fg = (fg || random())[migrate[inferredType]]();
    bg = (bg || random())[migrate[inferredType]]();
    setForegrounds(fg);
    setBackgrounds(bg);
    if (threshold) {
      setContrastThreshold(threshold)
    }
    const encodedForeground = encodeURIComponent(foreground);
    const encodedBackground = encodeURIComponent(background);
    const encodedThreshold = encodeURIComponent(contrastThreshold);

    route(`?fg=${encodedForeground}&bg=${encodedBackground}&threshold=${encodedThreshold}`, true);
    setContrastRatio(getContrastRatio(fg, bg));
  }, []);
  function debounce(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(func, wait, ...args);
    };
  }

  // Use TinyColor for color type detection
  function getColorType(color) {
    if (!color) return null;
    return new TinyColor(color).format;
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
        if (getContrastRatio(newFg, newBg) >= parseFloat(contrastThreshold)) {
          let score = getContrastRatio(newFg, newBg);
          newGrid.push({
            fg: newFg,
            bg: newBg,
            score,
            weight: Math.abs(i) + Math.abs(j) + Math.abs(score-contrastThreshold),
            labelFg: `FG ${i > 0 ? "+" : ""}${i}`,
            labelBg: `BG ${j > 0 ? "+" : ""}${j}`
          });
        }
      }
    }

    if (newGrid.length) {
      let filteredGrid = removeDuplicateScores(newGrid);
      setGrid(filteredGrid.sort((a,b)=> a.weight - b.weight));
      setChosenSuggestion(filteredGrid[0]);
      console.log(filteredGrid[0, chosenSuggestion]);
    } else {
      setGrid([]);
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
  }, [foreground, background, contrastThreshold, colorType]);

  const handleColorChange = (hexColor, isForeground) => {
    const color = convertColor(hexColor, colorType);
    if (isForeground) {
      setForegroundHex(hexColor);
      setForeground(color);
      return
    }
    setBackgroundHex(hexColor);
    setBackground(color);
  };

  const handleSlider = (event) => setContrastThreshold(event.target.value);
  const debouncedHandleChange = debounce(handleSlider, 100); // 100ms debounce time

  const handleColorTypeSelection = (event) => {
    let {value} = event.target;
    setColorType(value);
    setForeground(convertColor(foreground, value));
    setBackground(convertColor(background, value));
  };

  const handleColorTypeChange = (_event, value) => {
    setColorType(value);
    setForeground(convertColor(foreground, value));
    setBackground(convertColor(background, value));
  };

  const handleSuggestionPreview = (_event, value) => {
    setChosenSuggestion(grid[value]);
  };

  const setBackgrounds = (color) => {
    setBackground(color);
    setBackgroundHex(new TinyColor(color)[migrate.hex]())
  }

  const setForegrounds = (color) => {
    setForeground(color);
    setForegroundHex(new TinyColor(color)[migrate.hex]())
  }

  const convertColor = (color, newType) => {
    return new TinyColor(color)[migrate[newType]]();
  };

  const marks = {
    AA: [
      {
        value: 3.0,
        label: 'Minimum Large Text',
      },
      {
        value: 4.5,
        label: 'Minimum Text',
      }
    ],
    AAA: [
      {
        value: 4.5,
        label: 'Minimum Large Text',
      },
      {
        value: 7.0,
        label: 'Minimum Text',
      }
    ]
  };

  return (
    <ThemeProvider theme={theme}>
    <div>
      {errorMessage && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{errorMessage}</div>
      )}
      <section>
        <ToggleButtonGroup
          color="primary"
          value={colorType}
          exclusive
          onChange={handleColorTypeChange}
          aria-label="text alignment"
        >
          {Object.keys(migrate).map((type) => (
            <ToggleButton key={type} value={type}>{type.toUpperCase()}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <figure>
          <figcaption class="rancho-regular">Contrast <b>Compass</b></figcaption>
          <img width="90" height="75" src="compass-companion-120x100.webp" alt=""></img>
        </figure>
        <div style={{    display: grid }}>
        <FormControl style={{display: 'none'}} fullWidth>
          <InputLabel id="demo-simple-select-label">Type</InputLabel>
          <Select
            color="primary"
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={colorType}
            label={colorType.toUpperCase()}
            onChange={handleColorTypeSelection}
          >
            {Object.keys(migrate).map((type) => (
              <MenuItem key={type} value={type}>{type.toUpperCase()}</MenuItem>
            ))}
          </Select>
        </FormControl>
            {/* <MuiColorInput format={colorType} value={foreground} onChange={(value) => debounce(setForegrounds(value),100)} /> */}
        <div>
            <Box className="colors">
              <input
                aria-label="foreground"
                type="color"
                value={foregroundHex}
                onChange={(e) => handleColorChange(e.target.value, true)}
                style={{ width: "50px", height: "50px", marginRight: "10px" }}
              />
                            <input
                aria-label="background"
                type="color"
                value={backgroundHex}
                onChange={(e) => handleColorChange(e.target.value, false)}
                style={{ width: "50px", height: "50px", marginRight: "10px" }}
              />
              {/* <TextField
                label={colorType}
                required
                type="text"
                value={foreground}
                onChange={(e) => setForegrounds(e.target.value)}
              /> */}
            </Box>
            <Box sx={{ width: 160 }}>
              <Typography id="non-linear-slider" gutterBottom>
              Threshold: {contrastThreshold.toFixed(1)}
              </Typography>
              <Slider
                value={contrastThreshold}
                min={3.0}
                step={0.1}
                max={21.0}
                onChange={debouncedHandleChange}
                valueLabelDisplay="auto"
              />
            </Box>
          </div>
          <IconButton
            style={{display: 'none'}}
            onClick={() => {
              setForegrounds(random()[migrate[colorType]]());
              setBackgrounds(random()[migrate[colorType]]());
            }}
          >
            <span class="material-symbols-outlined">
              shuffle
            </span>
          </IconButton>
        </div>
        <div style="height: 100%">
          <div style="display: grid; grid-template-columns: 1fr; height: 100%">
          <Button
            disabled
            className="original"
            style={{
              backgroundColor: background,
              display: 'grid !important',
              gridTemplateColumns: '50px 1fr'
            }}
          >
            <div style={{ fontSize: '18px', color: foreground}}>{contrastRatio}</div>
            <div style={{ fontSize: '12px', color: foreground, marginTop: '0.5rem' }}>
              <div>{foreground}</div>
              <div>{background}</div>
            </div>
          </Button>
        {
          chosenSuggestion && chosenSuggestion.bg && chosenSuggestion.fg ?
          <Button
            onClick={copy}
            className="suggestion"
            style={{
              backgroundColor: chosenSuggestion.bg,
              display: 'grid !important',
              gridTemplateColumns: '50px 1fr'
            }}
          >
            <div style={{ fontSize: '18px', color: chosenSuggestion.fg}}>{chosenSuggestion.score}</div>
            <div style={{ fontSize: '12px', color: foreground, marginTop: '0.5rem' }}>
              <div>{chosenSuggestion.fg}</div>
              <div>{chosenSuggestion.bg}</div>
            </div>
          </Button> :
          <div
            style={{
              border: "0 none",
              padding: "1rem",
              textAlign: "center",
              borderRadius: "0.25rem",
              height: "100px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            <div>Sample Text</div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>No Preview Available</div>
            <div style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
            </div>
          </div>
        }
          </div>
        </div>
      </section>
      <FormControl component="fieldset" style={{display: 'block', width: '110%'}}>
        <FormLabel component="legend">Suggestions:</FormLabel>
        <RadioGroup
          aria-label="color-format"
          name="color-format-group"
          value={chosenSuggestion}
          onChange={handleSuggestionPreview}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(50px, 70px))",
            gap: "1rem",
            paddingLeft: ".5em"
          }}
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
                borderRadius: "0.25rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center"
              }}
              value={index}
              control={<Radio style={{display: 'none'}} />} label={
                <div>
                  <div style={{ fontSize: '1.5rem', marginTop: '0.5rem' }}>
                    {suggestion.score}
                  </div>
                  <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                    {suggestion.labelFg}
                  </div>
                  <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>
                    {suggestion.labelBg}
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