# Tab Pager

> [!IMPORTANT]
> This project, including its code and documentation, was created with AI assistance.

Tab Pager is a Plasma 6 widget for switching between virtual desktops.

It displays the user's virtual desktops as compact adjacent boxes, using a row in horizontal panels and a column in vertical panels. Desktops with KDE's default `Desktop [number]` names are shown as numbers, while custom desktop names are shown as labels. The current desktop is highlighted.

Click a desktop to switch to it. Scroll over the widget to move to the previous
or next desktop. Scrolling follows KDE's virtual desktop wrapping setting, and
the widget updates when desktops are added, removed, reordered, renamed, or
activated.

The Plasma widget ID is `io.github.hnjae.tabpager`.

## Requirements

- KDE Plasma 6.5 or newer.
- Qt 6 and KDE Frameworks 6 runtime packages from the target distribution.

Tab Pager includes a native QML plugin. A loose `.plasmoid` archive is not
enough to install it correctly because the compiled QML plugin must also be
installed in the target system's Qt 6 QML import path.

## Install

### NixOS

Use the flake package in your system configuration:

```nix
environment.systemPackages = [
  inputs.kde-plasma-extensions.packages.${pkgs.stdenv.hostPlatform.system}.tabpager
];
```

Then rebuild the system.

## Use

After installing, add the widget from Plasma:

1. Enter Plasma edit mode.
2. Open Add Widgets.
3. Search for `Tab Pager`.
4. Add it to a panel or desktop.

If the widget does not appear immediately after installing, restart Plasma
Shell or log out and back in.

## Development

Common development commands:

```sh
just build
just test
just lint
just check
```

The development shell exposes helper commands such as `tab-pager-test`, `tab-pager-lint`, `tab-pager-lint-qml`, `tab-pager-lint-clang-tidy`, and `tab-pager-lint-clazy`.
