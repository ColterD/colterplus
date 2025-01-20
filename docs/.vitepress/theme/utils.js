if (!Math.clamp) {
    Math.clamp = (num, min, max) => Math.min(Math.max(num, min), max)
  }