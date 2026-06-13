// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

export function desktopId(desktop) {
  if (!desktop) {
    return "";
  }

  if (typeof desktop === "string") {
    return desktop;
  }

  if (desktop.id) {
    return String(desktop.id);
  }

  return String(desktop);
}

export function desktopListContains(desktops, desktop) {
  const currentDesktopId = desktopId(desktop);
  if (!currentDesktopId) {
    return false;
  }

  const desktopList = Array.from(desktops || []);
  for (let i = 0; i < desktopList.length; ++i) {
    if (desktopId(desktopList[i]) === currentDesktopId) {
      return true;
    }
  }

  return false;
}

export function isOnCurrentVirtualDesktop(
  desktops,
  isOnAllDesktops,
  currentDesktop,
) {
  if (isOnAllDesktops) {
    return true;
  }

  return desktopListContains(desktops, currentDesktop);
}

export function isRemoteVirtualDesktop(
  desktops,
  isOnAllDesktops,
  currentDesktop,
) {
  if (isOnAllDesktops) {
    return false;
  }

  const desktopList = Array.from(desktops || []);
  return (
    desktopList.length > 0 && !desktopListContains(desktopList, currentDesktop)
  );
}

export function virtualDesktopMenuState(
  virtualDesktops,
  isOnAllDesktops,
  desktop,
) {
  const allDesktopsChecked = Boolean(isOnAllDesktops);

  return {
    allDesktopsChecked,
    desktopChecked:
      allDesktopsChecked || desktopListContains(virtualDesktops, desktop),
  };
}
