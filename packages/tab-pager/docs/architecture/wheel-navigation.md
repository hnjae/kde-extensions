# Tab Pager Wheel Navigation Boundary

Wheel input handling is split by responsibility: a QML-side wheel input helper normalizes Qt wheel events into raw deltas for the backend, `TabPagerWheelNavigation` owns pending-delta accumulation and conversion from complete wheel steps to semantic desktop offsets or no-step results, and `TabPagerDesktopNavigator` owns translation from wheel navigation results and semantic offsets to desktop navigation targets under the current wrapping policy.

Pending wheel-delta accumulation is user-visible behavior. It must remain independent of the current desktop, desktop count, and wrapping setting until a complete step is consumed against the then-current navigation context.
