# Tab Pager Interaction

- Clicking a desktop box switches the user to that virtual desktop.
- Scrolling the mouse wheel over the widget moves between virtual desktops one desktop at a time. Scrolling up moves to the previous desktop, and scrolling down moves to the next desktop.
- Wheel input smaller than one complete wheel step is accumulated. The accumulated partial input remains pending when the current desktop changes, when desktops are added or removed, when KDE's navigation wrapping setting changes, and while there is temporarily no current desktop. When later wheel input completes a step, that step is applied to the desktop state and wrapping setting that are current at that time.
- Scrolling follows KDE's navigation wrapping setting. When wrapping is enabled, scrolling past the first or last desktop wraps to the opposite end; when wrapping is disabled, scrolling stops at the first or last desktop.
- A completed wheel step that stops at the first or last desktop because wrapping is disabled is consumed and does not remain pending for later desktop changes.
- The displayed boxes and labels update when the user's virtual desktops are added, removed, reordered, renamed, or when the current virtual desktop changes.
