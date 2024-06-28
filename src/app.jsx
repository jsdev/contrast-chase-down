import { useState, useEffect } from "preact/hooks";
import Typography from '@mui/material/Typography';
import { Box, IconButton, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, Slider, TextField, createTheme } from '@mui/material';
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

 console.log(theme);

const App = () => {
  const [foreground, setForeground] = useState("");
  const [background, setBackground] = useState("");
  const [contrastRatio, setContrastRatio] = useState("");
  const [chosenSuggestion, setChosenSuggestion] = useState("");
  const [chosenForeground, setChosenForeground] = useState("");
  const [chosenBackground, setChosenBackground] = useState("");
  const [chosenContrastRatio, setChosenContrastRatio] = useState("");
  const [foregroundHex, setForegroundHex] = useState("");
  const [backgroundHex, setBackgroundHex] = useState("");
  const [chosenForegroundHex, setChosenForegroundHex] = useState("");
  const [chosenbackgroundHex, setChosenBackgroundHex] = useState("");
  const [grid, setGrid] = useState([]);
  const [contrastThreshold, setContrastThreshold] = useState(4.5);
  const [colorType, setColorType] = useState("hex");
  const [errorMessage, setErrorMessage] = useState("");
  const migrate = {
    cmyk: 'toCmykString',
    hex: 'toHexString',
    rgb: 'toRgbString',
    hsl: 'toHslString',
    hsv: 'toHsvString',
  };
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let fg = params.get("fg");
    let bg = params.get("bg");
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
    setContrastRatio(getContrastRatio(fg, bg));
  }, []);

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
          newGrid.push({
            fg: newFg,
            bg: newBg,
            score: getContrastRatio(newFg, newBg),
            label: `FG ${i > 0 ? "+" : ""}${i}, BG ${j > 0 ? "+" : ""}${j}`
          });
        }
      }
    }

    if (newGrid.length) {
      setGrid(newGrid.sort((a,b)=> a.score - b.score));
      setChosenSuggestion(grid[0]);
      console.log(grid[0, chosenSuggestion]);
    } else {
      setGrid([]);
    }
  };

  useEffect(() => {
    generateGrid();
  }, [foreground, background, contrastThreshold, colorType]);

  const handleColorChange = (hexColor, isForeground) => {
    const color = convertColor(hexColor, colorType);
    if (isForeground) {
      setForegroundHex(hexColor);
      setForeground(color);

    } else {
      setBackgroundHex(hexColor);
      setBackground(color);
    }
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

  return (
    <ThemeProvider theme={theme}>
    <div style={{ padding: "1rem", fontFamily: "Arial, sans-serif" }}>
      {errorMessage && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{errorMessage}</div>
      )}
      <section style={{ marginBottom: "1rem", display: "grid", justifyContent:"space-between", gap: "1rem", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr)", alignItems: "center"
       }}>
        <div>
          <FormControl component="fieldset">
            <FormLabel component="legend">Color Format:</FormLabel>
            <RadioGroup
              aria-label="color-format"
              name="color-format-group"
              value={colorType}
              onChange={handleColorTypeChange}
            >
              {Object.keys(migrate).map((type) => (
                <FormControlLabel key={type} value={type} control={<Radio />} label={type.toUpperCase()} />
              ))}
            </RadioGroup>
          </FormControl>
          <div style={{ marginBottom: "1rem" }}>
          <label
              htmlFor="foreground"
              style={{ display: "block", marginBottom: "0.5rem" }}
            >
              Foreground Color:
            </label>
            <input
              id="foreground"
              type="color"
              value={foregroundHex}
              onChange={(e) => handleColorChange(e.target.value, true)}
              style={{ width: "50px", height: "50px", marginRight: "10px" }}
            />
            <TextField
              required
              type="text"
              value={foreground}
              onChange={(e) => setForegrounds(e.target.value)}
            />
          </div>
          <Box>
            <label
              htmlFor="background"
              style={{ display: "block", marginBottom: "0.5rem" }}
            >
              Background Color:
            </label>
            <input
              id="background"
              type="color"
              value={backgroundHex}
              onChange={(e) => handleColorChange(e.target.value, false)}
              style={{ width: "50px", height: "50px", marginRight: "10px" }}
            />
            <TextField
              required
              type="text"
              value={background}
              onChange={(e) => setBackgrounds(e.target.value)}
            />
          </Box>
          <div style={{ marginBottom: "1rem" }}>
                <Box sx={{ width: 250 }}>
          <Typography id="non-linear-slider" gutterBottom>
          Contrast Threshold: {contrastThreshold.toFixed(1)}
          </Typography>
          <Slider
            value={contrastThreshold}
            min={3}
            step={0.1}
            max={21}
            onChange={(e) => setContrastThreshold(e.target.value)}
          />
        </Box>
          </div>
          <IconButton
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
        <div
          style={{
            border: "0 none",
            backgroundColor: background,
            color: foreground,
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
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Original Choices</div>
          <div style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
            {contrastRatio}
          </div>
        </div>
        <div
          style={{
            border: "0 none",
            backgroundColor: chosenSuggestion.bg,
            color: chosenSuggestion.fg,
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
          <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Suggestion Preview</div>
          <div style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
            {chosenSuggestion.score}
          </div>
        </div>
      </section>
      <FormControl component="fieldset" style={{display: 'block'}}>
        <FormLabel component="legend">Color Format:</FormLabel>
        <RadioGroup
          aria-label="color-format"
          name="color-format-group"
          value={chosenSuggestion}
          onChange={handleSuggestionPreview}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
            gap: "1rem"
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
                padding: "1rem",
                textAlign: "center",
                borderRadius: "0.25rem",
                height: "100px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center"
              }}
              value={index}
              control={<Radio />} label={
                <div>
                  <div>Sample Text</div>
                    <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{suggestion.label}</div>
                    <div style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                    {suggestion.score}
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