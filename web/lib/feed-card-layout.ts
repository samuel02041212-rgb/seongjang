const BASE_WIDTH_PX = 576;
const WIDTH_SCALE = 1.3;
const CARD_SCALE = 0.95;

export const FEED_CARD_MAX_WIDTH_PX = Math.round(
  BASE_WIDTH_PX * WIDTH_SCALE * CARD_SCALE,
);
export const feedCardMaxWidthClass = "max-w-[calc(36rem*1.3*0.95)]";
export const mePageShellMaxWidthClass =
  "max-w-[calc((36rem*1.3*0.95+2.5rem)*1.2-25px)]";
export const mePageFeedCardMaxWidthClass =
  "max-w-[calc(36rem*1.3*0.95*1.2-25px)]";
export const feedCardHeightClass = "h-[calc(48rem*0.95)]";
export const mePageFeedCardHeightClass =
  "h-[calc(48rem*0.95*1.2-25px*48/(36*1.3))]";
export const feedCardSizeClass = `w-full ${feedCardMaxWidthClass} ${feedCardHeightClass}`;
export const mePageFeedCardSizeClass = `w-full ${mePageFeedCardMaxWidthClass} ${mePageFeedCardHeightClass}`;
export const feedPostListClass = "relative mb-6 space-y-[calc(0.75rem+30px)]";
export const feedPostListWrapClass = `mx-auto w-full ${feedCardMaxWidthClass}`;
export const mePagePostListWrapClass = `mx-auto w-full ${mePageFeedCardMaxWidthClass}`;
export const mePageSidePanelWidthClass = "w-[295px] xl:w-[359px]";
export const mePageRecordPanelWidthClass = "w-[315px] xl:w-[379px]";

export const cardShellClass = "rounded-lg";
export const cardInnerClass = "rounded-md";
