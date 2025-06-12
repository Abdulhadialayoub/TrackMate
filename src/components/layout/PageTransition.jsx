import React from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

// Animation variants
const fadeVariants = {
  initial: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 },
};

const slideUpVariants = {
  initial: { opacity: 0, y: 20 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -20 },
};

const slideRightVariants = {
  initial: { opacity: 0, x: -20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 20 },
};

const scaleVariants = {
  initial: { opacity: 0, scale: 0.95 },
  in: { opacity: 1, scale: 1 },
  out: { opacity: 0, scale: 1.05 },
};

// Transition options
const transitions = {
  default: { type: 'tween', ease: 'easeInOut', duration: 0.3 },
  spring: { type: 'spring', stiffness: 300, damping: 30 },
  smooth: { type: 'tween', ease: 'anticipate', duration: 0.4 },
  bounce: { type: 'spring', stiffness: 400, damping: 15 },
};

/**
 * PageTransition component for smooth transitions between pages or components
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to be animated
 * @param {string} props.variant - Animation variant to use (fade, slideUp, slideRight, scale)
 * @param {string} props.transition - Transition type (default, spring, smooth, bounce)
 * @param {number} props.delay - Delay before animation starts (in seconds)
 * @param {Object} props.style - Additional styles to apply to the container
 */
const PageTransition = ({ 
  children, 
  variant = 'fade', 
  transition = 'default',
  delay = 0,
  style = {},
}) => {
  // Select the appropriate animation variant
  const getVariant = () => {
    switch (variant) {
      case 'slideUp': return slideUpVariants;
      case 'slideRight': return slideRightVariants;
      case 'scale': return scaleVariants;
      case 'fade':
      default: return fadeVariants;
    }
  };
  
  // Select the transition type
  const getTransition = () => {
    const selectedTransition = transitions[transition] || transitions.default;
    return { ...selectedTransition, delay };
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={getVariant()}
      transition={getTransition()}
      style={{ display: 'flex', flexDirection: 'column', flex: 1, ...style }}
    >
      {children}
    </motion.div>
  );
};

PageTransition.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['fade', 'slideUp', 'slideRight', 'scale']),
  transition: PropTypes.oneOf(['default', 'spring', 'smooth', 'bounce']),
  delay: PropTypes.number,
  style: PropTypes.object,
};

export default PageTransition;
