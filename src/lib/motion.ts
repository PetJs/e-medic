import type { Transition, Variants } from "framer-motion"

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches

const easeOut: Transition["ease"] = [0.16, 1, 0.3, 1]

export function fadeInUp(delay = 0): Variants {
  if (prefersReducedMotion()) {
    return { hidden: { opacity: 1 }, show: { opacity: 1 } }
  }
  return {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: easeOut, delay },
    },
  }
}

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: prefersReducedMotion() ? 0 : 0.08,
    },
  },
}

export function scaleIn(delay = 0): Variants {
  if (prefersReducedMotion()) {
    return { hidden: { opacity: 1 }, show: { opacity: 1 } }
  }
  return {
    hidden: { opacity: 0, scale: 0.96 },
    show: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.3, ease: easeOut, delay },
    },
  }
}

export const cardHover = {
  whileHover: prefersReducedMotion() ? {} : { y: -3 },
  whileTap: prefersReducedMotion() ? {} : { scale: 0.98 },
  transition: { duration: 0.18, ease: easeOut },
}
