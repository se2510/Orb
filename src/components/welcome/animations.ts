export const orbitalAnimations = `
  @keyframes orbit {
    0% {
      transform: rotate(0deg) translateX(120px) rotate(0deg);
    }
    100% {
      transform: rotate(360deg) translateX(120px) rotate(-360deg);
    }
  }

  @keyframes orbitReverse {
    0% {
      transform: rotate(0deg) translateX(180px) rotate(0deg);
    }
    100% {
      transform: rotate(-360deg) translateX(180px) rotate(360deg);
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: translate(-50%, -50%) scale(1);
      opacity: 1;
    }
    50% {
      transform: translate(-50%, -50%) scale(1.03);
      opacity: 0.95;
    }
  }

  @keyframes float {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-8px);
    }
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes lightReflection {
    0%, 100% {
      filter: drop-shadow(0 2px 10px rgba(168, 85, 247, 0.4));
    }
    50% {
      filter: drop-shadow(0 2px 20px rgba(168, 85, 247, 0.6)) drop-shadow(0 0 40px rgba(233, 213, 255, 0.5));
    }
  }

  @keyframes shimmer {
    0% {
      left: -150%;
    }
    100% {
      left: 150%;
    }
  }

  @keyframes glowPulse {
    0%, 100% {
      filter: drop-shadow(0 0 30px rgba(168, 85, 247, 1)) drop-shadow(0 0 60px rgba(168, 85, 247, 0.8));
    }
    50% {
      filter: drop-shadow(0 0 40px rgba(168, 85, 247, 1)) drop-shadow(0 0 80px rgba(168, 85, 247, 1));
    }
  }

  @keyframes twinkle {
    0%, 100% {
      opacity: 0.5;
    }
    50% {
      opacity: 1;
    }
  }

  /* Orb Title Shimmer Effect */
  .orb-title {
    background: linear-gradient(135deg, #e9d5ff 0%, #c084fc 50%, #a855f7 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    position: relative;
  }

  .orb-title::before {
    content: 'Orb';
    position: absolute;
    top: 0;
    left: 0;
    background: linear-gradient(90deg, transparent 0%, transparent 40%, rgba(255, 255, 255, 0.8) 50%, transparent 60%, transparent 100%);
    background-size: 200% 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmerMove 5s ease-in-out infinite;
  }

  @keyframes shimmerMove {
    0% {
      background-position: -200% 0;
    }
    100% {
      background-position: 200% 0;
    }
  }

  /* Performance optimizations */
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;
