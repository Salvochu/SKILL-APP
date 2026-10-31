// The logger runs full screen (focus mode) inside the app's normal <main>,
// which keeps room for a top bar and a tab bar that are hidden here. These
// pull the screen up into the top bar's space and drop the tab bar's
// clearance at the bottom (main: pt-14 / pb max(8.5rem, inset + 6.5rem);
// md: pt-16 / pb-16), so nothing shifts whether or not the bars have
// finished sliding away.
export const FOCUS_LAYOUT = "-mt-14 -mb-[5.75rem] md:-mt-16 md:-mb-10";
