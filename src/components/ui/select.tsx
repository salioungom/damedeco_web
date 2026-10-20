import * as React from "react";
import {
  Select as MuiSelect,
  MenuItem,
  FormControl,
  ListSubheader,
  Divider,
  Box,
  Typography,
} from "@mui/material";
import { ExpandMore as ChevronDownIcon, ExpandLess as ChevronUpIcon, Check as CheckIcon } from "@mui/icons-material";

/* -------------------------------------------------------------------------- */
/* Context to share select state                                              */
/* -------------------------------------------------------------------------- */
interface SelectContextValue {
  value: string;
  setValue: (value: string) => void;
}
const SelectContext = React.createContext<SelectContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/* Root component – mirrors Radix Select.Root                                  */
/* -------------------------------------------------------------------------- */
interface SelectComponentProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

function Select({ value: controlledValue, defaultValue, onValueChange, children }: SelectComponentProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const isControlled = controlledValue !== undefined;
  const value = isControlled ? controlledValue : internalValue;

  const setValue = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  // Extract Trigger and Content from children
  const childrenArray = React.Children.toArray(children);
  const trigger = childrenArray.find((child) => React.isValidElement(child) && (child.type === SelectTrigger || (child.type as any).displayName === "SelectTrigger")) as React.ReactElement | undefined;
  const content = childrenArray.find((child) => React.isValidElement(child) && (child.type === SelectContent || (child.type as any).displayName === "SelectContent")) as React.ReactElement | undefined;

  // If we can't find them by type (e.g. if wrapped), we might fallback or just render children.
  // But for this refactor to work with MUI Select which requires direct children, we need to restructure.

  if (trigger && content) {
    return (
      <SelectContext.Provider value={{ value, setValue }}>
        <FormControl fullWidth>
          {/* Render Trigger but pass Content's children to it? 
                 No, Trigger renders MuiSelect. MuiSelect needs children.
                 We clone Trigger and pass Content's children to it.
             */}
          {React.cloneElement(trigger, { children: (content.props as any).children } as any)}
        </FormControl>
      </SelectContext.Provider>
    );
  }

  return (
    <SelectContext.Provider value={{ value, setValue }}>
      <FormControl fullWidth>
        {children}
      </FormControl>
    </SelectContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */
/* Group – simple wrapper for grouping items                                   */
/* -------------------------------------------------------------------------- */
function SelectGroup({ children }: { children: React.ReactNode }) {
  return <Box>{children}</Box>;
}

/* -------------------------------------------------------------------------- */
/* Value – placeholder/selected value display (handled by MUI Select)          */
/* -------------------------------------------------------------------------- */
function SelectValue({ placeholder }: { placeholder?: string }) {
  // In MUI Select, the value is displayed automatically.
  // This component is often used in Radix to show the selected value or placeholder.
  // We might not need to render anything here if we use MUI's renderValue or displayEmpty.
  // But for compatibility, we can render a span that might be used by custom renderValue logic if we implemented it.
  // For now, we'll just render nothing as MUI handles it, or maybe just the placeholder if value is empty?
  // Actually, MUI Select `displayEmpty` prop allows showing a placeholder.
  return null;
}

/* -------------------------------------------------------------------------- */
/* Trigger – the select button                                                */
/* -------------------------------------------------------------------------- */
type SelectTriggerProps = React.ComponentProps<typeof MuiSelect> & {
  size?: "small" | "medium"; // MUI uses small/medium
  children?: React.ReactNode;
  sx?: any;
};

function SelectTrigger({ className, size = "medium", children, sx, ...props }: SelectTriggerProps) {
  const ctx = React.useContext(SelectContext);
  if (!ctx) return null;

  return (
    <MuiSelect
      value={ctx.value}
      onChange={(e: any) => ctx.setValue(e.target.value as string)}
      size={size}
      displayEmpty
      IconComponent={ChevronDownIcon}
      sx={{
        "& .MuiSelect-select": {
          display: "flex",
          alignItems: "center",
          gap: 1,
        },
        ...sx,
      }}
      {...props}
    >
      {children}
    </MuiSelect>
  );
}

/* -------------------------------------------------------------------------- */
/* Content – wrapper for menu items (MUI Select handles this internally)       */
/* -------------------------------------------------------------------------- */
function SelectContent({ className, children, sx, ...props }: React.ComponentProps<"div"> & { sx?: any }) {
  // In Radix, Content contains the items. In MUI, Select children are the items.
  // So SelectContent should just render its children.
  // However, if we want to style the Menu, we might need to pass MenuProps to SelectTrigger.
  // But here SelectContent wraps the items in the usage code:
  // <Select> <SelectTrigger>...</SelectTrigger> <SelectContent>...</SelectContent> </Select>
  // This structure is different from MUI where items are direct children of Select.
  // To support this, SelectTrigger needs to render the Select, and SelectContent needs to inject items into it?
  // Or SelectTrigger renders the Input, and SelectContent renders the Menu?
  // MUI Select combines both.
  //
  // Strategy:
  // The `Select` component (Root) provides context.
  // `SelectTrigger` renders the `MuiSelect`.
  // `SelectContent` renders the items.
  // BUT `MuiSelect` expects items as children.
  // So `SelectTrigger` needs to know about `SelectContent`'s children.
  // This is hard to do without lifting state or using a portal approach which MUI does internally.
  //
  // Alternative:
  // We can use `MuiSelect` in `SelectTrigger` and pass `children` (which are `SelectContent` in Radix structure) to it.
  // But in Radix structure:
  // <Select>
  //   <SelectTrigger />
  //   <SelectContent>
  //     <SelectItem />
  //   </SelectContent>
  // </Select>
  //
  // So `Select` has two children: Trigger and Content.
  // We need to move Content's children into Trigger's `MuiSelect`.
  //
  // We can use a Context to register the content?
  // Or we can just render `SelectContent` as a fragment?
  // But `SelectTrigger` is rendered *before* `SelectContent`.
  //
  // If we change `Select` to accept `children` and inspect them?
  // We can find `SelectTrigger` and `SelectContent` in `children`.
  // Then render `MuiSelect` (from Trigger props) with `SelectContent` children.

  // Let's try to implement `Select` to orchestrate this.
  // But `Select` currently just provides context.

  // Revised Strategy:
  // `Select` (Root) inspects children.
  // It finds the Trigger and Content.
  // It renders `MuiSelect` using props from Trigger and children from Content.
  // This requires `SelectTrigger` and `SelectContent` to be just data carriers or simple wrappers.

  // However, `SelectTrigger` might have its own logic/styles.
  //
  // Let's stick to the current structure but maybe use a workaround?
  // If `SelectTrigger` renders the `MuiSelect`, it needs the items.
  // The items are in `SelectContent`.
  //
  // Maybe we can use `SelectContext` to pass items up? No, render cycle.
  //
  // Let's look at `Select` implementation again.
  // `Select` renders `SelectContext.Provider` and `FormControl`.
  //
  // If we assume the user follows the pattern:
  // <Select>
  //   <SelectTrigger>Value</SelectTrigger>
  //   <SelectContent>Items</SelectContent>
  // </Select>
  //
  // We can change `Select` to:
  /*
  function Select({ children, ... }) {
    const childrenArray = React.Children.toArray(children);
    const trigger = childrenArray.find(c => c.type === SelectTrigger);
    const content = childrenArray.find(c => c.type === SelectContent);
    
    return (
       <SelectContext...>
         <MuiSelect {...trigger.props}>
           {content.props.children}
         </MuiSelect>
       </SelectContext...>
    )
  }
  */
  // This seems viable and robust enough for this refactor.
  // We need to export `SelectTrigger` and `SelectContent` as components that can be identified.
  // And they should probably render nothing if used this way, or we just extract their props.

  return <>{children}</>;
}

/* -------------------------------------------------------------------------- */
/* Label – section label in select dropdown                                    */
/* -------------------------------------------------------------------------- */
function SelectLabel({
  className,
  children,
  color,
  sx,
  ...props
}: React.ComponentProps<typeof ListSubheader> & { sx?: any }) {
  return (
    <ListSubheader
      sx={{
        px: 2,
        py: 1.5,
        fontSize: "0.75rem",
        lineHeight: 1,
        color: "text.secondary",
        ...sx,
      }}
      {...props}
    >
      {children}
    </ListSubheader>
  );
}

/* -------------------------------------------------------------------------- */
/* Item – individual select option                                            */
/* -------------------------------------------------------------------------- */
interface SelectItemProps extends React.ComponentProps<typeof MenuItem> {
  value: string;
  sx?: any;
}

function SelectItem({ className, children, value, sx, ...props }: SelectItemProps) {
  return (
    <MenuItem
      value={value}
      sx={{
        fontSize: "0.875rem",
        borderRadius: 0.5,
        py: 0.75,
        px: 2,
        mx: 0.5,
        "&:hover": {
          bgcolor: "action.hover",
        },
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        ...sx,
      }}
      {...props}
    >
      <Box component="span" sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {children}
      </Box>
      {/* Check icon is handled by MuiSelect if multiple? No, single select. 
          Radix shows check icon for selected item.
          MUI highlights selected item.
          We can add a check icon if selected.
          But we don't know if it's selected here easily without context or prop.
          MUI MenuItem has `selected` prop injected.
      */}
    </MenuItem>
  );
}

/* -------------------------------------------------------------------------- */
/* Separator – divider between select items                                    */
/* -------------------------------------------------------------------------- */
function SelectSeparator({ className, sx, ...props }: React.ComponentProps<typeof Divider>) {
  return (
    <Divider
      sx={{ my: 0.5, ...sx }}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Scroll buttons – visual indicators (MUI handles scrolling automatically)   */
/* -------------------------------------------------------------------------- */
function SelectScrollUpButton({ className, ...props }: React.ComponentProps<"div">) {
  return null;
}

function SelectScrollDownButton({ className, ...props }: React.ComponentProps<"div">) {
  return null;
}

/* -------------------------------------------------------------------------- */
/* Export – keep original names for drop‑in replacement                         */
/* -------------------------------------------------------------------------- */
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
