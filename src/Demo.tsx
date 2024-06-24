import React, { useState, useEffect } from "react";

const ColorContrastGrid = () => {
  const [foreground, setForeground] = useState("");
  const [background, setBackground] = useState("");
  const [grid, setGrid] = useState([]);
  const [contrastThreshold, setContrastThreshold] = useState(4.5);
  const [colorType, setColorType] = useState("hex");
  const [errorMessage, setErrorMessage] = useState("");

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

    if (fg && fgType === "rgba") {
      fg = convertRGBAtoRGB(fg);
      fgType = "rgb";
    }
    if (bg && bgType === "rgba") {
      bg = convertRGBAtoRGB(bg);
      bgType = "rgb";
    }

    const inferredType = fgType || bgType || "hex";
    setColorType(inferredType);
    setForeground(fg || getRandomColor(inferredType));
    setBackground(bg || getRandomColor(inferredType));
  }, []);

  function getColorType(color) {
    if (!color) return null;
    if (color.startsWith("#")) return "hex";
    if (color.startsWith("rgb")) return color.includes("a") ? "rgba" : "rgb";
    if (color.startsWith("hsl")) return "hsl";
    return null;
  }

  function convertRGBAtoRGB(rgba) {
    const match = rgba.match(
      /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
    );
    if (match) {
      const [, r, g, b] = match;
      return `rgb(${r}, ${g}, ${b})`;
    }
    return rgba;
  }

  function getRandomColor(type) {
    switch (type) {
      case "rgb":
        return `rgb(${Math.floor(Math.random() * 256)}, ${Math.floor(
          Math.random() * 256
        )}, ${Math.floor(Math.random() * 256)})`;
      case "hsl":
        return `hsl(${Math.floor(Math.random() * 360)}, ${Math.floor(
          Math.random() * 101
        )}%, ${Math.floor(Math.random() * 101)}%)`;
      case "hex":
      default:
        return (
          "#" +
          Math.floor(Math.random() * 16777215)
            .toString(16)
            .padStart(6, "0")
        );
    }
  }

  const hexToRGB = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  };

  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  const hslToRGB = (h, s, l) => {
    s /= 100;
    l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [
      Math.round(255 * f(0)),
      Math.round(255 * f(8)),
      Math.round(255 * f(4))
    ];
  };

  const parseColor = (color) => {
    if (color.startsWith("#")) {
      return hexToRGB(color);
    } else if (color.startsWith("rgb")) {
      const match = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
      return match ? match.slice(1, 4).map(Number) : [0, 0, 0];
    } else if (color.startsWith("hsl")) {
      const match = color.match(/^hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)$/);
      return match ? hslToRGB(...match.slice(1, 4).map(Number)) : [0, 0, 0];
    }
    return [0, 0, 0];
  };

  const getLuminance = (r, g, b) => {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const getContrastRatio = (color1, color2) => {
    const l1 = getLuminance(...parseColor(color1));
    const l2 = getLuminance(...parseColor(color2));
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return ratio.toFixed(2);
  };

  const adjustColor = (color, amount) => {
    let [r, g, b] = parseColor(color);
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    switch (colorType) {
      case "rgb":
        return `rgb(${r}, ${g}, ${b})`;
      case "hsl":
        const [h, s, l] = rgbToHSL(r, g, b);
        return `hsl(${h}, ${s}%, ${l}%)`;
      case "hex":
      default:
        return rgbToHex(r, g, b);
    }
  };

  const rgbToHSL = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);
    let h,
      s,
      l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        case b:
          h = (r - g) / d + 4;
          break;
      }
      h /= 6;
    }

    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  };

  const generateGrid = () => {
    const newGrid = [];

    // Original colors
    newGrid.push({ fg: foreground, bg: background, label: "Original" });

    // Generate more variations
    for (let i = -40; i <= 40; i += 10) {
      for (let j = -40; j <= 40; j += 10) {
        if (i === 0 && j === 0) continue;
        let newFg = adjustColor(foreground, i);
        let newBg = adjustColor(background, j);
        if (getContrastRatio(newFg, newBg) >= contrastThreshold) {
          newGrid.push({
            fg: newFg,
            bg: newBg,
            label: `FG ${i > 0 ? "+" : ""}${i}, BG ${j > 0 ? "+" : ""}${j}`
          });
        }
      }
    }

    setGrid(newGrid);
  };

  useEffect(() => {
    generateGrid();
  }, [foreground, background, contrastThreshold, colorType]);

  const handleColorChange = (color, isForeground) => {
    const newColor = color.hex ? `#${color.hex}` : color;
    if (isForeground) {
      setForeground(newColor);
    } else {
      setBackground(newColor);
    }
  };

  const handleColorTypeChange = (e) => {
    const newType = e.target.value;
    setColorType(newType);
    setForeground(convertColor(foreground, newType));
    setBackground(convertColor(background, newType));
  };

  const convertColor = (color, newType) => {
    const [r, g, b] = parseColor(color);
    switch (newType) {
      case "rgb":
        return `rgb(${r}, ${g}, ${b})`;
      case "hsl":
        const [h, s, l] = rgbToHSL(r, g, b);
        return `hsl(${h}, ${s}%, ${l}%)`;
      case "hex":
      default:
        return rgbToHex(r, g, b);
    }
  };

  return (
    <div style={{ padding: "1rem", fontFamily: "Arial, sans-serif" }}>
      {errorMessage && (
        <div style={{ color: "red", marginBottom: "1rem" }}>{errorMessage}</div>
      )}
      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="colorType"
          style={{ display: "block", marginBottom: "0.5rem" }}
        >
          Color Type:
        </label>
        <div>
          {["hex", "rgb", "hsl"].map((type) => (
            <label key={type} style={{ marginRight: "1rem" }}>
              <input
                type="radio"
                value={type}
                checked={colorType === type}
                onChange={handleColorTypeChange}
              />
              {type.toUpperCase()}
            </label>
          ))}
        </div>
      </div>
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
          value={
            colorType === "hex"
              ? foreground
              : rgbToHex(...parseColor(foreground))
          }
          onChange={(e) => handleColorChange(e.target.value, true)}
          style={{ width: "50px", height: "50px", marginRight: "10px" }}
        />
        <input
          type="text"
          value={foreground}
          onChange={(e) => setForeground(e.target.value)}
          style={{ width: "calc(100% - 70px)" }}
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="background"
          style={{ display: "block", marginBottom: "0.5rem" }}
        >
          Background Color:
        </label>
        <input
          id="background"
          type="color"
          value={
            colorType === "hex"
              ? background
              : rgbToHex(...parseColor(background))
          }
          onChange={(e) => handleColorChange(e.target.value, false)}
          style={{ width: "50px", height: "50px", marginRight: "10px" }}
        />
        <input
          type="text"
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          style={{ width: "calc(100% - 70px)" }}
        />
      </div>
      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="threshold"
          style={{ display: "block", marginBottom: "0.5rem" }}
        >
          Contrast Threshold:
        </label>
        <input
          id="threshold"
          type="range"
          min="3"
          max="21"
          step="0.1"
          value={contrastThreshold}
          onChange={(e) => setContrastThreshold(parseFloat(e.target.value))}
          style={{ width: "100%" }}
        />
        <div>{contrastThreshold.toFixed(1)}</div>
      </div>
      <button
        onClick={() => {
          setForeground(getRandomColor(colorType));
          setBackground(getRandomColor(colorType));
        }}
        style={{ marginBottom: "1rem", padding: "0.5rem 1rem" }}
      >
        Randomize Colors
      </button>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: "1rem"
        }}
      >
        {grid.map((color, index) => {
          const contrastRatio = getContrastRatio(color.fg, color.bg);
          return (
            <button
              key={index}
              style={{
                border: "0 none",
                backgroundColor: color.bg,
                color: color.fg,
                padding: "1rem",
                textAlign: "center",
                borderRadius: "0.25rem",
                height: "100px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center"
              }}
              title={`Contrast: ${contrastRatio}\nColor Type: ${colorType.toUpperCase()}`}
            >
              <div>Sample Text</div>
              <div style={{ fontSize: "0.8rem", marginTop: "0.5rem" }}>
                {color.label}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ColorContrastGrid;
