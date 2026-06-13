// SPDX-FileCopyrightText: 2026 KIM Hyunjae
// SPDX-License-Identifier: AGPL-3.0-or-later

import * as LauncherActivityLogic from "./TaskContextMenuLauncherActivityLogic.mjs";
import * as PinLogic from "./TaskContextMenuPinLogic.mjs";
import * as TaskActivityLogic from "./TaskContextMenuTaskActivityLogic.mjs";
import * as VirtualDesktopActionLogic from "./TaskContextMenuVirtualDesktopLogic.mjs";
import * as WindowActionLogic from "./TaskContextMenuWindowActionLogic.mjs";

export function contextMenuActionSections(menuState) {
  const state = menuState || {};
  const basicRoles = state.basicActionRoles || {};
  const captureCloseRoles = state.captureCloseRoles || {};
  const fullscreenShadeBorderRoles = state.fullscreenShadeBorderRoles || {};
  const keepAboveBelowRoles = state.keepAboveBelowRoles || {};
  const minimizeMaximizeRoles = state.minimizeMaximizeRoles || {};
  const taskRoles = state.taskRoles || {};
  const virtualDesktopRoles = state.virtualDesktopRoles || {};

  const launcherActivityActions =
    LauncherActivityLogic.launcherActivityActionsSection({
      activityEntryCount: state.activityEntryCount,
      currentActivity: state.currentActivity,
      hasTaskModel: state.hasTaskModel,
      launcherActivities: state.launcherActivities,
      launcherList: state.launcherList,
      launcherPosition: state.launcherPosition,
      pinState: state.pinState,
    });

  const basicActions = WindowActionLogic.basicActionsSection({
    canLaunchNewInstance: basicRoles.canLaunchNewInstance,
    hasTask: state.hasTask,
    hasWindowTask: state.hasWindowTask,
    isLauncher: basicRoles.isLauncher,
    isMovable: basicRoles.isMovable,
    isResizable: basicRoles.isResizable,
    isWindow: state.isWindow,
    launcherActivitiesVisible:
      launcherActivityActions.launcherActivities.visible,
  });
  const captureActions = WindowActionLogic.captureActionsSection({
    hasWindowTask: state.hasWindowTask,
    isExcludedFromCapture: captureCloseRoles.isExcludedFromCapture,
    isWindow: state.isWindow,
  });
  const fullscreenShadeBorderActions =
    WindowActionLogic.fullscreenShadeBorderActionsSection({
      canSetNoBorder: fullscreenShadeBorderRoles.canSetNoBorder,
      fullScreenable: fullscreenShadeBorderRoles.fullScreenable,
      hasNoBorder: fullscreenShadeBorderRoles.hasNoBorder,
      hasWindowTask: state.hasWindowTask,
      isFullScreen: fullscreenShadeBorderRoles.isFullScreen,
      isShadeable: fullscreenShadeBorderRoles.isShadeable,
      isShaded: fullscreenShadeBorderRoles.isShaded,
      isWindow: state.isWindow,
    });
  const keepAboveBelowActions = WindowActionLogic.keepAboveBelowActionsSection({
    hasWindowTask: state.hasWindowTask,
    isKeepAbove: keepAboveBelowRoles.isKeepAbove,
    isKeepBelow: keepAboveBelowRoles.isKeepBelow,
    isWindow: state.isWindow,
  });
  const minimizeMaximizeActions =
    WindowActionLogic.minimizeMaximizeActionsSection({
      hasWindowTask: state.hasWindowTask,
      isMaximizable: minimizeMaximizeRoles.isMaximizable,
      isMaximized: minimizeMaximizeRoles.isMaximized,
      isMinimizable: minimizeMaximizeRoles.isMinimizable,
      isMinimized: minimizeMaximizeRoles.isMinimized,
      isWindow: state.isWindow,
    });
  const sections = {
    basicActions,
    captureActions,
    closeActions: WindowActionLogic.closeActionsSection({
      closable: captureCloseRoles.closable,
      hasTask: state.hasTask,
      isWindow: state.isWindow,
    }),
    fullscreenShadeBorderActions,
    keepAboveBelowActions,
    launcherActivityActions,
    minimizeMaximizeActions,
    pinActions: PinLogic.pinActionsSection(state.pinState),
    taskActivityActions: TaskActivityLogic.taskActivityActionsSection({
      activities: taskRoles.activities,
      activityEntryCount: state.activityEntryCount,
      hasWindowTask: state.hasWindowTask,
      isWindow: state.isWindow,
    }),
    virtualDesktopActions:
      VirtualDesktopActionLogic.virtualDesktopActionsSection({
        changeable: virtualDesktopRoles.isVirtualDesktopsChangeable,
        hasWindowTask: state.hasWindowTask,
        isOnAllVirtualDesktops: virtualDesktopRoles.isOnAllVirtualDesktops,
        isWindow: state.isWindow,
        virtualDesktops: taskRoles.virtualDesktops,
      }),
  };
  Object.defineProperty(sections, "moreActions", {
    configurable: true,
    enumerable: false,
    value: WindowActionLogic.moreActionsSection({
      actions: [
        basicActions.move,
        basicActions.resize,
        minimizeMaximizeActions.maximize,
        minimizeMaximizeActions.minimize,
        keepAboveBelowActions.keepAbove,
        keepAboveBelowActions.keepBelow,
        fullscreenShadeBorderActions.fullscreen,
        fullscreenShadeBorderActions.shade,
        fullscreenShadeBorderActions.noBorder,
        captureActions.excludeFromCapture,
      ],
    }),
  });
  return sections;
}
