import { useCallback, useState } from "react";
import {
  createFlyingAnimation,
  calculateAnimationDuration,
} from "../utils/cart-animation";

interface FlyingAnimationState {
  isActive: boolean;
  startRect: DOMRect | null;
  productImage: string;
  productTitle: string;
  animationCSS: string;
  animationName: string;
  duration: number;
}

export function useAdvancedFlyingAnimation(
  isDesktop: boolean,
  screenWidth: number,
  screenHeight: number
) {
  const [flyingAnimation, setFlyingAnimation] = useState<FlyingAnimationState>({
    isActive: false,
    startRect: null,
    productImage: "",
    productTitle: "",
    animationCSS: "",
    animationName: "",
    duration: 800,
  });

  const triggerFlyingAnimation = useCallback(
    (
      element: HTMLElement,
      productImage: string,
      productTitle: string,
      onComplete?: () => void
    ) => {
      const startRect = element.getBoundingClientRect();
      const { css, animationName } = createFlyingAnimation(
        element,
        isDesktop,
        screenWidth,
        screenHeight
      );

      const duration = calculateAnimationDuration(
        startRect,
        isDesktop,
        screenWidth
      );

      setFlyingAnimation({
        isActive: true,
        startRect,
        productImage,
        productTitle,
        animationCSS: css,
        animationName,
        duration,
      });

      // Auto-cleanup after animation completes
      setTimeout(() => {
        setFlyingAnimation((prev) => ({
          ...prev,
          isActive: false,
        }));
        onComplete?.();
      }, duration);
    },
    [isDesktop, screenWidth, screenHeight]
  );

  const stopAnimation = useCallback(() => {
    setFlyingAnimation((prev) => ({
      ...prev,
      isActive: false,
    }));
  }, []);

  return {
    flyingAnimation,
    triggerFlyingAnimation,
    stopAnimation,
  };
}
