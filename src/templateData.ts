export type TemplateKind = 'sprite' | 'color-in';
export type TemplateCategory = 'characters' | 'items' | 'scenes' | 'color-in' | 'blank';

export interface TemplateDefinition {
  id: string;
  name: string;
  size: 16 | 32 | 64;
  kind: TemplateKind;
  category: TemplateCategory;
  locked?: boolean;
  palette?: string[];
}

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  { id: 'blank', name: 'Blank Canvas', size: 32, kind: 'sprite', category: 'blank' },

  { id: 'cat', name: 'Cat', size: 32, kind: 'sprite', category: 'characters' },
  { id: 'dog', name: 'Dog', size: 32, kind: 'sprite', category: 'characters' },
  { id: 'ghost', name: 'Ghost', size: 32, kind: 'sprite', category: 'characters' },
  { id: 'dragon', name: 'Dragon', size: 64, kind: 'sprite', category: 'characters' },
  { id: 'character', name: 'Character', size: 32, kind: 'sprite', category: 'characters' },
  { id: 'alien', name: 'Alien', size: 32, kind: 'sprite', category: 'characters' },

  { id: 'sneaker', name: 'Sneaker', size: 16, kind: 'sprite', category: 'items' },
  { id: 'sneaker_base', name: 'Sneaker Base', size: 32, kind: 'sprite', category: 'items' },
  { id: 'skate_deck', name: 'Skate Deck', size: 32, kind: 'sprite', category: 'items' },
  { id: 'hoodie', name: 'Hoodie', size: 32, kind: 'sprite', category: 'items' },
  { id: 'bag', name: 'Bag', size: 32, kind: 'sprite', category: 'items' },
  { id: 'cap', name: 'Cap', size: 32, kind: 'sprite', category: 'items' },
  { id: 'sword', name: 'Sword', size: 32, kind: 'sprite', category: 'items' },
  { id: 'shield', name: 'Shield', size: 32, kind: 'sprite', category: 'items' },
  { id: 'badge', name: 'Badge', size: 32, kind: 'sprite', category: 'items' },

  { id: 'cozy_room', name: 'Cozy Room', size: 64, kind: 'sprite', category: 'scenes' },
  { id: 'space_scene', name: 'Space Scene', size: 64, kind: 'sprite', category: 'scenes' },
  { id: 'mini_forest', name: 'Mini Forest', size: 64, kind: 'sprite', category: 'scenes' },
  { id: 'city_night', name: 'City Night', size: 64, kind: 'sprite', category: 'scenes' },

  {
    id: 'kawaii_bunny',
    name: 'Kawaii Bunny (Color-In)',
    size: 32,
    kind: 'color-in',
    category: 'color-in',
    palette: ['#F7E9D3', '#F2C8D8', '#FF88B6', '#F7A8B5', '#6A5D63', '#2E2430'],
  },
  {
    id: 'pixel_heart',
    name: 'Pixel Heart (Color-In)',
    size: 32,
    kind: 'color-in',
    category: 'color-in',
    palette: ['#FF4FA2', '#FF79B8', '#FFB2D5', '#FFC8E2', '#B72C6D'],
  },
  {
    id: 'lucky_star',
    name: 'Lucky Star (Color-In)',
    size: 32,
    kind: 'color-in',
    category: 'color-in',
    palette: ['#FFCA3A', '#F4A62A', '#FFE08A', '#FFF4CA', '#D18A1C'],
  },

  { id: 'pro', name: 'Pro Canvas', size: 64, kind: 'sprite', category: 'blank', locked: true },
];

type Painter = {
  px: (x: number, y: number, color: string) => void;
  rect: (x: number, y: number, w: number, h: number, color: string) => void;
  hline: (x: number, y: number, w: number, color: string) => void;
  vline: (x: number, y: number, h: number, color: string) => void;
};

const createPixels = (size: number): string[] => Array(size * size).fill('transparent');

const createScaledPainter = (pixels: string[], size: number): Painter => {
  const sx = (value: number) => Math.floor((value / 32) * size);

  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    const startX = sx(x);
    const startY = sx(y);
    const endX = sx(x + w);
    const endY = sx(y + h);
    for (let py = startY; py < endY; py++) {
      if (py < 0 || py >= size) continue;
      for (let px = startX; px < endX; px++) {
        if (px < 0 || px >= size) continue;
        pixels[py * size + px] = color;
      }
    }
  };

  const px = (x: number, y: number, color: string) => rect(x, y, 1, 1, color);
  const hline = (x: number, y: number, w: number, color: string) => rect(x, y, w, 1, color);
  const vline = (x: number, y: number, h: number, color: string) => rect(x, y, 1, h, color);

  return { px, rect, hline, vline };
};

const drawCharacterTemplates = (id: string, painter: Painter) => {
  const { rect, px, hline } = painter;
  if (id === 'cat') {
    rect(8, 8, 16, 14, '#D58A55');
    rect(9, 9, 14, 10, '#EFA571');
    rect(10, 11, 12, 6, '#F4C28E');
    rect(9, 22, 14, 5, '#A45F36');
    rect(9, 5, 4, 4, '#A45F36');
    rect(19, 5, 4, 4, '#A45F36');
    px(12, 13, '#1B1A1C'); px(19, 13, '#1B1A1C');
    px(13, 14, '#84B6FF'); px(18, 14, '#84B6FF');
    px(16, 16, '#F08DA8');
    hline(8, 8, 16, '#6A3D26');
    hline(8, 26, 16, '#6A3D26');
  }
  if (id === 'dog') {
    rect(8, 8, 16, 14, '#8C644A');
    rect(9, 9, 14, 10, '#A67855');
    rect(10, 11, 12, 6, '#C79A76');
    rect(7, 10, 3, 10, '#5D3F31');
    rect(22, 10, 3, 10, '#5D3F31');
    px(12, 13, '#19191A'); px(19, 13, '#19191A');
    rect(15, 15, 2, 2, '#282529');
    rect(13, 18, 6, 1, '#5D3F31');
    hline(8, 8, 16, '#4B3328');
  }
  if (id === 'ghost') {
    rect(9, 8, 14, 15, '#DDE9FF');
    rect(10, 9, 12, 10, '#F6FAFF');
    rect(11, 10, 10, 5, '#FFFFFF');
    rect(9, 23, 3, 4, '#B9C7E6');
    rect(14, 23, 4, 4, '#B9C7E6');
    rect(20, 23, 3, 4, '#B9C7E6');
    px(13, 14, '#1A2236'); px(18, 14, '#1A2236');
    rect(15, 16, 2, 2, '#7DA1D5');
  }
  if (id === 'dragon') {
    rect(8, 8, 18, 15, '#2E8D5A');
    rect(9, 9, 16, 10, '#43A874');
    rect(10, 11, 14, 6, '#7AD39E');
    rect(22, 9, 6, 5, '#2E8D5A');
    rect(24, 13, 3, 6, '#2E8D5A');
    rect(9, 6, 3, 3, '#A9E35D');
    rect(20, 6, 3, 3, '#A9E35D');
    px(13, 13, '#132A1C'); px(20, 13, '#132A1C');
    rect(15, 16, 4, 2, '#C6F16E');
    hline(8, 8, 18, '#1E5B3A');
    hline(8, 22, 18, '#1E5B3A');
  }
  if (id === 'character') {
    rect(12, 7, 8, 8, '#D8AD8D');
    rect(12, 15, 8, 9, '#4E74D9');
    rect(10, 16, 2, 8, '#4E74D9');
    rect(20, 16, 2, 8, '#4E74D9');
    rect(13, 24, 3, 6, '#2D2D3E');
    rect(16, 24, 3, 6, '#2D2D3E');
    rect(12, 7, 8, 2, '#805C49');
    px(14, 11, '#111112'); px(17, 11, '#111112');
    px(14, 12, '#7BA5FF'); px(17, 12, '#7BA5FF');
    hline(12, 14, 8, '#8E6A57');
  }
  if (id === 'alien') {
    rect(9, 8, 14, 13, '#71C06D');
    rect(10, 9, 12, 9, '#8EDC84');
    rect(11, 11, 10, 6, '#B8F3A8');
    rect(7, 10, 2, 8, '#71C06D');
    rect(23, 10, 2, 8, '#71C06D');
    rect(12, 21, 8, 6, '#4D6CA4');
    px(13, 13, '#1C2D1B'); px(18, 13, '#1C2D1B');
    px(14, 14, '#FFFFFF'); px(17, 14, '#FFFFFF');
    rect(14, 16, 4, 1, '#5A843F');
  }
};

const drawItemTemplates = (id: string, painter: Painter, size: number) => {
  const { rect, px, hline, vline } = painter;
  if (id === 'sneaker') {
    if (size <= 16) {
      rect(5, 18, 18, 5, '#E6E6E9');
      rect(6, 13, 14, 6, '#C15A4B');
      rect(10, 12, 6, 2, '#8A3A35');
      rect(10, 15, 4, 2, '#F9F9FA');
      hline(5, 22, 18, '#9A9BA2');
    } else if (size >= 64) {
      rect(4, 18, 22, 6, '#E9EAED');
      rect(5, 13, 17, 8, '#C96555');
      rect(10, 12, 8, 2, '#923B34');
      rect(10, 16, 6, 2, '#FFFFFF');
      rect(18, 14, 4, 4, '#B44F45');
      hline(4, 23, 22, '#A0A3AD');
      hline(5, 20, 17, '#7C2C2C');
    } else {
      rect(5, 18, 20, 6, '#E8E9EC');
      rect(6, 13, 15, 8, '#C85E50');
      rect(10, 12, 7, 2, '#913A34');
      rect(10, 16, 5, 2, '#FAFAFB');
      hline(5, 23, 20, '#9FA2AA');
    }
  }
  if (id === 'sneaker_base') {
    rect(5, 18, 20, 6, '#D5D7DC');
    rect(6, 13, 15, 8, '#C4C7CF');
    rect(10, 12, 7, 2, '#9FA3AE');
    rect(10, 16, 5, 2, '#E8EAEE');
    hline(5, 23, 20, '#878C98');
  }
  if (id === 'skate_deck') {
    rect(6, 10, 20, 12, '#6B452E');
    rect(7, 11, 18, 10, '#8A5A3C');
    rect(8, 12, 16, 2, '#A26D46');
    rect(8, 20, 16, 1, '#513223');
    rect(10, 23, 3, 3, '#A8ABB5');
    rect(19, 23, 3, 3, '#A8ABB5');
    px(11, 24, '#30323B'); px(20, 24, '#30323B');
  }
  if (id === 'hoodie') {
    rect(8, 8, 16, 18, '#4E4E58');
    rect(9, 9, 14, 14, '#626272');
    rect(10, 10, 12, 7, '#7B7B8C');
    rect(10, 18, 12, 6, '#535363');
    rect(12, 20, 8, 3, '#3E3E4A');
    vline(16, 14, 10, '#9495A8');
  }
  if (id === 'bag') {
    rect(9, 11, 14, 14, '#5F3A22');
    rect(10, 12, 12, 10, '#7A4B2D');
    rect(11, 13, 10, 7, '#9A653C');
    rect(12, 8, 8, 3, '#3E2616');
    rect(12, 17, 8, 1, '#B37A4D');
    px(16, 17, '#E8D0A8');
  }
  if (id === 'cap') {
    rect(8, 12, 16, 7, '#2F4DAA');
    rect(9, 13, 14, 5, '#4265C7');
    rect(10, 14, 12, 2, '#6A8BE6');
    rect(6, 18, 20, 3, '#243D86');
    hline(6, 20, 20, '#1B2D63');
  }
  if (id === 'sword') {
    rect(15, 6, 2, 18, '#C4CAD7');
    rect(15, 6, 2, 8, '#E7EBF2');
    rect(13, 16, 6, 2, '#9B6A31');
    rect(14, 18, 4, 2, '#C38942');
    rect(15, 20, 2, 8, '#6A4723');
    px(15, 27, '#E1BE77'); px(16, 27, '#E1BE77');
  }
  if (id === 'shield') {
    rect(9, 8, 14, 18, '#6D788F');
    rect(10, 9, 12, 14, '#8793AB');
    rect(11, 10, 10, 10, '#A8B5CF');
    rect(14, 12, 4, 10, '#D8A84B');
    hline(9, 25, 14, '#4A5267');
  }
  if (id === 'badge') {
    rect(10, 10, 12, 12, '#E5B74A');
    rect(11, 11, 10, 10, '#FFD06A');
    rect(12, 12, 8, 8, '#FFE49A');
    px(16, 12, '#FFFFFF');
    rect(14, 18, 4, 2, '#C98D2A');
    hline(10, 21, 12, '#B9781F');
  }
};

const drawSceneTemplates = (id: string, painter: Painter) => {
  const { rect, px, hline } = painter;
  if (id === 'cozy_room') {
    rect(0, 0, 32, 20, '#2C3040');
    rect(0, 20, 32, 12, '#5A4A3B');
    rect(4, 5, 10, 10, '#506A8A');
    rect(5, 6, 8, 8, '#83A8CF');
    rect(19, 10, 9, 8, '#7B5E46');
    rect(19, 8, 9, 2, '#A5805D');
    rect(20, 15, 7, 1, '#CCA070');
    rect(8, 22, 16, 6, '#B88A58');
    hline(0, 20, 32, '#3E342A');
  }
  if (id === 'space_scene') {
    rect(0, 0, 32, 32, '#121827');
    rect(0, 22, 32, 10, '#1E2A4A');
    rect(8, 18, 16, 6, '#445F96');
    rect(10, 16, 12, 4, '#6A87BF');
    rect(13, 12, 6, 4, '#98B6EA');
    [[3, 3], [8, 5], [15, 4], [23, 7], [27, 5], [29, 10], [5, 12], [12, 8], [20, 4], [25, 13]].forEach(([x, y]) => {
      px(x, y, '#DCE9FF');
    });
    rect(21, 19, 3, 2, '#E9B864');
  }
  if (id === 'mini_forest') {
    rect(0, 0, 32, 17, '#3A5C8F');
    rect(0, 17, 32, 15, '#2D5A38');
    rect(4, 14, 8, 8, '#2D6B3D');
    rect(6, 18, 2, 8, '#5F3E26');
    rect(13, 11, 10, 10, '#3A7E45');
    rect(17, 18, 2, 8, '#6A4629');
    rect(22, 15, 8, 8, '#2E6D3E');
    rect(25, 20, 2, 7, '#5D3D25');
    rect(0, 24, 32, 8, '#355D34');
    [[2, 26], [6, 27], [12, 25], [20, 27], [27, 26], [29, 24], [15, 29]].forEach(([x, y]) => px(x, y, '#6CA460'));
  }
  if (id === 'city_night') {
    rect(0, 0, 32, 20, '#171A2B');
    rect(0, 20, 32, 12, '#23273B');
    rect(2, 8, 6, 12, '#2F344B');
    rect(9, 5, 7, 15, '#262C44');
    rect(17, 7, 6, 13, '#313855');
    rect(24, 4, 6, 16, '#282D43');
    [[3, 10], [5, 12], [10, 8], [12, 11], [18, 11], [20, 14], [25, 7], [27, 12], [28, 15]].forEach(([x, y]) => px(x, y, '#F1D97C'));
    rect(0, 21, 32, 1, '#3A3F57');
    hline(0, 25, 32, '#1B1F2C');
  }
};

const drawColorInOutline = (id: string, painter: Painter) => {
  const { px, hline, vline } = painter;
  const outline = '#252529';

  if (id === 'kawaii_bunny') {
    hline(10, 8, 12, outline);
    hline(9, 9, 14, outline);
    hline(8, 10, 16, outline);
    hline(8, 11, 16, outline);
    hline(9, 12, 14, outline);
    hline(10, 13, 12, outline);
    vline(9, 13, 10, outline);
    vline(22, 13, 10, outline);
    hline(10, 22, 12, outline);
    hline(11, 23, 10, outline);
    hline(12, 24, 8, outline);
    vline(12, 3, 6, outline);
    vline(19, 3, 6, outline);
    hline(12, 3, 2, outline);
    hline(18, 3, 2, outline);
    px(13, 15, outline); px(18, 15, outline); px(16, 17, outline);
    hline(13, 28, 2, outline); hline(17, 28, 2, outline);
    rectForBow(painter, 20, 11, outline);
  }

  if (id === 'pixel_heart') {
    const points: Array<[number, number]> = [
      [12, 8], [13, 7], [14, 7], [15, 8], [16, 9], [17, 8], [18, 7], [19, 7], [20, 8],
      [21, 9], [22, 10], [22, 11], [21, 12], [20, 13], [19, 14], [18, 15], [17, 16], [16, 17],
      [15, 16], [14, 15], [13, 14], [12, 13], [11, 12], [10, 11], [10, 10], [11, 9],
    ];
    points.forEach(([x, y]) => px(x, y, outline));
    hline(12, 8, 9, outline);
    hline(11, 9, 11, outline);
  }

  if (id === 'lucky_star') {
    hline(15, 6, 2, outline);
    hline(14, 7, 4, outline);
    hline(12, 8, 8, outline);
    hline(11, 9, 10, outline);
    hline(10, 10, 12, outline);
    hline(9, 11, 14, outline);
    hline(11, 12, 10, outline);
    hline(12, 13, 8, outline);
    hline(13, 14, 6, outline);
    hline(14, 15, 4, outline);
    hline(14, 16, 4, outline);
    hline(13, 17, 6, outline);
    hline(12, 18, 8, outline);
    hline(11, 19, 10, outline);
    hline(10, 20, 12, outline);
    hline(9, 21, 14, outline);
    hline(10, 22, 12, outline);
    hline(12, 23, 8, outline);
    hline(14, 24, 4, outline);
  }
};

const rectForBow = (painter: Painter, x: number, y: number, color: string) => {
  painter.px(x, y, color);
  painter.px(x + 1, y - 1, color);
  painter.px(x + 1, y, color);
  painter.px(x + 1, y + 1, color);
  painter.px(x + 2, y, color);
  painter.px(x + 3, y - 1, color);
  painter.px(x + 3, y, color);
  painter.px(x + 3, y + 1, color);
  painter.px(x + 4, y, color);
};

const resolveLegacyTemplateId = (id: string): string => {
  if (id === 'face' || id === 'body') return 'character';
  if (id === 'pet') return 'cat';
  if (id === 'room') return 'cozy_room';
  return id;
};

export const getTemplatePixels = (rawId: string, size: number): string[] => {
  const id = resolveLegacyTemplateId(rawId);
  const pixels = createPixels(size);
  const painter = createScaledPainter(pixels, size);

  if (id === 'blank' || id === 'pro') return pixels;

  drawCharacterTemplates(id, painter);
  drawItemTemplates(id, painter, size);
  drawSceneTemplates(id, painter);

  if (id === 'kawaii_bunny' || id === 'pixel_heart' || id === 'lucky_star') {
    drawColorInOutline(id, painter);
  }

  return pixels;
};

export const getTemplateDefinitionById = (rawId: string): TemplateDefinition | undefined => {
  const id = resolveLegacyTemplateId(rawId);
  return TEMPLATE_DEFINITIONS.find(template => template.id === id);
};

export const getTemplateLockMask = (rawId: string, size: number): Uint8Array | null => {
  const id = resolveLegacyTemplateId(rawId);
  if (id !== 'kawaii_bunny' && id !== 'pixel_heart' && id !== 'lucky_star') return null;
  const outline = getTemplatePixels(id, size);
  const mask = new Uint8Array(size * size);
  for (let i = 0; i < outline.length; i++) {
    if (outline[i] !== 'transparent') {
      mask[i] = 1;
    }
  }
  return mask;
};

export const buildColorableMask = (size: number, lockMask: Uint8Array): Uint8Array => {
  const outside = new Uint8Array(size * size);
  const stack: number[] = [];

  const enqueue = (x: number, y: number) => {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const idx = y * size + x;
    if (outside[idx] === 1 || lockMask[idx] === 1) return;
    outside[idx] = 1;
    stack.push(idx);
  };

  for (let x = 0; x < size; x++) {
    enqueue(x, 0);
    enqueue(x, size - 1);
  }
  for (let y = 0; y < size; y++) {
    enqueue(0, y);
    enqueue(size - 1, y);
  }

  while (stack.length) {
    const idx = stack.pop()!;
    const x = idx % size;
    const y = Math.floor(idx / size);
    enqueue(x - 1, y);
    enqueue(x + 1, y);
    enqueue(x, y - 1);
    enqueue(x, y + 1);
  }

  const colorableMask = new Uint8Array(size * size);
  for (let i = 0; i < colorableMask.length; i++) {
    if (lockMask[i] === 0 && outside[i] === 0) {
      colorableMask[i] = 1;
    }
  }

  return colorableMask;
};
