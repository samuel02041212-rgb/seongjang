const BASE_WIDTH_PX = 576;
const WIDTH_SCALE = 1.3;

export const FEED_CARD_MAX_WIDTH_PX = Math.round(BASE_WIDTH_PX * WIDTH_SCALE);
export const feedCardMaxWidthClass = "max-w-[calc(36rem*1.3)]";
export const feedCardHeightClass = "h-[48rem]";
export const feedCardSizeClass = `w-full ${feedCardMaxWidthClass} ${feedCardHeightClass}`;
