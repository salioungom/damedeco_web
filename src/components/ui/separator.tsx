import * as React from "react";
import { Divider, DividerProps } from "@mui/material";

const Separator = React.forwardRef<
  HTMLHRElement,
  React.ComponentProps<typeof Divider> & { decorative?: boolean }
>(({ className, orientation = "horizontal", decorative = true, sx, ...props }, ref) => (
    <Divider
      ref={ref}
      orientation={orientation}
      role={decorative ? "none" : "separator"}
      sx={{
        borderColor: "border.main",
        ...sx,
      }}
      {...props}
    />
  )
);
Separator.displayName = "Separator";

export { Separator };
