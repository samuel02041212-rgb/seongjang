const BASE_WIDTH_PX = 576;
const WIDTH_SCALE = 1.3;

export const FEED_CARD_MAX_WIDTH_PX = Math.round(BASE_WIDTH_PX * WIDTH_SCALE);
export const feedCardMaxWidthClass = "max-w-[calc(36rem*1.3)]";
export const mePageShellMaxWidthClass = "max-w-[calc(36rem*1.3+2.5rem)]";
export const feedCardHeightClass = "h-[48rem]";
export const feedCardSizeClass = `w-full ${feedCardMaxWidthClass} ${feedCardHeightClass}`;
export const feedPostListClass = "relative mb-6 space-y-[calc(0.75rem+30px)]";
export const feedPostListWrapClass = `mx-auto w-full ${feedCardMaxWidthClass}`;

export const cardShellClass = "rounded-lg";
export const cardInnerClass = "rounded-md";
