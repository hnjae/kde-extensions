# Tab Pager Specification

Tab Pager is a Plasma widget for switching between virtual desktops.

## Display

The widget presents the virtual desktops as adjacent boxes. In a horizontal panel, the boxes are arranged in a single horizontal row and fill the panel height. In a vertical panel, the boxes are arranged in a single vertical column and fill the panel width.

Adjacent boxes are separated by the same one-pixel gap used by KDE's built-in pager.

The widget does not add extra outer spacing between the boxes and the panel edge. In a horizontal panel, the visible top and bottom bezel comes from the KDE pager frame. In a vertical panel, the boxes extend to the left and right panel edges.

Each box represents one virtual desktop. A desktop whose name is exactly `Desktop [number]` is shown only by its current desktop number, such as `1` or `2`.

A desktop with any other name is shown by that name.

For example, a five-desktop setup may appear as:

```text
[1][Work][3][4][Chat]
```

Along the arrangement direction, the boxes are sized from the visible desktop labels only. They do not scale to the physical monitor size, screen resolution, display arrangement, wallpaper, or any window layout on the desktops.

All desktop labels use the fixed width font configured by KDE.

The current virtual desktop is visually highlighted.

## Interaction

Clicking a desktop box switches the user to that virtual desktop.

Scrolling the mouse wheel over the widget moves between virtual desktops one desktop at a time. Scrolling up moves to the previous desktop, and scrolling down moves to the next desktop.

Scrolling follows KDE's navigation wrapping setting. When wrapping is enabled, scrolling past the first or last desktop wraps to the opposite end; when wrapping is disabled, scrolling stops at the first or last desktop.

The displayed boxes and labels update when the user's virtual desktops are added, removed, reordered, renamed, or when the current virtual desktop changes.
