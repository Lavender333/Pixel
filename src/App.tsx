import React, { useState, useEffect, useRef } from 'react';
import { 
  Pencil, 
  Eraser, 
  Trash2, 
  Download, 
  Plus, 
  Play, 
  Pause, 
  Layout, 
  Save,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Palette,
  Undo2,
  User,
  Shirt,
  Target,
  PlusCircle,
  Pipette,
  Maximize2,
  Sparkles,
  Zap,
  ShieldCheck,
  Settings,
  Flame,
  Star,
  Gem,
  Crown,
  Search,
  X,
  Square,
  Eye,
  PaintBucket,
  RotateCcw,
  Layers,
  Wand2,
  Dices,
  Monitor,
  Copy,
  ArrowLeft,
  ArrowRight,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { getTemplatePixels } from './templateData';
import { Frame, Project, ProjectData, UserStats, Challenge, Submission } from './types';
import { PixelCanvas } from './PixelCanvas';

// --- Constants & Assets ---

const STARTER_PALETTE = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#ff8800', '#88ff00', '#00ff88', '#0088ff', '#8800ff', '#ff0088', '#888888', '#444444',
  '#ffcccc', '#ccffcc', '#ccccff', '#ffffcc', '#ffccff', '#ccffff', '#884400', '#442200'
];

const TEMPLATES = [
  { id: 'blank', name: 'Blank Canvas', icon: <PlusCircle className="w-6 h-6" />, size: 32 },
  { id: 'face', name: 'Pixel Face', icon: <User className="w-6 h-6" />, size: 32 },
  { id: 'body', name: 'Full Body', icon: <User className="w-6 h-6" />, size: 32 },
  { id: 'sneaker', name: 'Sneaker Base', icon: <Target className="w-6 h-6" />, size: 32 },
  { id: 'pet', name: 'Pet Base', icon: <Sparkles className="w-6 h-6" />, size: 32 },
  { id: 'room', name: 'Mini Room', icon: <Layout className="w-6 h-6" />, size: 32 },
  { id: 'hoodie', name: 'Hoodie', icon: <Shirt className="w-6 h-6" />, size: 32 },
  { id: 'pro', name: 'Pro Canvas', icon: <Crown className="w-6 h-6" />, size: 64, locked: true },
];

const TRENDING_PALETTES = [
  { name: 'Y2K', colors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0088', '#8800FF'] },
  { name: 'Soft Girl', colors: ['#FFB6C1', '#FFD1DC', '#FFF0F5', '#E6E6FA', '#F0F8FF'] },
  { name: 'Street Mode', colors: ['#1A1A1A', '#FF4400', '#00FF00', '#FFFFFF', '#888888'] },
];

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '' }: any) => {
  const variants: any = {
    primary: 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20',
    secondary: 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300',
    ghost: 'bg-transparent hover:bg-zinc-800 text-zinc-400',
    neon: 'bg-emerald-500 hover:bg-emerald-400 text-black font-bold shadow-lg shadow-emerald-500/20'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`px-6 py-3 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 flex-1 py-2 transition-all ${
      active ? 'text-purple-500' : 'text-zinc-500 hover:text-zinc-400'
    }`}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
);

export default function App() {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<'create' | 'closet' | 'challenges' | 'profile'>('create');
  const [onboarding, setOnboarding] = useState(true);
  const [showTemplates, setShowTemplates] = useState(false);
  
  // Editor State
  const [gridSize, setGridSize] = useState(32);
  const [frames, setFrames] = useState<Frame[]>([{ id: '1', pixels: Array(32 * 32).fill('transparent') }]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [palette, setPalette] = useState<string[]>(STARTER_PALETTE);
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'fill' | 'picker'>('pencil');
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [projectName, setProjectName] = useState('New Identity');
  const [history, setHistory] = useState<string[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [mirrorMode, setMirrorMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(8);
  const [showPreview, setShowPreview] = useState(true); // Default to true for the mini-preview
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewFrameIndex, setPreviewFrameIndex] = useState(0);
  const [onionSkinning, setOnionSkinning] = useState(false);
  const [showShades, setShowShades] = useState(true);
  const [activePaletteTab, setActivePaletteTab] = useState<'current' | 'saved' | 'trending'>('current');
  const [savedPalettes, setSavedPalettes] = useState<{name: string, colors: string[]}[]>(TRENDING_PALETTES);
  const [paletteName, setPaletteName] = useState('My New Palette');

  // Data State
  const [stats, setStats] = useState<UserStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Effects
  useEffect(() => {
    fetchData();
    const interval = setInterval(autoSave, 5000);
    
    // Fail-safe: force loading to false after 5 seconds if it's still true
    const failSafe = setTimeout(() => {
      setLoading(false);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(failSafe);
    };
  }, []);

  useEffect(() => {
    let timeout: any;
    if (isPlaying && frames.length > 1) {
      const playNextFrame = () => {
        setPreviewFrameIndex((prev) => {
          const nextIndex = (prev + 1) % frames.length;
          const currentFrame = frames[nextIndex];
          const duration = currentFrame.duration || 1;
          timeout = setTimeout(playNextFrame, (1000 / fps) * duration);
          return nextIndex;
        });
      };
      
      const currentFrame = frames[previewFrameIndex];
      const duration = currentFrame.duration || 1;
      timeout = setTimeout(playNextFrame, (1000 / fps) * duration);
    } else {
      setPreviewFrameIndex(currentFrameIndex);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, fps, frames, currentFrameIndex]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchWithTimeout = async (url: string, timeout = 3000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
          const response = await fetch(url, { signal: controller.signal });
          clearTimeout(id);
          if (!response.ok) return null;
          return await response.json();
        } catch (e) {
          clearTimeout(id);
          return null;
        }
      };

      const [pData, sData, cData, subData] = await Promise.all([
        fetchWithTimeout('/api/projects'),
        fetchWithTimeout('/api/stats'),
        fetchWithTimeout('/api/challenges'),
        fetchWithTimeout('/api/submissions')
      ]);

      if (pData) setProjects(pData.map((p: any) => ({ ...p, ...JSON.parse(p.data) })));
      if (sData) setStats(sData);
      if (cData) setChallenges(cData);
      if (subData) setSubmissions(subData);
    } catch (error) {
      console.error("Critical fetch error:", error);
    } finally {
      // Always ensure loading is false after a reasonable time
      setLoading(false);
    }
  };

  const autoSave = () => {
    // Implement auto-save logic here if needed
  };

  const generateShades = (hex: string) => {
    // Simple hex to shade generator
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    const adjust = (val: number, factor: number) => Math.max(0, Math.min(255, Math.round(val * factor)));
    const toHex = (val: number) => val.toString(16).padStart(2, '0');
    
    const factors = [0.6, 0.8, 1.2, 1.4];
    return factors.map(f => `#${toHex(adjust(r, f))}${toHex(adjust(g, f))}${toHex(adjust(b, f))}`);
  };

  // Editor Handlers
  const isTeenMode = (stats?.level || 1) >= 10;

  const saveToHistory = (pixels: string[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...pixels]);
    if (newHistory.length > 50) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevPixels = history[historyIndex - 1];
      const newFrames = [...frames];
      newFrames[currentFrameIndex] = { ...newFrames[currentFrameIndex], pixels: [...prevPixels] };
      setFrames(newFrames);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextPixels = history[historyIndex + 1];
      const newFrames = [...frames];
      newFrames[currentFrameIndex] = { ...newFrames[currentFrameIndex], pixels: [...nextPixels] };
      setFrames(newFrames);
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        } else if ((e.key === 'y') || (e.key === 'z' && e.shiftKey)) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handlePixelAction = (index: number, isInitialClick = false) => {
    const currentFrame = frames[currentFrameIndex];
    const currentPixels = currentFrame.pixels;
    
    if (tool === 'picker') {
      // Pick from user pixels first, then base pixels
      if (currentPixels[index] !== 'transparent') {
        setSelectedColor(currentPixels[index]);
        setTool('pencil');
      } else if (currentFrame.basePixels && currentFrame.basePixels[index] !== 'transparent') {
        setSelectedColor(currentFrame.basePixels[index]);
        setTool('pencil');
      }
      return;
    }

    if (tool === 'fill') {
      if (!isInitialClick) return;
      const targetColor = currentPixels[index];
      const newPixels = floodFill(index, targetColor, selectedColor, currentPixels);
      if (newPixels) {
        updateFrame(newPixels);
        saveToHistory(newPixels);
      }
      return;
    }

    const color = tool === 'pencil' ? selectedColor : 'transparent';
    if (currentPixels[index] === color) return;

    const newPixels = [...currentPixels];
    newPixels[index] = color;

    if (mirrorMode) {
      const x = index % gridSize;
      const y = Math.floor(index / gridSize);
      const mirrorX = gridSize - 1 - x;
      const mirrorIndex = y * gridSize + mirrorX;
      newPixels[mirrorIndex] = color;
    }

    updateFrame(newPixels);
    if (isInitialClick) saveToHistory(newPixels);
  };

  const updateFrame = (pixels: string[]) => {
    const newFrames = [...frames];
    newFrames[currentFrameIndex] = { ...newFrames[currentFrameIndex], pixels };
    setFrames(newFrames);
  };

  const floodFill = (index: number, targetColor: string, replacementColor: string, pixels: string[]) => {
    if (targetColor === replacementColor) return;
    if (pixels[index] !== targetColor) return;
    const stack = [index];
    const newPixels = [...pixels];
    while (stack.length > 0) {
      const curr = stack.pop()!;
      if (newPixels[curr] === targetColor) {
        newPixels[curr] = replacementColor;
        const x = curr % gridSize;
        const y = Math.floor(curr / gridSize);
        if (x > 0) stack.push(curr - 1);
        if (x < gridSize - 1) stack.push(curr + 1);
        if (y > 0) stack.push(curr - gridSize);
        if (y < gridSize - 1) stack.push(curr + gridSize);
      }
    }
    return newPixels;
  };

  const clearCanvas = () => {
    const newPixels = Array(gridSize * gridSize).fill('transparent');
    updateFrame(newPixels);
    saveToHistory(newPixels);
  };

  const remixColors = () => {
    const currentPixels = frames[currentFrameIndex].pixels;
    const uniqueColors = Array.from(new Set(currentPixels.filter(c => c !== 'transparent'))) as string[];
    if (uniqueColors.length === 0) return;

    const randomPalette = TRENDING_PALETTES[Math.floor(Math.random() * TRENDING_PALETTES.length)].colors;
    const colorMap: Record<string, string> = {};
    
    uniqueColors.forEach((oldColor, i) => {
      colorMap[oldColor] = randomPalette[i % randomPalette.length];
    });

    const newPixels = currentPixels.map(c => c === 'transparent' ? 'transparent' : colorMap[c]);
    updateFrame(newPixels);
    saveToHistory(newPixels);
    
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.8 },
      colors: randomPalette
    });
  };

  const applyAnimationPreset = (preset: 'bounce' | 'blink' | 'float' | 'pulse' | 'shake') => {
    const currentFrame = frames[currentFrameIndex];
    const basePixels = [...currentFrame.pixels];
    const baseBasePixels = currentFrame.basePixels ? [...currentFrame.basePixels] : undefined;
    let newFrames: Frame[] = [];

    const createFrame = (pixels: string[]) => ({
      id: Math.random().toString(36).substr(2, 9),
      pixels,
      basePixels: baseBasePixels
    });

    if (preset === 'bounce') {
      // 4-frame bounce loop
      newFrames.push(createFrame([...basePixels]));
      
      // Squash
      const squash = Array(gridSize * gridSize).fill('transparent');
      basePixels.forEach((c, i) => {
        if (c === 'transparent') return;
        const x = i % gridSize;
        const y = Math.floor(i / gridSize);
        const newY = Math.min(gridSize - 1, y + 1);
        squash[newY * gridSize + x] = c;
      });
      newFrames.push(createFrame(squash));
      
      // Stretch
      const stretch = Array(gridSize * gridSize).fill('transparent');
      basePixels.forEach((c, i) => {
        if (c === 'transparent') return;
        const x = i % gridSize;
        const y = Math.floor(i / gridSize);
        const newY = Math.max(0, y - 1);
        stretch[newY * gridSize + x] = c;
      });
      newFrames.push(createFrame(stretch));
      newFrames.push(createFrame([...basePixels]));
    }

    if (preset === 'blink') {
      newFrames.push(createFrame([...basePixels]));
      const blinked = basePixels.map((c, i) => {
        const y = Math.floor(i / gridSize);
        // Heuristic: top half white/light pixels are eyes
        const r = parseInt(c.slice(1, 3), 16);
        const g = parseInt(c.slice(3, 5), 16);
        const b = parseInt(c.slice(5, 7), 16);
        const brightness = (r + g + b) / 3;
        if (y < gridSize / 2 && brightness > 200) {
          return 'transparent';
        }
        return c;
      });
      newFrames.push(createFrame(blinked));
    }

    if (preset === 'float') {
      for (let i = 0; i < 6; i++) {
        const offset = Math.round(Math.sin((i / 6) * Math.PI * 2) * 2);
        const shifted = Array(gridSize * gridSize).fill('transparent');
        basePixels.forEach((c, idx) => {
          if (c === 'transparent') return;
          const x = idx % gridSize;
          const y = Math.floor(idx / gridSize);
          const newY = y + offset;
          if (newY >= 0 && newY < gridSize) {
            shifted[newY * gridSize + x] = c;
          }
        });
        newFrames.push(createFrame(shifted));
      }
    }

    if (preset === 'pulse') {
      newFrames.push(createFrame([...basePixels]));
      const pulsed = basePixels.map(c => {
        if (c === 'transparent') return 'transparent';
        const r = parseInt(c.slice(1, 3), 16);
        const g = parseInt(c.slice(3, 5), 16);
        const b = parseInt(c.slice(5, 7), 16);
        const factor = 1.2;
        const toHex = (val: number) => Math.min(255, Math.round(val * factor)).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
      });
      newFrames.push(createFrame(pulsed));
    }

    if (preset === 'shake') {
      for (let i = 0; i < 4; i++) {
        const xOffset = (i % 2 === 0) ? 1 : -1;
        const shifted = Array(gridSize * gridSize).fill('transparent');
        basePixels.forEach((c, idx) => {
          if (c === 'transparent') return;
          const x = idx % gridSize;
          const y = Math.floor(idx / gridSize);
          const newX = x + xOffset;
          if (newX >= 0 && newX < gridSize) {
            shifted[y * gridSize + newX] = c;
          }
        });
        newFrames.push(createFrame(shifted));
      }
    }

    setFrames(newFrames);
    setCurrentFrameIndex(0);
    setIsPlaying(true);
  };

  const applyEffect = (effect: 'glow' | 'sparkle' | 'outline' | 'remix') => {
    const currentPixels = [...frames[currentFrameIndex].pixels];
    const newPixels = [...currentPixels];

    if (effect === 'glow') {
      currentPixels.forEach((color, i) => {
        if (color !== 'transparent') {
          const x = i % gridSize;
          const y = Math.floor(i / gridSize);
          // Check neighbors
          const neighbors = [
            { nx: x - 1, ny: y }, { nx: x + 1, ny: y },
            { nx: x, ny: y - 1 }, { nx: x, ny: y + 1 }
          ];
          neighbors.forEach(({ nx, ny }) => {
            if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
              const nIdx = ny * gridSize + nx;
              if (currentPixels[nIdx] === 'transparent') {
                newPixels[nIdx] = color + '44'; // Add transparency
              }
            }
          });
        }
      });
    }

    if (effect === 'sparkle') {
      currentPixels.forEach((color, i) => {
        if (color !== 'transparent' && Math.random() > 0.8) {
          const x = i % gridSize;
          const y = Math.floor(i / gridSize);
          const sx = x + (Math.random() > 0.5 ? 1 : -1);
          const sy = y + (Math.random() > 0.5 ? 1 : -1);
          if (sx >= 0 && sx < gridSize && sy >= 0 && sy < gridSize) {
            newPixels[sy * gridSize + sx] = '#ffffff';
          }
        }
      });
    }

    if (effect === 'outline') {
      // Create a temporary array to track which pixels should be outlined
      const outlinePixels = new Set<number>();
      
      currentPixels.forEach((color, i) => {
        if (color !== 'transparent') {
          const x = i % gridSize;
          const y = Math.floor(i / gridSize);
          
          // Check all 8 neighbors
          const neighbors = [
            { nx: x - 1, ny: y - 1 }, { nx: x, ny: y - 1 }, { nx: x + 1, ny: y - 1 },
            { nx: x - 1, ny: y },                         { nx: x + 1, ny: y },
            { nx: x - 1, ny: y + 1 }, { nx: x, ny: y + 1 }, { nx: x + 1, ny: y + 1 }
          ];
          
          neighbors.forEach(({ nx, ny }) => {
            if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
              const nIdx = ny * gridSize + nx;
              if (currentPixels[nIdx] === 'transparent') {
                outlinePixels.add(nIdx);
              }
            }
          });
        }
      });
      
      // Apply black outline
      outlinePixels.forEach(idx => {
        newPixels[idx] = '#000000';
      });
    }

    if (effect === 'remix') {
      // Color remix - swap to a trending palette
      const trendingPalettes = [
        ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dda0dd', '#98d8c8'],
        ['#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#fae042'],
        ['#a8edea', '#fed6e3', '#d299c2', '#fef9d7', '#c8c6fa', '#b8f2e6', '#aec6cf'],
        ['#ff9a9e', '#fecfef', '#fecfef', '#a8e6cf', '#dcedc8', '#ffd3a5', '#ffaaa5']
      ];
      
      const randomPalette = trendingPalettes[Math.floor(Math.random() * trendingPalettes.length)];
      const usedColors = new Set(currentPixels.filter(c => c !== 'transparent'));
      const colorMap = new Map<string, string>();
      
      Array.from(usedColors).forEach((color, index) => {
        if (index < randomPalette.length) {
          colorMap.set(color, randomPalette[index]);
        }
      });
      
      currentPixels.forEach((color, i) => {
        if (color !== 'transparent' && colorMap.has(color)) {
          newPixels[i] = colorMap.get(color)!;
        }
      });
    }

    updateFrame(newPixels);
    saveToHistory(newPixels);
  };

  const saveCurrentPalette = () => {
    if (palette.length === 0) return;
    const newPalette = { name: paletteName || `Palette ${savedPalettes.length + 1}`, colors: [...palette] };
    setSavedPalettes([newPalette, ...savedPalettes]);
    setActivePaletteTab('saved');
    setPaletteName('');
  };

  const deleteSavedPalette = (index: number) => {
    setSavedPalettes(savedPalettes.filter((_, i) => i !== index));
  };

  const addColorToPalette = (color: string) => {
    if (!palette.includes(color)) {
      setPalette([...palette, color]);
    }
  };

  const removeColorFromPalette = (color: string) => {
    setPalette(palette.filter(c => c !== color));
  };

  const downloadImage = () => {
    const canvas = document.createElement('canvas');
    const scale = 20; // Upscale for crisp pixel art
    canvas.width = gridSize * scale;
    canvas.height = gridSize * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    
    frames[currentFrameIndex].pixels.forEach((color, i) => {
      const x = (i % gridSize) * scale;
      const y = Math.floor(i / gridSize) * scale;
      if (color !== 'transparent') {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, scale, scale);
      }
    });
    
    const link = document.createElement('a');
    link.download = `${projectName}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const saveProject = async () => {
    const projectData: ProjectData = { gridSize, frames, palette };
    const thumbnail = await generateThumbnail();
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: projectName,
        data: JSON.stringify(projectData),
        thumbnail,
        type: 'avatar'
      })
    });
    if (res.ok) {
      fetchData();
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#10b981', '#f59e0b']
      });
    }
  };

  const generateThumbnail = async (): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = gridSize;
    canvas.height = gridSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    frames[0].pixels.forEach((color, i) => {
      const x = i % gridSize;
      const y = Math.floor(i / gridSize);
      ctx.fillStyle = color === 'transparent' ? 'rgba(0,0,0,0)' : color;
      ctx.fillRect(x, y, 1, 1);
    });
    return canvas.toDataURL();
  };

  const startWithTemplate = (template: any) => {
    const basePixels = getTemplatePixels(template.id, template.size);
    const emptyPixels = Array(template.size * template.size).fill('transparent');
    setGridSize(template.size);
    setFrames([{ id: Math.random().toString(36).substr(2, 9), pixels: emptyPixels, basePixels }]);
    setProjectName(template.name);
    setShowTemplates(false);
    setOnboarding(false);
    saveToHistory(emptyPixels);
  };

  // --- Sub-Views ---

  const OnboardingView = () => (
    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center p-8 text-center">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="max-w-md w-full flex flex-col items-center"
      >
        <div className="w-24 h-24 bg-purple-600 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-purple-500/20">
          <Palette className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-display italic text-white mb-4 tracking-tighter">Build Your Pixel Identity.</h1>
        <p className="text-zinc-500 mb-12">Create. Customize. Share.</p>
        
        <Button onClick={() => setShowTemplates(true)} className="w-full py-4 text-lg">
          Start Creating
        </Button>
        
        <button 
          onClick={() => setOnboarding(false)}
          className="mt-6 text-zinc-600 text-sm font-medium hover:text-zinc-400 transition-colors"
        >
          Skip for now
        </button>
      </motion.div>
    </div>
  );

  const TemplatesModal = () => (
    <AnimatePresence>
      {showTemplates && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[110] flex items-center justify-center p-8"
        >
          <div className="max-w-2xl w-full">
            <h2 className="text-2xl font-display italic text-white mb-8 text-center">Choose a Starting Base</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {TEMPLATES.map(t => (
                <button
                  key={t.id}
                  disabled={t.locked && !isTeenMode}
                  onClick={() => startWithTemplate(t)}
                  className={`bg-zinc-900 border border-zinc-800 p-6 rounded-3xl hover:border-purple-500 transition-all flex flex-col items-center gap-4 group relative ${t.locked && !isTeenMode ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  {t.locked && !isTeenMode && (
                    <div className="absolute top-3 right-3">
                      <ShieldCheck className="w-4 h-4 text-purple-500" />
                    </div>
                  )}
                  <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                    {t.icon}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="font-bold text-sm text-zinc-300">{t.name}</span>
                    <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                      {t.size}x{t.size} {t.locked && !isTeenMode ? '(Lvl 10)' : ''}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            <button 
              onClick={() => setShowTemplates(false)}
              className="mt-8 text-zinc-500 hover:text-white w-full text-center font-bold"
            >
              Back
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const CreateView = () => (
    <div className="flex-1 flex flex-col relative">
      {/* Top Bar */}
      <header className="h-16 border-b border-zinc-900 flex items-center justify-between px-6 bg-zinc-950/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button onClick={() => setOnboarding(true)} className="p-2 hover:bg-zinc-900 rounded-xl">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <input 
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent border-none focus:ring-0 text-white font-bold text-sm w-40"
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Auto-saving...</span>
          <Button 
            variant="ghost" 
            onClick={() => setShowTemplates(true)} 
            className="px-3 py-2 text-xs flex items-center gap-2 border border-zinc-800"
          >
            <Plus className="w-3 h-3" /> New
          </Button>
          <Button 
            variant="ghost" 
            onClick={downloadImage} 
            className="px-3 py-2 text-xs flex items-center gap-2 border border-zinc-800"
          >
            <Download className="w-3 h-3" /> Export
          </Button>
          {isTeenMode && (
            <Button 
              variant="secondary" 
              onClick={() => setShowPreviewModal(true)} 
              className="px-4 py-2 text-xs flex items-center gap-2"
            >
              <Play className="w-3 h-3" /> Preview
            </Button>
          )}
          <Button onClick={saveProject} className="px-4 py-2 text-xs">Save</Button>
        </div>
      </header>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0a0a0a] checkerboard overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentFrameIndex}
            initial={{ opacity: 0.8, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.1 }}
            className="relative shadow-2xl shadow-black/50 border-4 border-zinc-900 bg-zinc-950"
            style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease-out' }}
            onMouseDown={() => setIsMouseDown(true)}
            onMouseUp={() => setIsMouseDown(false)}
            onMouseLeave={() => setIsMouseDown(false)}
          >
            {/* Onion Skin Layer */}
            {onionSkinning && currentFrameIndex > 0 && (
              <div 
                className="grid pixel-grid absolute inset-0 pointer-events-none opacity-20 z-0"
                style={{ 
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                }}
              >
                {frames[currentFrameIndex - 1].pixels.map((color, i) => (
                  <div
                    key={`onion-${i}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}

            <div 
              className="grid pixel-grid relative z-10"
              style={{ 
                gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                width: 'min(70vh, 70vw)',
                aspectRatio: '1/1'
              }}
            >
              {frames[currentFrameIndex].pixels.map((color, i) => {
                const baseColor = frames[currentFrameIndex].basePixels?.[i];
                const displayColor = color !== 'transparent' ? color : baseColor || 'transparent';
                return (
                  <motion.div
                    key={i}
                    initial={false}
                    animate={{ 
                      backgroundColor: displayColor,
                      scale: isMouseDown && tool !== 'picker' ? 1.05 : 1
                    }}
                    whileHover={{ scale: 1.1, zIndex: 10, boxShadow: "0 0 15px rgba(168, 85, 247, 0.4)" }}
                    onMouseDown={() => handlePixelAction(i, true)}
                    onMouseEnter={() => isMouseDown && handlePixelAction(i)}
                    className="w-full h-full border-[0.1px] border-white/5 cursor-crosshair"
                  />
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Floating Tool Panel */}
        <div className="absolute right-4 top-4 bottom-4 flex flex-col gap-2 bg-zinc-900/80 backdrop-blur-xl p-2 rounded-3xl border border-zinc-800 shadow-2xl overflow-y-auto scrollbar-hide z-40 max-h-[calc(100%-2rem)]">
          <ToolButton active={tool === 'pencil'} onClick={() => setTool('pencil')} icon={<Pencil className="w-5 h-5" />} label="Pencil" />
          <ToolButton active={tool === 'fill'} onClick={() => setTool('fill')} icon={<PaintBucket className="w-5 h-5" />} label="Fill" />
          <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={<Eraser className="w-5 h-5" />} label="Eraser" />
          <ToolButton active={tool === 'picker'} onClick={() => setTool('picker')} icon={<Pipette className="w-5 h-5" />} label="Picker" />
          <div className="h-[1px] bg-zinc-800 mx-2 my-1" />
          <ToolButton active={false} onClick={undo} icon={<Undo2 className="w-5 h-5" />} label="Undo" />
          <ToolButton active={false} onClick={redo} icon={<Undo2 className="w-5 h-5 scale-x-[-1]" />} label="Redo" />
          <div className="h-[1px] bg-zinc-800 mx-2 my-1" />
          <ToolButton active={false} onClick={() => applyEffect('glow')} icon={<Sparkles className="w-5 h-5 text-yellow-500" />} label="Add Glow" />
          <ToolButton active={false} onClick={() => applyEffect('sparkle')} icon={<Star className="w-5 h-5 text-blue-400" />} label="Add Sparkles" />
          <ToolButton active={false} onClick={() => applyEffect('outline')} icon={<Square className="w-5 h-5 text-gray-400" />} label="Clean Outline" />
          <ToolButton active={false} onClick={() => applyEffect('remix')} icon={<Dices className="w-5 h-5 text-purple-400" />} label="Color Remix" />
          <div className="h-[1px] bg-zinc-800 mx-2 my-1" />
          <ToolButton active={false} onClick={clearCanvas} icon={<RotateCcw className="w-5 h-5" />} label="Clear Canvas" />
          <ToolButton active={mirrorMode} onClick={() => setMirrorMode(!mirrorMode)} icon={<Maximize2 className="w-5 h-5" />} label="Mirror" />
          <ToolButton active={showPreview} onClick={() => setShowPreview(!showPreview)} icon={<Monitor className="w-5 h-5" />} label="Preview" />
          
          {!isTeenMode && (
            <div className="relative group">
              <ToolButton active={false} onClick={() => {}} icon={<ShieldCheck className="w-5 h-5 text-zinc-700" />} label="Lvl 10 Required" />
              <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none w-48 shadow-2xl z-50">
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Teen Mode Locked</p>
                <p className="text-[9px] text-zinc-500 leading-relaxed">Reach Level 10 to unlock 64x64 canvas, Animation, and Shading brushes.</p>
              </div>
            </div>
          )}

          <div className="px-2 py-2 flex flex-col items-center gap-1 mt-auto">
            <input 
              type="range" min="0.5" max="3" step="0.1" value={zoom} 
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="h-16 [writing-mode:vertical-lr] accent-purple-500 cursor-pointer"
            />
            <span className="text-[7px] font-bold text-zinc-500">ZOOM</span>
          </div>
        </div>

        {/* Mini Preview Window */}
        <AnimatePresence>
          {showPreview && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="absolute left-4 top-4 w-32 h-32 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-40"
            >
              <div className="absolute top-1 left-2 text-[8px] font-bold text-zinc-500 uppercase tracking-widest z-10">Live Preview</div>
              <div 
                className="grid w-full h-full"
                style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
              >
                {frames[previewFrameIndex].pixels.map((color, i) => {
                  const baseColor = frames[previewFrameIndex].basePixels?.[i];
                  const displayColor = color !== 'transparent' ? color : baseColor || 'transparent';
                  return (
                    <div key={`preview-${i}`} style={{ backgroundColor: displayColor }} />
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Animation Bar (Teen Mode Only) */}
      {isTeenMode && (
        <div className="h-28 border-t border-zinc-900 bg-zinc-950 flex items-center px-6 gap-4 overflow-x-auto scrollbar-hide flex-shrink-0">
          <div className="flex flex-col gap-1 pr-4 border-r border-zinc-900">
          <div className="flex gap-2">
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-lg transition-all ${isPlaying ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button 
              onClick={() => setShowPreview(!showPreview)}
              className={`p-2 rounded-lg transition-all ${showPreview ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setOnionSkinning(!onionSkinning)}
              className={`p-2 rounded-lg transition-all ${onionSkinning ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
              title="Onion Skinning"
            >
              <Layers className="w-4 h-4" />
            </button>
            <div className="h-8 w-[1px] bg-zinc-900 mx-1" />
            <div className="flex gap-1 bg-zinc-900 p-1 rounded-lg items-center">
              <Wand2 className="w-3 h-3 text-purple-400 mx-1" />
              <button onClick={() => applyAnimationPreset('bounce')} className="px-2 py-1 text-[8px] font-bold text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-all">BOUNCE</button>
              <button onClick={() => applyAnimationPreset('float')} className="px-2 py-1 text-[8px] font-bold text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-all">FLOAT</button>
              <button onClick={() => applyAnimationPreset('blink')} className="px-2 py-1 text-[8px] font-bold text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-all">BLINK</button>
              <button onClick={() => applyAnimationPreset('pulse')} className="px-2 py-1 text-[8px] font-bold text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-all">PULSE</button>
              <button onClick={() => applyAnimationPreset('shake')} className="px-2 py-1 text-[8px] font-bold text-zinc-500 hover:text-white hover:bg-zinc-800 rounded transition-all">SHAKE</button>
            </div>
          </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] font-bold text-zinc-600">FPS</span>
              <input 
                type="range" min="1" max="24" value={fps} 
                onChange={(e) => setFps(parseInt(e.target.value))}
                className="w-16 h-1 accent-purple-500"
              />
              <span className="text-[8px] font-bold text-zinc-500 w-4">{fps}</span>
            </div>
          </div>

          <button 
            onClick={() => {
              const newFrame = { id: Math.random().toString(36).substr(2, 9), pixels: Array(gridSize * gridSize).fill('transparent') };
              setFrames([...frames, newFrame]);
              setCurrentFrameIndex(frames.length);
            }}
            className="flex-shrink-0 w-14 h-14 rounded-xl border-2 border-dashed border-zinc-800 flex items-center justify-center hover:border-zinc-600 transition-all"
          >
            <Plus className="w-6 h-6" />
          </button>
          
          <div className="flex gap-3">
            {frames.map((f, i) => (
              <div 
                key={f.id}
                className="flex flex-col gap-1 flex-shrink-0"
              >
                <div 
                  onClick={() => setCurrentFrameIndex(i)}
                  className={`w-14 h-14 rounded-xl border-2 overflow-hidden cursor-pointer transition-all relative group ${currentFrameIndex === i ? 'border-purple-500 scale-105' : 'border-zinc-900'}`}
                >
                  <div className="grid w-full h-full pixel-grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
                    {f.pixels.map((c, pi) => {
                      const baseColor = f.basePixels?.[pi];
                      const displayColor = c !== 'transparent' ? c : baseColor || 'transparent';
                      return (
                        <div key={pi} style={{ backgroundColor: displayColor }} />
                      );
                    })}
                  </div>
                  
                  {/* Frame Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                    {i > 0 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const newFrames = [...frames];
                          [newFrames[i-1], newFrames[i]] = [newFrames[i], newFrames[i-1]];
                          setFrames(newFrames);
                          setCurrentFrameIndex(i-1);
                        }}
                        className="p-1 hover:bg-white/20 rounded"
                      >
                        <ArrowLeft className="w-3 h-3 text-white" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        const newFrame = { ...f, id: Math.random().toString(36).substr(2, 9) };
                        const newFrames = [...frames];
                        newFrames.splice(i + 1, 0, newFrame);
                        setFrames(newFrames);
                        setCurrentFrameIndex(i + 1);
                      }}
                      className="p-1 hover:bg-white/20 rounded"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3 text-white" />
                    </button>
                    {i < frames.length - 1 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const newFrames = [...frames];
                          [newFrames[i], newFrames[i+1]] = [newFrames[i+1], newFrames[i]];
                          setFrames(newFrames);
                          setCurrentFrameIndex(i+1);
                        }}
                        className="p-1 hover:bg-white/20 rounded"
                      >
                        <ArrowRight className="w-3 h-3 text-white" />
                      </button>
                    )}
                    {frames.length > 1 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const newFrames = frames.filter((_, idx) => idx !== i);
                          setFrames(newFrames);
                          if (currentFrameIndex >= newFrames.length) setCurrentFrameIndex(newFrames.length - 1);
                        }}
                        className="p-1 hover:bg-red-500/40 rounded"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                  
                  {/* Duration Badge */}
                  <div className="absolute bottom-0 left-0 bg-black/80 px-1 rounded-tr-lg flex items-center gap-0.5 pointer-events-none">
                    <Clock className="w-2 h-2 text-zinc-400" />
                    <span className="text-[7px] font-bold text-white">{f.duration || 1}x</span>
                  </div>
                  
                  <span className="absolute bottom-0 right-0 bg-black/50 text-[6px] px-1 font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                
                {/* Duration Control */}
                <select 
                  value={f.duration || 1}
                  onChange={(e) => {
                    const newFrames = [...frames];
                    newFrames[i] = { ...f, duration: parseFloat(e.target.value) };
                    setFrames(newFrames);
                  }}
                  className="bg-zinc-900 text-[8px] font-bold text-zinc-500 uppercase tracking-widest rounded border border-zinc-800 outline-none focus:border-purple-500"
                >
                  <option value="0.5">0.5x</option>
                  <option value="1">1.0x</option>
                  <option value="2">2.0x</option>
                  <option value="3">3.0x</option>
                  <option value="4">4.0x</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Preview Window */}
      {showPreview && (
        <motion.div 
          drag
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute left-24 top-24 w-48 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden z-50"
        >
          <div className="p-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Live Preview</span>
            <button onClick={() => setShowPreview(false)} className="text-zinc-600 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="aspect-square bg-zinc-950 p-4 flex items-center justify-center checkerboard">
            <div className="grid w-full h-full pixel-grid" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
              {frames[previewFrameIndex].pixels.map((c, i) => (
                <div key={i} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <div className="p-2 flex justify-center gap-2 bg-zinc-950/50">
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white">
              {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            </button>
          </div>
        </motion.div>
      )}

      {/* Full Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[200] flex items-center justify-center p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-[40px] overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-display italic text-white">Animation Preview</h2>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                    {frames.length} Frames • {fps} FPS
                  </p>
                </div>
                <button 
                  onClick={() => setShowPreviewModal(false)}
                  className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="aspect-square max-h-[60vh] bg-zinc-950 flex items-center justify-center p-12 checkerboard relative">
                <div 
                  className="grid w-full h-full pixel-grid shadow-2xl" 
                  style={{ 
                    gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                    maxWidth: '400px'
                  }}
                >
                  {frames[previewFrameIndex].pixels.map((c, i) => (
                    <div key={i} style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>

              <div className="p-8 bg-zinc-950/50 flex flex-col gap-6">
                <div className="flex items-center justify-center gap-8">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-purple-500/20 hover:scale-110 transition-transform"
                  >
                    {isPlaying ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Playback Speed</span>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{fps} FPS</span>
                  </div>
                  <input 
                    type="range" min="1" max="24" value={fps} 
                    onChange={(e) => setFps(parseInt(e.target.value))}
                    className="w-full h-2 accent-purple-500 bg-zinc-800 rounded-full appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Palette */}
      <div className="h-32 border-t border-zinc-900 bg-zinc-950 flex flex-col flex-shrink-0">
        <div className="flex px-6 border-b border-zinc-900 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActivePaletteTab('current')}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activePaletteTab === 'current' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-zinc-500'}`}
          >
            My Palette
          </button>
          <button 
            onClick={() => setActivePaletteTab('saved')}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activePaletteTab === 'saved' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-zinc-500'}`}
          >
            Saved
          </button>
          <button 
            onClick={() => setActivePaletteTab('trending')}
            className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activePaletteTab === 'trending' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-zinc-500'}`}
          >
            Trending
          </button>
        </div>
        
        <div className="flex-1 flex items-center px-6 gap-4 overflow-x-auto scrollbar-hide">
          {activePaletteTab === 'current' ? (
            <>
              <button 
                onClick={remixColors}
                className="flex-shrink-0 flex flex-col items-center gap-1 p-2 hover:bg-zinc-900 rounded-xl transition-all group"
                title="Remix Colors"
              >
                <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center group-hover:border-purple-500 transition-all">
                  <Dices className="w-5 h-5 text-purple-400" />
                </div>
                <span className="text-[7px] font-bold text-zinc-600 uppercase">Remix</span>
              </button>
              <div className="h-8 w-[1px] bg-zinc-800 flex-shrink-0" />
              
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 relative group">
                  <div className="w-12 h-12 rounded-2xl border-2 border-zinc-800 overflow-hidden" style={{ backgroundColor: selectedColor }} />
                  <input type="color" value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
                <button 
                  onClick={() => addColorToPalette(selectedColor)}
                  className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:border-purple-500 transition-all"
                  title="Add to Palette"
                >
                  <Plus className="w-4 h-4 text-zinc-400" />
                </button>
              </div>

              <div className="h-8 w-[1px] bg-zinc-800 flex-shrink-0" />
              
              <div className="flex gap-2">
                {palette.map((c, i) => (
                  <div key={i} className="relative group flex-shrink-0">
                    <button
                      onClick={() => setSelectedColor(c)}
                      className={`w-10 h-10 rounded-xl border-2 transition-all ${
                        selectedColor === c ? 'border-purple-500 scale-110' : 'border-zinc-900 hover:border-zinc-700'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeColorFromPalette(c);
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2 h-2" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="h-8 w-[1px] bg-zinc-800 flex-shrink-0" />
              
              <div className="flex items-center gap-3">
                <input 
                  type="text" 
                  placeholder="Palette Name" 
                  value={paletteName}
                  onChange={(e) => setPaletteName(e.target.value)}
                  className="w-24 bg-zinc-900 border border-zinc-800 rounded px-2 py-1 text-[8px] font-bold text-zinc-400 outline-none focus:border-purple-500"
                />
                <button 
                  onClick={saveCurrentPalette}
                  className="flex flex-col items-center gap-1 group"
                >
                  <div className="w-10 h-10 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center group-hover:border-purple-500 transition-all">
                    <Save className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-[7px] font-bold text-zinc-600 uppercase">Save</span>
                </button>
              </div>

              <div className="h-8 w-[1px] bg-zinc-800 flex-shrink-0" />
              
              {/* Smart Shading */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Smart Shades</span>
                <div className="flex items-center gap-1">
                  {generateShades(selectedColor).map((c, i) => (
                    <button
                      key={`shade-${i}`}
                      onClick={() => setSelectedColor(c)}
                      className={`w-8 h-8 rounded-lg border-2 transition-all ${selectedColor === c ? 'border-white scale-110' : 'border-zinc-900 hover:border-zinc-700'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </>
          ) : activePaletteTab === 'saved' ? (
            <div className="flex gap-6">
              {savedPalettes.length === 0 ? (
                <div className="flex items-center gap-2 text-zinc-600 italic text-[10px]">
                  <Palette className="w-4 h-4" />
                  No saved palettes yet.
                </div>
              ) : (
                savedPalettes.map((sp, i) => (
                  <div key={i} className="flex flex-col gap-2 group relative">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest truncate max-w-[60px]">{sp.name}</span>
                      <button 
                        onClick={() => deleteSavedPalette(i)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded transition-all"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                    <button 
                      onClick={() => {
                        setPalette(sp.colors);
                        setActivePaletteTab('current');
                      }}
                      className="flex gap-0.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800 hover:border-purple-500 transition-all"
                    >
                      {sp.colors.map((c, ci) => (
                        <div key={ci} className="w-4 h-8 rounded-sm" style={{ backgroundColor: c }} />
                      ))}
                    </button>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="flex gap-8">
              {TRENDING_PALETTES.map(tp => (
                <div key={tp.name} className="flex flex-col gap-2">
                  <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{tp.name}</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setPalette(tp.colors);
                        setActivePaletteTab('current');
                      }}
                      className="flex gap-0.5 bg-zinc-900 p-1 rounded-lg border border-zinc-800 hover:border-purple-500 transition-all"
                    >
                      {tp.colors.map((c, i) => (
                        <div key={i} className="w-4 h-8 rounded-sm" style={{ backgroundColor: c }} />
                      ))}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const ClosetView = () => {
    const categories = ['avatar', 'item', 'room'];
    const [selectedCategory, setSelectedCategory] = useState('avatar');
    const filteredProjects = projects.filter(p => p.category === selectedCategory);

    return (
      <div className="flex-1 flex flex-col p-8 overflow-y-auto scrollbar-hide">
        {/* Bento Header */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Stats Tile */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-[32px] p-8 flex flex-col justify-between relative overflow-hidden group"
          >
            <div className="relative z-10">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Creator Status</span>
              <h2 className="text-4xl font-display italic text-white mt-2 mb-6">Level {stats?.level || 1}</h2>
              <div className="flex gap-8">
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">XP Points</p>
                  <p className="text-xl font-mono text-white">{stats?.xp || 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Creations</p>
                  <p className="text-xl font-mono text-white">{projects.length}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Badges</p>
                  <p className="text-xl font-mono text-white">{stats?.badges_count || 0}</p>
                </div>
              </div>
            </div>
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-purple-600/10 to-transparent pointer-events-none" />
            <motion.div
              animate={{ 
                y: [0, -10, 0],
                rotate: [12, 15, 12]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-8 -bottom-8"
            >
              <Crown className="w-48 h-48 text-white/5 group-hover:text-white/10 transition-all" />
            </motion.div>
          </motion.div>

          {/* Quick Action Tile */}
          <motion.div 
            whileHover={{ y: -5 }}
            onClick={() => setShowTemplates(true)}
            className="bg-purple-600 rounded-[32px] p-8 flex flex-col items-center justify-center text-center cursor-pointer group relative overflow-hidden"
          >
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-all">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">New Project</h3>
            <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold">Start from Template</p>
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/5 transition-all" />
          </motion.div>
        </div>

        {/* Challenge Tile */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-1 bg-zinc-900 border border-zinc-800 rounded-[32px] p-6 flex flex-col justify-between"
          >
            <div>
              <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest">Daily Streak</span>
              <div className="flex items-center gap-2 mt-2">
                <Zap className="w-6 h-6 text-orange-500 fill-current" />
                <span className="text-3xl font-display italic text-white">5 Days</span>
              </div>
            </div>
            <p className="text-[10px] text-zinc-500 mt-4">Keep creating to maintain your streak!</p>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-3 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[32px] p-8 flex items-center justify-between relative overflow-hidden group"
          >
            <div className="relative z-10">
              <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Active Challenge</span>
              <h3 className="text-3xl font-display italic text-white mt-2 mb-4">Cyber Sneaker Drop</h3>
              <Button 
                variant="secondary" 
                onClick={() => setActiveTab('challenges')}
                className="px-6 py-2 text-xs"
              >
                Enter Now
              </Button>
            </div>
            <Target className="absolute -right-8 -bottom-8 w-48 h-48 text-white/10 -rotate-12 group-hover:scale-110 transition-all" />
          </motion.div>
        </div>

        {/* Project Section */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display italic text-white">Your Creations</h2>
          <div className="flex gap-2 bg-zinc-900 p-1 rounded-2xl border border-zinc-800">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  selectedCategory === cat ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {cat}s
              </button>
            ))}
          </div>
        </div>

        {filteredProjects.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-900 rounded-[32px] p-12">
            <Shirt className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-bold uppercase tracking-widest text-xs">No {selectedCategory}s yet</p>
            <Button onClick={() => setShowTemplates(true)} variant="ghost" className="mt-4 text-[10px]">Create Something</Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProjects.map((p, idx) => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ y: -5 }}
                className="bg-zinc-900 border border-zinc-800 rounded-[32px] overflow-hidden group cursor-pointer"
                onClick={() => {
                  setProjectName(p.name);
                  setGridSize(p.grid_size);
                  setPalette(p.palette);
                  setFrames(p.frames);
                  setCurrentFrameIndex(0);
                  setActiveTab('create');
                }}
              >
                <div className="aspect-square bg-zinc-950 p-4 flex items-center justify-center checkerboard group-hover:scale-105 transition-all">
                  <div className="grid w-full h-full pixel-grid" style={{ gridTemplateColumns: `repeat(${p.grid_size}, 1fr)` }}>
                    {p.frames[0].pixels.map((c, i) => (
                      <div key={i} style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div className="p-4 border-t border-zinc-800 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-white uppercase tracking-widest truncate w-32">{p.name}</p>
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest mt-0.5">{p.grid_size}x{p.grid_size}</p>
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                    <ChevronRight className="w-3 h-3 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const ChallengesView = () => (
    <div className="flex-1 flex flex-col p-8 overflow-y-auto">
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-[32px] p-8 mb-12 relative overflow-hidden">
        <div className="relative z-10">
          <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Daily Prompt</span>
          <h2 className="text-4xl font-display italic text-white mt-2 mb-4">Design a Cyber Sneaker</h2>
          <p className="text-white/80 text-sm max-w-md mb-8">Use neon colors and sharp lines to create the ultimate futuristic kick. Winner gets the "Neon Pulse" badge!</p>
          <Button variant="neon" onClick={() => {
            const pixels = getTemplatePixels('sneaker', 32);
            setProjectName('Cyber Sneaker');
            setGridSize(32);
            setFrames([{ id: Math.random().toString(36).substr(2, 9), pixels }]);
            setActiveTab('create');
            saveToHistory(pixels);
          }}>Start Challenge</Button>
        </div>
        <Zap className="absolute -right-8 -bottom-8 w-64 h-64 text-white/5 rotate-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl">
          <h4 className="text-sm font-bold text-white mb-2">Upcoming Prompts</h4>
          <ul className="space-y-3">
            <li className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Tomorrow</span>
              <span className="font-bold text-zinc-200">Ghost Pet</span>
            </li>
            <li className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Wednesday</span>
              <span className="font-bold text-zinc-200">Fall Hoodie</span>
            </li>
            <li className="flex items-center justify-between text-xs">
              <span className="text-zinc-400">Thursday</span>
              <span className="font-bold text-zinc-200">Pixel Plant</span>
            </li>
          </ul>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl flex flex-col items-center justify-center text-center">
          <Trophy className="w-8 h-8 text-yellow-500 mb-2" />
          <h4 className="text-sm font-bold text-white mb-1">Your Rank</h4>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Top 15% this week</p>
        </div>
      </div>

      <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-6">Featured Creations</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {submissions.map((sub, idx) => (
          <motion.div 
            key={sub.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden group"
          >
            <div className="aspect-square bg-zinc-950 flex items-center justify-center p-4">
              <img src={sub.thumbnail} className="w-full h-full pixel-grid" referrerPolicy="no-referrer" />
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="flex gap-2">
                <Reaction icon={<Flame className="w-3 h-3" />} count={sub.fire} />
                <Reaction icon={<Star className="w-3 h-3" />} count={sub.sparkle} />
              </div>
              <div className="flex gap-2">
                <Reaction icon={<Gem className="w-3 h-3" />} count={sub.diamond} />
                <Reaction icon={<Crown className="w-3 h-3" />} count={sub.crown} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const ProfileView = () => (
    <div className="flex-1 flex flex-col items-center p-8 overflow-y-auto">
      <div className="w-32 h-32 bg-zinc-900 rounded-[40px] flex items-center justify-center mb-6 relative group">
        <motion.div 
          animate={{ y: [0, -10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-24 h-24 bg-purple-500 rounded-3xl flex items-center justify-center"
        >
          <User className="w-12 h-12 text-white" />
        </motion.div>
        <div className="absolute -bottom-2 bg-zinc-950 px-4 py-1 rounded-full border border-zinc-800 shadow-xl">
          <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">LVL {stats?.level || 1}</span>
        </div>
      </div>

      <h2 className="text-2xl font-display italic text-white mb-2 tracking-tight">Pixel Creator</h2>
      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-8">Member since 2025</p>

      <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-[32px] p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">XP Progress</span>
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">{stats?.xp || 0} / {stats?.level ? stats.level * 1000 : 1000}</span>
        </div>
        <div className="h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${((stats?.xp || 0) / (stats?.level ? stats.level * 1000 : 1000)) * 100}%` }}
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-600"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-12">
        <StatItem delay={0.1} icon={<Shirt className="w-4 h-4" />} label="Creations" value={stats?.creations_count || 0} />
        <StatItem delay={0.2} icon={<Target className="w-4 h-4" />} label="Challenges" value={stats?.challenges_entered || 0} />
        <StatItem delay={0.3} icon={<Trophy className="w-4 h-4" />} label="Badges" value={stats?.badges_count || 0} />
      </div>

      <div className="w-full max-w-md">
        <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-4 px-2">Settings & Safety</h3>
        <div className="space-y-2">
          <button className="w-full flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800 hover:bg-zinc-800 transition-all">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-sm font-bold text-zinc-300">Parental Controls</span>
            </div>
            <Settings className="w-4 h-4 text-zinc-600" />
          </button>
          <button className="w-full flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800 hover:bg-zinc-800 transition-all">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-bold text-zinc-300">App Theme</span>
            </div>
            <Settings className="w-4 h-4 text-zinc-600" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0a] text-zinc-300 selection:bg-purple-500/30">
      {onboarding && activeTab === 'create' && <OnboardingView />}
      <TemplatesModal />
      
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {activeTab === 'create' && <CreateView />}
            {activeTab === 'closet' && <ClosetView />}
            {activeTab === 'challenges' && <ChallengesView />}
            {activeTab === 'profile' && <ProfileView />}
          </motion.div>
        </AnimatePresence>
        
        {loading && (
          <div className="absolute inset-0 bg-zinc-950/50 backdrop-blur-sm flex flex-col items-center justify-center z-[100]">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mb-4"
            />
            <button 
              onClick={() => setLoading(false)}
              className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest hover:text-zinc-400 transition-colors"
            >
              Skip Loading
            </button>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="h-16 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-xl flex items-center px-4 gap-2 flex-shrink-0">
        <TabButton active={activeTab === 'create'} onClick={() => setActiveTab('create')} icon={<PlusCircle className="w-5 h-5" />} label="Create" />
        <TabButton active={activeTab === 'closet'} onClick={() => setActiveTab('closet')} icon={<Shirt className="w-5 h-5" />} label="Closet" />
        <TabButton active={activeTab === 'challenges'} onClick={() => setActiveTab('challenges')} icon={<Target className="w-5 h-5" />} label="Challenges" />
        <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User className="w-5 h-5" />} label="Profile" />
      </nav>
    </div>
  );
}

// --- Helper Components ---

function ToolButton({ active, onClick, icon, label }: any) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`p-3 rounded-2xl transition-all relative group ${
        active 
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
          : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
      }`}
    >
      {icon}
      <span className="absolute left-full ml-4 px-3 py-1 bg-zinc-800 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 font-bold uppercase tracking-widest border border-zinc-700">
        {label}
      </span>
    </motion.button>
  );
}

function Reaction({ icon, count }: any) {
  return (
    <div className="flex items-center gap-1 bg-zinc-800/50 px-2 py-1 rounded-lg">
      {icon}
      <span className="text-[10px] font-bold text-zinc-500">{count}</span>
    </div>
  );
}

function StatItem({ icon, label, value, delay = 0 }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay }}
      className="flex flex-col items-center gap-1 bg-zinc-900/50 border border-zinc-800 p-3 rounded-2xl flex-1 min-w-0"
    >
      <div className="w-6 h-6 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500">
        {React.cloneElement(icon as React.ReactElement, { className: 'w-3 h-3' })}
      </div>
      <div className="flex flex-col items-center overflow-hidden w-full">
        <span className="text-lg font-bold text-white truncate w-full text-center">{value}</span>
        <span className="text-[7px] font-bold text-zinc-600 uppercase tracking-widest truncate w-full text-center">{label}</span>
      </div>
    </motion.div>
  );
}
