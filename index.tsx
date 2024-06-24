import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { StyledEngineProvider } from "@mui/material/styles";
import ColorContrastGrid from "./Demo";

ReactDOM.createRoot(document.querySelector("#root")!).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <ColorContrastGrid />
    </StyledEngineProvider>
  </React.StrictMode>
);
