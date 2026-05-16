# Tab Pager Specification

Tab Pager is a Plasma widget for switching between virtual desktops.

## Display

The widget presents the virtual desktops as a single horizontal row of adjacent boxes.

Each box represents one virtual desktop. A desktop whose name is exactly `Desktop [number]` is shown only by its current desktop number, such as `1` or `2`.

A desktop with any other name is shown by that name.

For example, a five-desktop setup may appear as:

```text
[1][Work][3][4][Chat]
```

The boxes are sized from the visible desktop labels only. They do not scale to the physical monitor size, screen resolution, display arrangement, wallpaper, or any window layout on the desktops.

All desktop labels use the fixed width font configured by KDE.

The current virtual desktop is visually highlighted.

## Interaction

Clicking a desktop box switches the user to that virtual desktop.

Scrolling the mouse wheel over the widget moves between virtual desktops one desktop at a time. Scrolling up moves to the previous desktop, and scrolling down moves to the next desktop.

Scrolling follows KDE's navigation wrapping setting. When wrapping is enabled, scrolling past the first or last desktop wraps to the opposite end; when wrapping is disabled, scrolling stops at the first or last desktop.

The displayed boxes and labels update when the user's virtual desktops are added, removed, reordered, renamed, or when the current virtual desktop changes.
