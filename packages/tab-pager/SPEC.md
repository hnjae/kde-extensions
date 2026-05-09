# Tab Pager Specification

Tab Pager is a Plasma widget for switching between virtual desktops.

## Display

The widget presents the virtual desktops as a single horizontal row of adjacent boxes.

Each box represents one virtual desktop. A desktop whose name is still the default KDE-style name, such as `Desktop 1` or `Desktop 2`, is shown only by its desktop number, such as `1` or `2`.

A desktop with a user-defined name is shown by that name.

For example, a five-desktop setup may appear as:

```text
[1][Work][2][3][Chat]
```

The boxes are sized from the visible desktop labels only. They do not scale to the physical monitor size, screen resolution, display arrangement, wallpaper, or any window layout on the desktops.

All desktop labels use the monospace font configured by KDE.

## Interaction

Clicking a desktop box switches the user to that virtual desktop.

Scrolling the mouse wheel over the widget moves between virtual desktops one desktop at a time.

The displayed labels update when the user's virtual desktop names change.
