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

  /* Performance optimizations */
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
`;
