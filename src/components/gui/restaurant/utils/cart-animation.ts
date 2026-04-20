/**
 * Advanced Cart Animation Utilities
 * Calculates dynamic trajectories from product positions to cart locations
 */

export interface AnimationConfig {
  startRect: DOMRect;
  targetRect: DOMRect;
  isDesktop: boolean;
  screenWidth: number;
  screenHeight: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export interface AnimationKeyframes {
  start: TrajectoryPoint;
  middle: TrajectoryPoint;
  end: TrajectoryPoint;
}

/**
 * Calculate the target position for the cart
 * Desktop: Cart sidebar on the right
 * Mobile: Cart icon in the top navigation
 */
export function getCartTargetPosition(isDesktop: boolean): {
  x: number;
  y: number;
} {
  if (isDesktop) {
    // Desktop: Cart is in the right sidebar
    return {
      x: window.innerWidth - 200, // Right sidebar approximate position
      y: window.innerHeight - 400, // Top area of the cart
    };
  } else {
    // Mobile: Cart icon in the top navigation (top-left)
    return {
      x: 40, // Top-left cart icon
      y: 60, // Top navigation height
    };
  }
}

/**
 * Calculate a smooth bezier curve trajectory
 */
export function calculateTrajectory(
  config: AnimationConfig
): AnimationKeyframes {
  const { startRect, isDesktop } = config;

  const startX = startRect.left + startRect.width / 2;
  const startY = startRect.top + startRect.height / 2;

  const target = getCartTargetPosition(isDesktop);
  const endX = target.x;
  const endY = target.y;

  // Calculate distance and direction
  const deltaX = endX - startX;
  const deltaY = endY - startY;

  // Create a curved trajectory with dynamic control points
  let controlX: number;
  let controlY: number;

  if (isDesktop) {
    // Desktop: Curved path to the right
    controlX = startX + deltaX * 0.6 + (deltaY > 0 ? -50 : 50); // Add perpendicular offset
    controlY = startY + deltaY * 0.3 - 80; // Arc upward
  } else {
    // Mobile: Curved path to top-left
    controlX = startX + deltaX * 0.4 - 30; // Slight left curve
    controlY = startY + deltaY * 0.4 - 60; // Arc upward
  }

  // Calculate rotation based on trajectory direction
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);

  return {
    start: {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
      opacity: 1,
    },
    middle: {
      x: controlX - startX,
      y: controlY - startY,
      scale: 0.7,
      rotation: angle * 0.3,
      opacity: 0.8,
    },
    end: {
      x: deltaX,
      y: deltaY,
      scale: 0.2,
      rotation: angle * 0.5 + (isDesktop ? 10 : -10),
      opacity: 0,
    },
  };
}

/**
 * Generate CSS keyframes string for the animation
 */
export function generateAnimationCSS(
  config: AnimationConfig,
  animationName: string = "flyToCart"
): string {
  const trajectory = calculateTrajectory(config);

  return `
    @keyframes ${animationName} {
      0% {
        transform: translate(${trajectory.start.x}px, ${trajectory.start.y}px) 
                   scale(${trajectory.start.scale}) 
                   rotate(${trajectory.start.rotation}deg);
        opacity: ${trajectory.start.opacity};
      }
      50% {
        transform: translate(${trajectory.middle.x}px, ${trajectory.middle.y}px) 
                   scale(${trajectory.middle.scale}) 
                   rotate(${trajectory.middle.rotation}deg);
        opacity: ${trajectory.middle.opacity};
      }
      100% {
        transform: translate(${trajectory.end.x}px, ${trajectory.end.y}px) 
                   scale(${trajectory.end.scale}) 
                   rotate(${trajectory.end.rotation}deg);
        opacity: ${trajectory.end.opacity};
      }
    }
  `;
}

/**
 * Create an advanced flying animation with dynamic trajectory
 */
export function createFlyingAnimation(
  startElement: HTMLElement,
  isDesktop: boolean,
  screenWidth: number,
  screenHeight: number
): { css: string; animationName: string } {
  const startRect = startElement.getBoundingClientRect();
  const animationName = `flyToCart_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  // Create a mock target rect (we'll calculate the actual target in the function)
  const targetRect = new DOMRect(0, 0, 0, 0); // This will be calculated inside

  const config: AnimationConfig = {
    startRect,
    targetRect,
    isDesktop,
    screenWidth,
    screenHeight,
  };

  const css = generateAnimationCSS(config, animationName);

  return { css, animationName };
}

/**
 * Advanced easing functions for smoother animations
 */
export const easingFunctions = {
  easeOutCubic: "cubic-bezier(0.215, 0.610, 0.355, 1.000)",
  easeOutQuart: "cubic-bezier(0.165, 0.840, 0.440, 1.000)",
  easeOutBack: "cubic-bezier(0.175, 0.885, 0.320, 1.275)",
  easeInOutCirc: "cubic-bezier(0.785, 0.135, 0.150, 0.860)",
};

/**
 * Get animation duration based on distance and screen size
 */
export function calculateAnimationDuration(
  startRect: DOMRect,
  isDesktop: boolean,
  screenWidth: number
): number {
  const target = getCartTargetPosition(isDesktop);
  const startX = startRect.left + startRect.width / 2;
  const startY = startRect.top + startRect.height / 2;

  const distance = Math.sqrt(
    Math.pow(target.x - startX, 2) + Math.pow(target.y - startY, 2)
  );

  // Base duration: 800ms, adjusted by distance and screen size
  const baseDuration = 800;
  const distanceFactor = Math.min(2, distance / (screenWidth * 0.5));

  return Math.max(600, Math.min(1400, baseDuration * distanceFactor));
}
