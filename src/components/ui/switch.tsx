import * as React from "react";
import { Switch as MuiSwitch } from "@mui/material";

const Switch = React.forwardRef<HTMLButtonElement, React.ComponentProps<typeof MuiSwitch>>(({ className, sx, ...props }, ref) => (
  <MuiSwitch
    ref={ref}
    sx={{
      width: 42,
      height: 26,
      padding: 0,
      "& .MuiSwitch-switchBase": {
        padding: 0,
        margin: "2px",
        transitionDuration: "300ms",
        "&.Mui-checked": {
          transform: "translateX(16px)",
          color: "primary.contrastText",
          "& + .MuiSwitch-track": {
            backgroundColor: "primary.main",
            opacity: 1,
            border: 0,
          },
          "&.Mui-disabled + .MuiSwitch-track": {
            opacity: 0.5,
          },
        },
        "&.Mui-focusVisible .MuiSwitch-thumb": {
          color: "primary.main",
          border: "6px solid",
          borderColor: "primary.contrastText",
        },
        "&.Mui-disabled .MuiSwitch-thumb": {
          color: "grey.100",
        },
        "&.Mui-disabled + .MuiSwitch-track": {
          opacity: 0.7,
        },
      },
      "& .MuiSwitch-thumb": {
        boxSizing: "border-box",
        width: 22,
        height: 22,
      },
      "& .MuiSwitch-track": {
        borderRadius: 26 / 2,
        backgroundColor: "grey.300",
        opacity: 1,
        transition: "background-color 500ms",
      },
      ...sx,
    }}
    {...props}
  />
));
Switch.displayName = "Switch";

export { Switch };
