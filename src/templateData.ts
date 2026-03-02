
export const getTemplatePixels = (id: string, size: number): string[] => {
  const pixels = Array(size * size).fill('transparent');
  const center = Math.floor(size / 2);

  if (id === 'face') {
    // Simple face outline
    for (let y = center - 8; y < center + 8; y++) {
      for (let x = center - 8; x < center + 8; x++) {
        const dist = Math.sqrt(Math.pow(x - center, 2) + Math.pow(y - center, 2));
        if (dist < 8) pixels[y * size + x] = '#ffdbac'; // Skin tone
        if (dist > 7.5 && dist < 8.5) pixels[y * size + x] = '#000000'; // Outline
      }
    }
    // Eyes
    pixels[(center - 3) * size + (center - 3)] = '#000000';
    pixels[(center - 3) * size + (center + 3)] = '#000000';
    // Mouth
    for (let x = center - 3; x <= center + 3; x++) {
      pixels[(center + 4) * size + x] = '#000000';
    }
  }

  if (id === 'body') {
    // Head
    for (let y = 4; y < 12; y++) {
      for (let x = center - 4; x < center + 4; x++) {
        pixels[y * size + x] = '#ffdbac';
      }
    }
    // Torso
    for (let y = 12; y < 22; y++) {
      for (let x = center - 6; x < center + 6; x++) {
        pixels[y * size + x] = '#3366ff'; // Blue shirt
      }
    }
    // Legs
    for (let y = 22; y < 30; y++) {
      for (let x = center - 5; x < center - 1; x++) pixels[y * size + x] = '#333333';
      for (let x = center + 1; x < center + 5; x++) pixels[y * size + x] = '#333333';
    }
  }

  if (id === 'sneaker') {
    // Sole
    for (let x = 6; x < 26; x++) {
      pixels[24 * size + x] = '#ffffff';
      pixels[25 * size + x] = '#cccccc';
    }
    // Body
    for (let y = 16; y < 24; y++) {
      for (let x = 8; x < 24; x++) {
        if (x > 18 && y < 20) continue; // Ankle area
        pixels[y * size + x] = '#ff0000'; // Red sneaker
      }
    }
    // Laces
    for (let y = 18; y < 22; y++) {
      pixels[y * size + 14] = '#ffffff';
    }
  }

  if (id === 'pet') {
    // Body
    for (let y = center - 4; y < center + 6; y++) {
      for (let x = center - 8; x < center + 8; x++) {
        pixels[y * size + x] = '#ffaa00'; // Orange fur
      }
    }
    // Head
    for (let y = center - 10; y < center - 4; y++) {
      for (let x = center - 6; x < center + 6; x++) {
        pixels[y * size + x] = '#ffaa00';
      }
    }
    // Ears
    pixels[(center - 11) * size + (center - 5)] = '#ffaa00';
    pixels[(center - 11) * size + (center + 5)] = '#ffaa00';
    // Eyes
    pixels[(center - 7) * size + (center - 2)] = '#000000';
    pixels[(center - 7) * size + (center + 2)] = '#000000';
  }

  if (id === 'room') {
    // Floor
    for (let y = 24; y < 32; y++) {
      for (let x = 0; x < 32; x++) {
        pixels[y * size + x] = '#8b4513'; // Brown floor
      }
    }
    // Walls
    for (let y = 0; y < 24; y++) {
      for (let x = 0; x < 32; x++) {
        pixels[y * size + x] = '#f0f0f0'; // Light wall
      }
    }
    // Window
    for (let y = 6; y < 14; y++) {
      for (let x = 6; x < 14; x++) {
        pixels[y * size + x] = '#87ceeb'; // Sky blue
      }
    }
  }

  if (id === 'hoodie') {
    // Body
    for (let y = 10; y < 26; y++) {
      for (let x = center - 8; x < center + 8; x++) {
        pixels[y * size + x] = '#444444'; // Dark grey
      }
    }
    // Hood
    for (let y = 4; y < 10; y++) {
      for (let x = center - 6; x < center + 6; x++) {
        pixels[y * size + x] = '#444444';
      }
    }
    // Pocket
    for (let y = 20; y < 24; y++) {
      for (let x = center - 4; x < center + 4; x++) {
        pixels[y * size + x] = '#333333';
      }
    }
  }

  return pixels;
};
