# Tab Pager Display

- Tab Pager is a Plasma widget for switching between virtual desktops.
- The widget presents the virtual desktops as adjacent boxes. In a horizontal panel, the boxes are arranged in a single horizontal row and fill the height of the content area that KDE's panel containment gives to the widget. In a vertical panel, the boxes are arranged in a single vertical column and fill the panel width.
- Adjacent boxes are separated by the same one-pixel gap used by KDE's built-in pager.
- The widget does not add extra outer spacing of its own. In a horizontal panel, KDE's panel containment may provide the same top and bottom margin area used for the built-in pager, and the visible bezel inside the widget comes from the KDE pager frame. In a vertical panel, the boxes extend to the left and right panel edges.
- Each box represents one virtual desktop. A desktop whose name is exactly `Desktop [number]` is shown only by its current desktop number, such as `1` or `2`.
- A desktop with any other name is shown by that name.

For example, a five-desktop setup may appear as:

```text
[1][Work][3][4][Chat]
```

- Along the arrangement direction, the boxes are sized from the visible desktop labels only. They do not scale to the physical monitor size, screen resolution, display arrangement, wallpaper, or any window layout on the desktops.
- All desktop labels use the fixed width font configured by KDE.
- The current virtual desktop is visually highlighted.
