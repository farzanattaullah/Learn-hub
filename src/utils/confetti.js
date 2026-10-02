import confetti from 'canvas-confetti';

export function fireJuicyConfetti(originX = 0.5, originY = 0.6) {
  confetti({
    particleCount: 40,
    spread: 70,
    origin: { x: originX, y: originY },
    colors: ['#ef4444', '#f59e0b', '#10b981', '#6366f1', '#ec4899', '#fbbf24'],
    ticks: 200,
    gravity: 1.1,
    scalar: 0.9,
    shapes: ['circle', 'square']
  });
}

export function fireSuccessConfetti() {
  fireJuicyConfetti(0.5, 0.55);
}
