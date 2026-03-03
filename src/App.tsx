import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Clock,
  Volume2,
  VolumeX,
  Grid,
  Coins,
  PiggyBank,
  Map,
  Gamepad2,
  PlugZap,
  ShoppingBag,
  Wallet,
  BadgeDollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { PixelSpriteAudio } from './PixelSpriteAudio';
import { initAnalytics, trackEvent } from './analytics';
import { TEMPLATE_DEFINITIONS, buildColorableMask, getTemplateLockMask, getTemplatePixels, TemplateCategory, TemplateDefinition } from './templateData';
import { Frame, Project, ProjectData, UserStats, Challenge, Submission } from './types';
import { PixelCanvas, PixelCanvasHandle } from './PixelCanvas';

// --- Constants & Assets ---

const STARTER_PALETTE = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff',
  '#ff8800', '#88ff00', '#00ff88', '#0088ff', '#8800ff', '#ff0088', '#888888', '#444444',
  '#ffcccc', '#ccffcc', '#ccccff', '#ffffcc', '#ffccff', '#ccffff', '#884400', '#442200'
];

type TemplateCard = TemplateDefinition & { icon: React.ReactNode };
const templateIconByCategory: Record<string, React.ReactNode> = {
  blank: <PlusCircle className="w-6 h-6" />,
  cat: <Sparkles className="w-6 h-6" />,
  dog: <Sparkles className="w-6 h-6" />,
  ghost: <Sparkles className="w-6 h-6" />,
  dragon: <Crown className="w-6 h-6" />,
  character: <User className="w-6 h-6" />,
  alien: <Zap className="w-6 h-6" />,
  sneaker: <Target className="w-6 h-6" />,
  sneaker_base: <Target className="w-6 h-6" />,
  skate_deck: <Layout className="w-6 h-6" />,
  hoodie: <Shirt className="w-6 h-6" />,
  bag: <ShoppingBag className="w-6 h-6" />,
  cap: <ShieldCheck className="w-6 h-6" />,
  sword: <Wand2 className="w-6 h-6" />,
  shield: <ShieldCheck className="w-6 h-6" />,
  badge: <BadgeDollarSign className="w-6 h-6" />,
  cozy_room: <Layout className="w-6 h-6" />,
  space_scene: <Sparkles className="w-6 h-6" />,
  mini_forest: <Sparkles className="w-6 h-6" />,
  city_night: <Monitor className="w-6 h-6" />,
  kawaii_bunny: <Palette className="w-6 h-6" />,
  pixel_heart: <Flame className="w-6 h-6" />,
  lucky_star: <Star className="w-6 h-6" />,
  pro: <Crown className="w-6 h-6" />,
};

const TEMPLATES: TemplateCard[] = TEMPLATE_DEFINITIONS.map(template => ({
  ...template,
  icon: templateIconByCategory[template.id] ?? <Palette className="w-6 h-6" />,
}));

const TEMPLATE_SECTION_ORDER: TemplateCategory[] = ['characters', 'items', 'scenes', 'color-in', 'blank'];

const TEMPLATE_SECTION_META: Record<TemplateCategory, { label: string; hint: string }> = {
  characters: { label: 'Characters & Pets', hint: 'Expressive silhouettes with strong readability at small sizes.' },
  items: { label: 'Items & Gear', hint: 'Material-aware sprites with cleaner collectible polish.' },
  scenes: { label: 'Scenes', hint: 'Mini environments with layered depth and atmosphere.' },
  'color-in': { label: 'Color-In Templates', hint: 'Lock + fill starters with completion rewards.' },
  blank: { label: 'Blank Canvases', hint: 'Start fresh with a transparent sheet.' },
};

const TRENDING_PALETTES = [
  { name: 'Y2K', colors: ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0088', '#8800FF'] },
  { name: 'Soft Girl', colors: ['#FFB6C1', '#FFD1DC', '#FFF0F5', '#E6E6FA', '#F0F8FF'] },
  { name: 'Street Mode', colors: ['#1A1A1A', '#FF4400', '#00FF00', '#FFFFFF', '#888888'] },
];

const COLOR_PACKS: Array<{ name: string; theme: string; colors: string[] }> = [
  {
    name: 'Pixel Pop',
    theme: 'Modern Arcade',
    colors: ['#3B82F6', '#FF5A5F', '#2DD4BF', '#1F2937', '#F3F4F6'],
  },
  {
    name: 'Soft Retro Candy',
    theme: 'Nostalgic Pixel',
    colors: ['#FF6EC7', '#6EC1FF', '#FFD84D', '#B39DDB', '#121212'],
  },
  {
    name: 'Calm Creative',
    theme: 'Strategic + Serene',
    colors: ['#4C6FFF', '#4FD1C5', '#F6E7D8', '#7C3AED', '#2D3748'],
  },
  {
    name: 'Playful Builder',
    theme: 'Energetic + Organized',
    colors: ['#FF7A00', '#00C2C7', '#7B61FF', '#A3E635', '#111827'],
  },
  {
    name: 'Kawaii Kind',
    theme: 'Sweet + Soft',
    colors: ['#FFB3D9', '#FFC9DE', '#FFE29A', '#A7F3D0', '#C7D2FE', '#FFFFFF'],
  },
  {
    name: "Mariah's Birthday",
    theme: 'Purple Sparkle',
    colors: ['#6D28D9', '#8B5CF6', '#A78BFA', '#C4B5FD', '#E9D5FF', '#F5F3FF', '#FDE68A'],
  },
  {
    name: 'Soft Gradients',
    theme: 'Background Flow',
    colors: ['#4C6FFF', '#6EC1FF', '#7B61FF', '#B39DDB', '#2DD4BF', '#4FD1C5'],
  },
];

const STUDIO_STATE_KEY = 'pixel-creator-studio-state-v1';
const MAX_STUDIO_FEED_ENTRIES = 8;

type IconComponent = React.ComponentType<{ className?: string }>;

type AnimationPreset = 'bounce' | 'blink' | 'float' | 'pulse' | 'shake' | 'walk_cat' | 'spin_star' | 'bounce_ball' | 'pixel_fire' | 'neon_heart' | 'walk_cycle' | 'y2k_glitter';

const ANIMATION_PRESET_OPTIONS: Array<{ key: AnimationPreset; label: string }> = [
  { key: 'bounce', label: 'BOUNCE' },
  { key: 'float', label: 'FLOAT' },
  { key: 'blink', label: 'BLINK' },
  { key: 'pulse', label: 'PULSE' },
  { key: 'shake', label: 'SHAKE' },
  { key: 'walk_cat', label: 'CAT' },
  { key: 'spin_star', label: 'STAR' },
  { key: 'bounce_ball', label: 'BALL' },
  { key: 'pixel_fire', label: 'FIRE' },
  { key: 'neon_heart', label: 'HEART' },
  { key: 'walk_cycle', label: 'WALK' },
  { key: 'y2k_glitter', label: 'GLITTER' },
];

const STUDIO_DESTINATIONS: Array<{
  id: string;
  title: string;
  description: string;
  gradient: string;
  icon: IconComponent;
  badge: string;
  tasks: string[];
}> = [
  {
    id: 'creator-hq',
    title: 'Creator HQ',
    description: 'Pin your favorite loops, sync drafts, and earn XP streak boosts.',
    gradient: 'from-purple-600 to-indigo-600',
    icon: Sparkles,
    badge: 'Live Sync',
    tasks: ['Drop a new frame pack', 'Share one animation to the feed'],
  },
  {
    id: 'motion-lab',
    title: 'Motion Lab',
    description: 'Preset sandbox for testing tween stacks and physics trails.',
    gradient: 'from-blue-600 to-cyan-500',
    icon: Gamepad2,
    badge: 'Beta',
    tasks: ['Queue bounce + float combo', 'Record a reference pass'],
  },
  {
    id: 'template-market',
    title: 'Template Market',
    description: 'Browse studio-made bases and remix them into your own drops.',
    gradient: 'from-rose-500 to-orange-500',
    icon: ShoppingBag,
    badge: '15 new',
    tasks: ['Unlock a 64x64 pro base', 'Publish a remix set'],
  },
  {
    id: 'sound-forge',
    title: 'Sound Forge',
    description: 'Pair bloom SFX and gamified cues with each animation beat.',
    gradient: 'from-emerald-500 to-lime-500',
    icon: PlugZap,
    badge: 'Audio',
    tasks: ['Author a new draw sound', 'Level-up your motion alerts'],
  },
];

const PLUGIN_LIBRARY: Array<{
  id: string;
  name: string;
  description: string;
  costCoins: number;
  costGems: number;
  icon: IconComponent;
  badge: string;
  boost: string;
}> = [
  {
    id: 'layer-mixer',
    name: 'Layer Mixer',
    description: 'Blend template base pixels with live strokes per-frame.',
    costCoins: 420,
    costGems: 4,
    icon: Layers,
    badge: 'Stack',
    boost: '+20% layering speed',
  },
  {
    id: 'ai-muse',
    name: 'Muse Sparks',
    description: 'Procedurally suggests palettes + shading for current scene.',
    costCoins: 680,
    costGems: 6,
    icon: Sparkles,
    badge: 'Assist',
    boost: '+15 inspiration',
  },
  {
    id: 'mirror-pro',
    name: 'Mirror Pro',
    description: 'Advanced symmetry modes with radial + diagonal mirrors.',
    costCoins: 520,
    costGems: 3,
    icon: Maximize2,
    badge: 'Precision',
    boost: 'New radial brush paths',
  },
  {
    id: 'path-fx',
    name: 'Path FX',
    description: 'Apply motion trails and easing stacks to onion skin previews.',
    costCoins: 760,
    costGems: 8,
    icon: PlugZap,
    badge: 'Motion',
    boost: 'Preset motion trails',
  },
];

const DAILY_STUDIO_TASKS: Array<{
  id: string;
  label: string;
  rewardCoins: number;
  rewardGems: number;
}> = [
  { id: 'share-loop', label: 'Export one animation loop', rewardCoins: 150, rewardGems: 0 },
  { id: 'unlock-template', label: 'Start with a new template base', rewardCoins: 120, rewardGems: 1 },
  { id: 'earn-xp', label: 'Gain 50 XP today', rewardCoins: 200, rewardGems: 2 },
];

type StudioTask = (typeof DAILY_STUDIO_TASKS)[number] & { claimed: boolean };

const MAX_FRAMES = 40;
const BIRTHDAY_SPLASH_END_AT = new Date('2026-03-10T23:59:59');
const MIN_CANVAS_ZOOM = 0.5;
const MAX_CANVAS_ZOOM = 6;

const normalizeToHexColor = (color: string): string | null => {
  if (!color || color === 'transparent') return null;
  if (/^#[0-9a-fA-F]{6}$/.test(color)) return color;
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
  }
  const rgbaMatch = color.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i);
  if (!rgbaMatch) return null;
  const toHex = (value: number) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, '0');
  const r = Number(rgbaMatch[1]);
  const g = Number(rgbaMatch[2]);
  const b = Number(rgbaMatch[3]);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

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
  type ExportFormat = 'png' | 'gif' | 'sprite-sheet' | 'jpeg' | 'print' | 'palette';
  type HistoryEntry = { frameIndex: number; pixels: string[] };

  // Navigation & UI State
  const [activeTab, setActiveTab] = useState<'create' | 'studio' | 'closet' | 'challenges' | 'profile'>('create');
  const [onboarding, setOnboarding] = useState(true);
  const [showBirthdaySplash, setShowBirthdaySplash] = useState(() => new Date() <= BIRTHDAY_SPLASH_END_AT);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  // Editor State
  const [gridSize, setGridSize] = useState(32);
  const [frames, setFrames] = useState<Frame[]>([{ id: '1', pixels: Array(32 * 32).fill('transparent') }]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState('#ffffff');
  const [palette, setPalette] = useState<string[]>(STARTER_PALETTE);
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'fill' | 'picker' | 'select'>('pencil');
  const [projectName, setProjectName] = useState('New Identity');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [mirrorMode, setMirrorMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [fps, setFps] = useState(8);
  const [showPreview, setShowPreview] = useState(true); // Default to true for the mini-preview
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showAnimationTools, setShowAnimationTools] = useState(false);
  const [showNudgePanel, setShowNudgePanel] = useState(false);
  const [selection, setSelection] = useState<{ active: boolean; x0: number; y0: number; x1: number; y1: number } | null>(null);
  const [previewFrameIndex, setPreviewFrameIndex] = useState(0);
  const [onionSkinning, setOnionSkinning] = useState(false);
  const [showShades, setShowShades] = useState(true);
  const [showMobileQuickColor, setShowMobileQuickColor] = useState(false);
  const [activePaletteTab, setActivePaletteTab] = useState<'current' | 'saved' | 'trending' | 'packs'>('current');
  const [savedPalettes, setSavedPalettes] = useState<{name: string, colors: string[]}[]>(TRENDING_PALETTES);
  const [paletteName, setPaletteName] = useState('My New Palette');
  const [frameNotice, setFrameNotice] = useState<string | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [brushSize, setBrushSize] = useState<1 | 2 | 4>(1);
  const [eraserSize, setEraserSize] = useState<1 | 3 | 6>(3);
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [lockMask, setLockMask] = useState<Uint8Array | null>(null);
  const [colorableMask, setColorableMask] = useState<Uint8Array | null>(null);
  const [templateCompletionAwarded, setTemplateCompletionAwarded] = useState(false);
  const [goldFlash, setGoldFlash] = useState(false);
  const [coins, setCoins] = useState(1250);
  const [gems, setGems] = useState(18);
  const [ownedPlugins, setOwnedPlugins] = useState<string[]>(['layer-mixer']);
  const [studioFeed, setStudioFeed] = useState<string[]>(['Studio synced • Ready to explore.']);
  const [xpEarnedToday, setXpEarnedToday] = useState(0);
  const [lastTaskDate, setLastTaskDate] = useState<string | null>(null);
  const [dailyTasks, setDailyTasks] = useState<StudioTask[]>(() => DAILY_STUDIO_TASKS.map(task => ({ ...task, claimed: false })));
  const [studioNotice, setStudioNotice] = useState<string | null>(null);

  // Sound System
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [softMode, setSoftMode] = useState(false);
  const audioEngineRef = useRef<PixelSpriteAudio | null>(null);
  const pixelCanvasRef = useRef<PixelCanvasHandle | null>(null);
  const frameNoticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const studioNoticeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const achievementTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTrackedCanvasStartedRef = useRef(false);
  const historyIndexRef = useRef(-1);
  const framesRef = useRef<Frame[]>(frames);
  const strokeDraftRef = useRef<string[] | null>(null);
  const strokeFrameIndexRef = useRef<number | null>(null);
  const paintRafRef = useRef<number | null>(null);

  const flushDraftToState = useCallback(() => {
    if (!strokeDraftRef.current || strokeFrameIndexRef.current === null) return;
    const draft = [...strokeDraftRef.current];
    const targetFrameIndex = strokeFrameIndexRef.current;
    setFrames(prev => {
      if (!prev[targetFrameIndex]) return prev;
      const next = [...prev];
      next[targetFrameIndex] = { ...next[targetFrameIndex], pixels: draft };
      return next;
    });
    paintRafRef.current = null;
  }, []);

  const resetStrokeDraft = useCallback(() => {
    if (paintRafRef.current !== null) {
      cancelAnimationFrame(paintRafRef.current);
      paintRafRef.current = null;
    }
    strokeDraftRef.current = null;
    strokeFrameIndexRef.current = null;
  }, []);

  useEffect(() => {
    framesRef.current = frames;
  }, [frames]);

  useEffect(() => {
    historyIndexRef.current = historyIndex;
  }, [historyIndex]);

  useEffect(() => {
    return () => {
      if (paintRafRef.current !== null) {
        cancelAnimationFrame(paintRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    resetStrokeDraft();
  }, [currentFrameIndex, resetStrokeDraft]);

  useEffect(() => {
    audioEngineRef.current = new PixelSpriteAudio();
  }, []);

  useEffect(() => {
    if (!initAnalytics()) return;
    trackEvent('app_opened', {
      canvas_size: gridSize,
    });
  }, []);

  useEffect(() => {
    if (!showBirthdaySplash) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        setShowBirthdaySplash(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showBirthdaySplash]);

  useEffect(() => {
    audioEngineRef.current?.setEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    audioEngineRef.current?.setSoftMode(softMode);
  }, [softMode]);

  const playDrawSound = () => audioEngineRef.current?.click();
  const playEraseSound = () => audioEngineRef.current?.click();
  const playSelectSound = () => audioEngineRef.current?.click();
  const playNudgeSound = () => audioEngineRef.current?.click();
  const playSaveSound = () => audioEngineRef.current?.saveSuccess();
  const playAchievementSound = () => audioEngineRef.current?.exportComplete();
  const playAddLayerSound = () => audioEngineRef.current?.addLayer();
  const playErrorSound = () => audioEngineRef.current?.error();

  const toggleSound = () => {
    const engine = audioEngineRef.current;
    if (!engine) {
      setSoundEnabled(prev => !prev);
      return;
    }

    if (soundEnabled) {
      engine.toggleOff();
      setTimeout(() => {
        engine.setEnabled(false);
        setSoundEnabled(false);
      }, 90);
      return;
    }

    engine.setEnabled(true);
    setSoundEnabled(true);
    engine.toggleOn();
  };

  const toggleSoftMode = () => {
    setSoftMode(prev => {
      const next = !prev;
      audioEngineRef.current?.setSoftMode(next);
      return next;
    });
    audioEngineRef.current?.click();
  };

  const handleZoomChange = useCallback((nextZoom: number) => {
    if (!Number.isFinite(nextZoom)) return;
    const clamped = Math.max(MIN_CANVAS_ZOOM, Math.min(MAX_CANVAS_ZOOM, nextZoom));
    setZoom(Math.round(clamped * 100) / 100);
  }, []);

  const showFrameNotice = (message: string) => {
    if (frameNoticeTimeout.current) {
      clearTimeout(frameNoticeTimeout.current);
    }
    setFrameNotice(message);
    frameNoticeTimeout.current = setTimeout(() => {
      setFrameNotice(null);
      frameNoticeTimeout.current = null;
    }, 2400);
  };

  const showStudioNotice = (message: string) => {
    if (studioNoticeTimeout.current) {
      clearTimeout(studioNoticeTimeout.current);
    }
    setStudioNotice(message);
    studioNoticeTimeout.current = setTimeout(() => {
      setStudioNotice(null);
      studioNoticeTimeout.current = null;
    }, 2400);
  };

  const addStudioFeedEntry = (entry: string) => {
    setStudioFeed(prev => [entry, ...prev].slice(0, MAX_STUDIO_FEED_ENTRIES));
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex >= 0 && historyIndex < history.length - 1;

  const handleTravel = (destinationId: string) => {
    const destination = STUDIO_DESTINATIONS.find(dest => dest.id === destinationId);
    if (!destination) return;
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    addStudioFeedEntry(`${destination.title} synced • ${timestamp}`);
    showStudioNotice(`Now exploring ${destination.title}`);
    playSelectSound();
  };

  const handlePurchasePlugin = (pluginId: string) => {
    const plugin = PLUGIN_LIBRARY.find(item => item.id === pluginId);
    if (!plugin) return;
    if (ownedPlugins.includes(pluginId)) {
      showStudioNotice(`${plugin.name} already installed`);
      return;
    }
    if (coins < plugin.costCoins || gems < plugin.costGems) {
      showStudioNotice('Need more coins or gems');
      return;
    }
    setCoins(prev => prev - plugin.costCoins);
    setGems(prev => prev - plugin.costGems);
    setOwnedPlugins(prev => [...prev, pluginId]);
    addStudioFeedEntry(`${plugin.name} installed • ${plugin.boost}`);
    showStudioNotice(`${plugin.name} unlocked`);
    playAchievementSound();
  };

  const applyTaskReward = (task: StudioTask, contextMessage?: string) => {
    setCoins(prev => prev + task.rewardCoins);
    setGems(prev => prev + task.rewardGems);
    const rewardParts = [`+${task.rewardCoins} coins`];
    if (task.rewardGems) {
      rewardParts.push(`+${task.rewardGems} gems`);
    }
    const rewardSummary = rewardParts.join(' ');
    const feedSummary = `${task.label} • ${rewardSummary}${contextMessage ? ` • ${contextMessage}` : ''}`;
    addStudioFeedEntry(feedSummary);
    showStudioNotice(`${task.label} complete • ${rewardSummary}`);
    playAchievementSound();
  };

  const completeStudioTask = (taskId: string, contextMessage?: string) => {
    let rewardTask: StudioTask | null = null;
    setDailyTasks(prev => {
      const existing = prev.find(item => item.id === taskId);
      if (!existing || existing.claimed) return prev;
      rewardTask = existing;
      return prev.map(item => item.id === taskId ? { ...item, claimed: true } : item);
    });
    if (rewardTask) {
      applyTaskReward(rewardTask, contextMessage);
      return true;
    }
    return false;
  };

  const handleClaimTask = (taskId: string) => {
    if (!completeStudioTask(taskId)) {
      showStudioNotice('Task already claimed');
    }
  };

  const travelToStudio = (destinationId: string) => {
    setActiveTab('studio');
    setTimeout(() => handleTravel(destinationId), 0);
  };
  // Gamification System
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [lastActivityDate, setLastActivityDate] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [currentAchievement, setCurrentAchievement] = useState<string | null>(null);

  const xpToLevel = (xp: number) => Math.floor(xp / 100) + 1;
  const xpForNextLevel = (level: number) => level * 100;

  const dismissAchievementModal = useCallback(() => {
    if (achievementTimeout.current) {
      clearTimeout(achievementTimeout.current);
      achievementTimeout.current = null;
    }
    setShowAchievementModal(false);
    setCurrentAchievement(null);
  }, []);

  const addXp = (amount: number, reason: string) => {
    const newXp = xp + amount;
    const newLevel = xpToLevel(newXp);
    
    setXp(newXp);
    if (newLevel > level) {
      setLevel(newLevel);
      if (reason !== 'achievement') {
        unlockAchievement(`Reached Level ${newLevel}!`);
      }
    }

    // Check for achievement unlocks
    if (reason !== 'achievement') {
      checkAchievements(reason, amount);
    }
  };

  const checkAchievements = (action: string, amount: number) => {
    const newAchievements: string[] = [];

    if (action === 'draw' && amount >= 10) {
      if (!achievements.includes('First Strokes')) {
        newAchievements.push('First Strokes');
      }
    }
    if (action === 'save' && !achievements.includes('Pixel Saver')) {
      newAchievements.push('Pixel Saver');
    }
    if (action === 'animation' && !achievements.includes('Animator')) {
      newAchievements.push('Animator');
    }
    if (frames.length >= 5 && !achievements.includes('Frame Master')) {
      newAchievements.push('Frame Master');
    }
    if (streak >= 7 && !achievements.includes('Week Warrior')) {
      newAchievements.push('Week Warrior');
    }

    newAchievements.forEach(achievement => {
      unlockAchievement(achievement);
    });
  };

  const unlockAchievement = (achievement: string) => {
    if (!achievements.includes(achievement)) {
      setAchievements(prev => [...prev, achievement]);
      setCurrentAchievement(achievement);
      setShowAchievementModal(true);
      playAchievementSound();
      addXp(50, 'achievement');

      if (achievementTimeout.current) {
        clearTimeout(achievementTimeout.current);
      }
      achievementTimeout.current = setTimeout(() => {
        dismissAchievementModal();
      }, 3000);
    }
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    if (lastActivityDate !== today) {
      if (lastActivityDate === new Date(Date.now() - 86400000).toDateString()) {
        setStreak(prev => prev + 1);
        if (streak + 1 >= 7) {
          unlockAchievement('Week Warrior');
        }
      } else {
        setStreak(1);
      }
      setLastActivityDate(today);
    }
  };

  // Data State
  const [stats, setStats] = useState<UserStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Effects
  useEffect(() => {
    return () => {
      if (frameNoticeTimeout.current) {
        clearTimeout(frameNoticeTimeout.current);
      }
      if (studioNoticeTimeout.current) {
        clearTimeout(studioNoticeTimeout.current);
      }
      if (achievementTimeout.current) {
        clearTimeout(achievementTimeout.current);
      }
    };
  }, []);

  useEffect(() => {
    if (activeTab !== 'studio' && studioNotice) {
      if (studioNoticeTimeout.current) {
        clearTimeout(studioNoticeTimeout.current);
        studioNoticeTimeout.current = null;
      }
      setStudioNotice(null);
    }
  }, [activeTab]);
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
    // restore studio economy from localStorage
    useEffect(() => {
      if (typeof window === 'undefined') return;
      try {
        const stored = localStorage.getItem(STUDIO_STATE_KEY);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (typeof parsed.coins === 'number') setCoins(parsed.coins);
        if (typeof parsed.gems === 'number') setGems(parsed.gems);
        if (Array.isArray(parsed.ownedPlugins)) setOwnedPlugins(parsed.ownedPlugins);
        if (Array.isArray(parsed.studioFeed) && parsed.studioFeed.length > 0) {
          setStudioFeed(parsed.studioFeed.slice(0, MAX_STUDIO_FEED_ENTRIES));
        }
        if (Array.isArray(parsed.dailyTasks)) {
          setDailyTasks(DAILY_STUDIO_TASKS.map(task => {
            const saved = parsed.dailyTasks.find((item: any) => item.id === task.id);
            return { ...task, claimed: Boolean(saved?.claimed) };
          }));
        }
        if (typeof parsed.xpEarnedToday === 'number') {
          setXpEarnedToday(parsed.xpEarnedToday);
        }
        if (typeof parsed.lastTaskDate === 'string') {
          setLastTaskDate(parsed.lastTaskDate);
        }
      } catch (error) {
        console.warn('Failed to load studio state', error);
      }
    }, []);

    // persist studio economy
    useEffect(() => {
      if (typeof window === 'undefined') return;
      const payload = {
        coins,
        gems,
        ownedPlugins,
        studioFeed,
        dailyTasks: dailyTasks.map(task => ({ id: task.id, claimed: task.claimed })),
        xpEarnedToday,
        lastTaskDate,
      };
      try {
        localStorage.setItem(STUDIO_STATE_KEY, JSON.stringify(payload));
      } catch (error) {
        console.warn('Failed to persist studio state', error);
      }
    }, [coins, gems, ownedPlugins, studioFeed, dailyTasks, xpEarnedToday, lastTaskDate]);

    // daily reset for tasks/xp
    useEffect(() => {
      const today = new Date().toDateString();
      if (lastTaskDate !== today) {
        setLastTaskDate(today);
        setXpEarnedToday(0);
        setDailyTasks(prev => prev.map(task => ({ ...task, claimed: false })));
      }
    }, [lastTaskDate]);

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

  useEffect(() => {
    if (!goldFlash) return;
    const timeout = setTimeout(() => setGoldFlash(false), 450);
    return () => clearTimeout(timeout);
  }, [goldFlash]);

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

  const saveToHistory = (pixels: string[], frameIndex: number = currentFrameIndex) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndexRef.current + 1);
      const nextEntry: HistoryEntry = { frameIndex, pixels: [...pixels] };
      const lastEntry = trimmed[trimmed.length - 1];
      if (lastEntry && lastEntry.frameIndex === nextEntry.frameIndex && lastEntry.pixels.join('|') === nextEntry.pixels.join('|')) {
        const idx = trimmed.length - 1;
        historyIndexRef.current = idx;
        setHistoryIndex(idx);
        return trimmed;
      }
      const appended = [...trimmed, nextEntry];
      if (appended.length > 50) {
        appended.shift();
      }
      const idx = appended.length - 1;
      historyIndexRef.current = idx;
      setHistoryIndex(idx);
      return appended;
    });
  };

  const undo = () => {
    if (!canUndo) return;
    const prevEntry = history[historyIndex - 1];
    if (!prevEntry) return;
    setFrames(prev => {
      if (!prev[prevEntry.frameIndex]) return prev;
      const next = [...prev];
      next[prevEntry.frameIndex] = { ...next[prevEntry.frameIndex], pixels: [...prevEntry.pixels] };
      return next;
    });
    setCurrentFrameIndex(prevEntry.frameIndex);
    setPreviewFrameIndex(prevEntry.frameIndex);
    setHistoryIndex(historyIndex - 1);
  };

  const redo = () => {
    if (!canRedo) return;
    const nextEntry = history[historyIndex + 1];
    if (!nextEntry) return;
    setFrames(prev => {
      if (!prev[nextEntry.frameIndex]) return prev;
      const next = [...prev];
      next[nextEntry.frameIndex] = { ...next[nextEntry.frameIndex], pixels: [...nextEntry.pixels] };
      return next;
    });
    setCurrentFrameIndex(nextEntry.frameIndex);
    setPreviewFrameIndex(nextEntry.frameIndex);
    setHistoryIndex(historyIndex + 1);
  };

  useEffect(() => {
    if (history.length > 0) return;
    const frame = frames[currentFrameIndex];
    if (!frame) return;
    saveToHistory(frame.pixels, currentFrameIndex);
  }, [frames, currentFrameIndex, history.length]);

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
      } else {
        // Selection controls
        if (selection?.active) {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            nudgeSelection(0, -1);
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            nudgeSelection(0, 1);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            nudgeSelection(-1, 0);
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nudgeSelection(1, 0);
          }
        }
        
        // Tool shortcuts
        if (e.key === 's' && !e.ctrlKey) {
          e.preventDefault();
          setTool('select');
        } else if (e.key === 'b') {
          e.preventDefault();
          setTool('pencil');
        } else if (e.key === 'e') {
          e.preventDefault();
          setTool('eraser');
        } else if (e.key === 'f') {
          e.preventDefault();
          setTool('fill');
        } else if (e.key === 'i') {
          e.preventDefault();
          setTool('picker');
        } else if (e.key === 'Escape') {
          e.preventDefault();
          clearSelection();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
}, [undo, redo, selection?.active]);

  const updateFrame = (pixels: string[]) => {
    const newFrames = [...frames];
    newFrames[currentFrameIndex] = { ...newFrames[currentFrameIndex], pixels };
    setFrames(newFrames);
  };

  const isLockedPixel = useCallback((x: number, y: number) => {
    if (!lockMask) return false;
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) return false;
    return lockMask[y * gridSize + x] === 1;
  }, [gridSize, lockMask]);

  const checkTemplateCompletion = useCallback((pixels: string[]) => {
    if (!colorableMask || templateCompletionAwarded) return;
    let totalColorable = 0;
    let emptyColorable = 0;

    for (let i = 0; i < colorableMask.length; i++) {
      if (colorableMask[i] === 0) continue;
      totalColorable++;
      if (pixels[i] === 'transparent') {
        emptyColorable++;
      }
    }

    if (totalColorable === 0) return;
    const emptyRatio = emptyColorable / totalColorable;
    if (emptyRatio >= 0.05) return;

    setTemplateCompletionAwarded(true);
    setGoldFlash(true);
    setCoins(prev => prev + 25);
    addXp(25, 'template-complete');
    addStudioFeedEntry('Color-in complete • +25 XP • +25 coins');
    showFrameNotice('Template complete! +25 XP +25 coins');
    confetti({
      particleCount: 180,
      spread: 70,
      origin: { y: 0.55 },
      colors: ['#FFD76A', '#F7B733', '#FFF2B2', '#E5A100'],
    });
  }, [addXp, addStudioFeedEntry, colorableMask, showFrameNotice, templateCompletionAwarded]);

  const handlePixelChange = useCallback((x: number, y: number, color: string) => {
    if (isLockedPixel(x, y)) return null;
    const idx = y * gridSize + x;
    const normalized = color === 'transparent' ? 'transparent' : color;

    if (!strokeDraftRef.current || strokeFrameIndexRef.current !== currentFrameIndex) {
      const sourceFrame = framesRef.current[currentFrameIndex];
      if (!sourceFrame) return null;
      strokeDraftRef.current = [...sourceFrame.pixels];
      strokeFrameIndexRef.current = currentFrameIndex;
    }

    const draft = strokeDraftRef.current;
    if (!draft) return null;
    if (draft[idx] === normalized) return draft;

    draft[idx] = normalized;

    if (paintRafRef.current === null) {
      paintRafRef.current = requestAnimationFrame(() => {
        flushDraftToState();
      });
    }

    return draft;
  }, [currentFrameIndex, gridSize, isLockedPixel, flushDraftToState]);

  const handleStrokeComplete = (pixels: string[] | null, action: 'draw' | 'erase' | 'fill') => {
    if (strokeDraftRef.current && strokeFrameIndexRef.current === currentFrameIndex) {
      flushDraftToState();
    }
    if (!pixels) {
      resetStrokeDraft();
      return;
    }

    if (!hasTrackedCanvasStartedRef.current) {
      hasTrackedCanvasStartedRef.current = true;
      trackEvent('canvas_started', {
        event_category: 'engagement',
      });
    }

    saveToHistory(pixels);
    updateStreak();
    if (action === 'draw') {
      playDrawSound();
      addXp(1, 'draw');
    } else if (action === 'erase') {
      playEraseSound();
      addXp(1, 'erase');
    } else {
      playDrawSound();
      addXp(2, 'fill');
    }
    checkTemplateCompletion(pixels);
    resetStrokeDraft();
  };

  const handleColorPick = (color: string) => {
    const normalized = normalizeToHexColor(color);
    if (normalized) {
      setSelectedColor(normalized);
    }
    setTool('pencil');
    playSelectSound();
  };

  const handleSelectionChange = useCallback((sel: { active: boolean; x0: number; y0: number; x1: number; y1: number } | null) => {
    setSelection(sel);
    setShowNudgePanel(Boolean(sel?.active));
  }, []);

  const createBlankFrame = (): Frame => ({
    id: Math.random().toString(36).substr(2, 9),
    pixels: Array(gridSize * gridSize).fill('transparent'),
    duration: 1,
  });

  const handleAddFrame = () => {
    if (frames.length >= MAX_FRAMES) {
      showFrameNotice(`Frame limit reached (${MAX_FRAMES})`);
      playErrorSound();
      return;
    }
    const newFrame = createBlankFrame();
    setFrames([...frames, newFrame]);
    setCurrentFrameIndex(frames.length);
    setPreviewFrameIndex(frames.length);
    playAddLayerSound();
  };

  const handleDuplicateFrame = (index: number) => {
    if (frames.length >= MAX_FRAMES) {
      showFrameNotice(`Frame limit reached (${MAX_FRAMES})`);
      playErrorSound();
      return;
    }
    const source = frames[index];
    const duplicated: Frame = {
      ...source,
      id: Math.random().toString(36).substr(2, 9),
      pixels: [...source.pixels],
      basePixels: source.basePixels ? [...source.basePixels] : undefined,
    };
    const newFrames = [...frames];
    newFrames.splice(index + 1, 0, duplicated);
    setFrames(newFrames);
    setCurrentFrameIndex(index + 1);
    setPreviewFrameIndex(index + 1);
    playAddLayerSound();
  };

  const handleDeleteFrame = (index: number) => {
    if (frames.length <= 1) {
      showFrameNotice('At least one frame is required');
      playErrorSound();
      return;
    }
    const newFrames = frames.filter((_, idx) => idx !== index);
    setFrames(newFrames);
    setCurrentFrameIndex((prev) => {
      if (prev > index) return prev - 1;
      if (prev === index) return Math.max(0, index - 1);
      return prev;
    });
    setPreviewFrameIndex((prev) => Math.min(prev, newFrames.length - 1));
  };

  const handlePlaybackToggle = () => {
    if (frames.length <= 1) {
      setIsPlaying(false);
      setPreviewFrameIndex(currentFrameIndex);
      showFrameNotice('Add at least 2 frames to animate');
      playErrorSound();
      return;
    }
    setShowPreview(true);
    const nextIsPlaying = !isPlaying;
    setIsPlaying(nextIsPlaying);
    trackEvent(nextIsPlaying ? 'animation_played' : 'animation_paused', {
      frame_count: frames.length,
      fps,
    });
  };

  const handleFpsChange = (value: number) => {
    if (!Number.isFinite(value)) return;
    const clamped = Math.max(1, Math.min(24, Math.round(value)));
    setFps(clamped);
  };

  const moveFrame = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    if (toIndex < 0 || toIndex >= frames.length) return;

    const reordered = [...frames];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setFrames(reordered);

    setCurrentFrameIndex(prev => {
      if (prev === fromIndex) return toIndex;
      if (fromIndex < toIndex && prev > fromIndex && prev <= toIndex) return prev - 1;
      if (fromIndex > toIndex && prev >= toIndex && prev < fromIndex) return prev + 1;
      return prev;
    });

    setPreviewFrameIndex(prev => {
      if (prev === fromIndex) return toIndex;
      if (fromIndex < toIndex && prev > fromIndex && prev <= toIndex) return prev - 1;
      if (fromIndex > toIndex && prev >= toIndex && prev < fromIndex) return prev + 1;
      return prev;
    });
  };

  const nudgeSelection = (dx: number, dy: number) => {
    if (!selection?.active) return;
    playNudgeSound();
    pixelCanvasRef.current?.nudgeSelection(dx, dy);
  };

  const clearSelection = () => {
    pixelCanvasRef.current?.clearSelection();
    setSelection(null);
    setShowNudgePanel(false);
  };

  const clearCanvas = () => {
    const blankPixels = Array(gridSize * gridSize).fill('transparent');
    setFrames(prev => {
      const next = [...prev];
      const frame = next[currentFrameIndex];
      if (!frame) return prev;
      next[currentFrameIndex] = { ...frame, pixels: blankPixels };
      return next;
    });
    saveToHistory(blankPixels);
    pixelCanvasRef.current?.clearSelection();
    setSelection(null);
    setShowNudgePanel(false);
    playEraseSound();
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

  const applyAnimationPreset = (preset: AnimationPreset) => {
    const currentFrame = frames[currentFrameIndex];
    const basePixels = [...currentFrame.pixels];
    const baseBasePixels = currentFrame.basePixels ? [...currentFrame.basePixels] : undefined;
    let newFrames: Frame[] = [];

    const hexToRgba = (hex: string, alpha: number) => {
      const clean = hex.replace('#', '');
      const r = parseInt(clean.slice(0, 2), 16);
      const g = parseInt(clean.slice(2, 4), 16);
      const b = parseInt(clean.slice(4, 6), 16);
      return `rgba(${r},${g},${b},${alpha})`;
    };

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

    // Advanced Animation Templates from pixel-creator-2.html
    if (preset === 'walk_cat') {
      // Walking cat animation - 4 frames
      for (let f = 0; f < 4; f++) {
        const o = Math.floor((gridSize - 22) / 2);
        const bob = [0, 1, 0, -1][f];
        const tailSwing = [-2, -1, 2, 1][f];
        const pixels = Array(gridSize * gridSize).fill('transparent');

        // Draw cat frame by frame
        const drawPixel = (x: number, y: number, color: string) => {
          if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            pixels[y * gridSize + x] = color;
          }
        };

        // Ears
        [[4, 0, '#C06020'], [5, 0, '#FF9A50'], [6, 0, '#C06020'], [12, 0, '#C06020'], [13, 0, '#FF9A50'], [14, 0, '#C06020']].forEach(([x, y, c]: [number, number, string]) => {
          drawPixel(o + (+x), o + (+y) + (+bob), c);
        });
        [[5, 1, '#FF9A50'], [13, 1, '#FF9A50']].forEach(([x, y, c]: [number, number, string]) => {
          drawPixel(o + (+x), o + (+y) + (+bob), c);
        });

        // Head
        for (let y = 1; y <= 7; y++) {
          for (let x = 4; x <= 14; x++) {
            const color = (x <= 5 || x >= 13) ? '#C06020' : (y <= 2) ? '#FFCC80' : '#FF9A50';
            drawPixel(o + (+x), o + (+y) + (+bob), color);
          }
        }

        // Face
        [[6, 3, '#111'], [6, 4, '#1a88FF'], [7, 3, '#99BBFF'], [11, 3, '#111'], [11, 4, '#1a88FF'], [12, 3, '#99BBFF']].forEach(([x, y, c]: [number, number, string]) => {
          drawPixel(o + (+x), o + (+y) + (+bob), c);
        });
        [[9, 6, '#FF6090'], [9, 7, '#FF4070']].forEach(([x, y, c]: [number, number, string]) => {
          drawPixel(o + (+x), o + (+y) + (+bob), c);
        });

        // Body
        for (let y = 8; y <= 17; y++) {
          for (let x = 4; x <= 14; x++) {
            const color = (x <= 5 || x >= 13) ? '#C06020' : (y >= 15) ? '#C06020' : '#FF9A50';
            drawPixel(o + (+x), o + y, color);
          }
        }

        // Chest stripe
        drawPixel(o + 6, o + 9, '#FFAA60');
        drawPixel(o + 6, o + 10, '#FFAA60');
        drawPixel(o + 7, o + 10, '#FFAA60');

        // Legs
        const poseA = [[4, 18, 4], [5, 18, 3], [12, 18, 3], [13, 18, 4]];
        const poseB = [[4, 18, 3], [5, 18, 4], [12, 18, 4], [13, 18, 3]];
        const legs = f % 2 === 0 ? poseA : poseB;
        legs.forEach(([x, fy, by]) => {
          drawPixel(o + x, o + fy, '#C06020');
          drawPixel(o + x, o + fy + 1, '#C06020');
          drawPixel(o + x, o + fy + 2, '#FF9A50');
        });

        // Tail
        const ty = [[-1, 0], [-2, 0], [-2, -1], [-1, -1]][f];
        [[14 + ty[0], 13, '#FF9A50'], [15 + ty[0], 12, '#FF9A50'], [16, 11 + ty[1], '#FFAA60'], [17, 10 + ty[1], '#C06020']].forEach(([x, y, c]) => {
          if (x < gridSize) drawPixel(o + (+x), o + (+y), c as string);
        });

        newFrames.push(createFrame(pixels));
      }
    }

    if (preset === 'spin_star') {
      // Spinning star animation - 8 frames
      for (let f = 0; f < 8; f++) {
        const cx = Math.floor(gridSize / 2);
        const cy = Math.floor(gridSize / 2);
        const R = Math.floor(gridSize * 0.4);
        const r = Math.floor(gridSize * 0.16);
        const rot = f * Math.PI / 4;
        const pixels = Array(gridSize * gridSize).fill('transparent');

        const drawPixel = (x: number, y: number, color: string) => {
          if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            pixels[y * gridSize + x] = color;
          }
        };

        // Draw star pixel by pixel
        for (let y = 0; y < gridSize; y++) {
          for (let x = 0; x < gridSize; x++) {
            const dx = x - cx;
            const dy = y - cy;
            const angle = Math.atan2(dy, dx) - rot;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > R + 1) continue;

            const a = ((angle + Math.PI * 2) % (Math.PI * 2 / 5)) - (Math.PI / 5);
            const starR = r + (R - r) * Math.cos(Math.PI / 5) / Math.cos(a);
            if (dist <= starR) {
              const shade = dist < r * 0.6 ? '#FFFAAA' : dist < R * 0.4 ? '#FFE840' : dist < R * 0.7 ? '#FFD166' : '#EEB840';
              drawPixel(x, y, shade);
            }
          }
        }

        // Center glow
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            if (dx * dx + dy * dy <= 5) {
              drawPixel(cx + dx, cy + dy, 'rgba(255,255,200,0.8)');
            }
          }
        }

        // Trailing twinkles
        for (let i = 0; i < 5; i++) {
          const a = rot + i * (Math.PI * 2 / 5) + Math.PI / 10;
          const tx = Math.round(cx + R * 1.2 * Math.cos(a));
          const ty = Math.round(cy + R * 1.2 * Math.sin(a));
          if (tx >= 0 && tx < gridSize && ty >= 0 && ty < gridSize) {
            drawPixel(tx, ty, '#FFF');
          }
        }

        newFrames.push(createFrame(pixels));
      }
    }

    if (preset === 'bounce_ball') {
      // Bouncing ball animation - 6 frames
      const phases = [0, 1, 2, 3, 2, 1];
      for (let fi = 0; fi < 6; fi++) {
        const ph = phases[fi];
        const y0 = Math.floor(gridSize * 0.1);
        const y3 = Math.floor(gridSize * 0.68);
        const cy = Math.round(y0 + (y3 - y0) * (ph / 3));
        const squashX = ph === 3 ? 1.35 : ph === 0 ? 0.88 : 1;
        const squashY = ph === 3 ? 0.70 : ph === 0 ? 1.18 : 1;
        const rBase = Math.floor(gridSize * 0.18);
        const rw = Math.round(rBase * squashX);
        const rh = Math.round(rBase * squashY);
        const pixels = Array(gridSize * gridSize).fill('transparent');

        const drawPixel = (x: number, y: number, color: string) => {
          if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            pixels[y * gridSize + x] = color;
          }
        };

        // Ball body
        for (let dy = -rh; dy <= rh; dy++) {
          for (let dx = -rw; dx <= rw; dx++) {
            if ((dx / rw) ** 2 + (dy / rh) ** 2 > 1) continue;
            const d = Math.sqrt((dx / rw) ** 2 + (dy / rh) ** 2);
            const color = d < 0.3 ? '#FF9090' : d < 0.65 ? '#FF6B6B' : '#CC3333';
            drawPixel(Math.floor(gridSize / 2) + dx, cy + dy, color);
          }
        }

        // Shine
        const shx = Math.floor(gridSize / 2) - Math.floor(rw * 0.3);
        const shy = cy - Math.floor(rh * 0.35);
        for (let dy = -2; dy <= 1; dy++) {
          for (let dx = -3; dx <= 2; dx++) {
            if (dx * dx / 9 + dy * dy / 4 <= 1) {
              drawPixel(shx + dx, shy + dy, 'rgba(255,255,255,0.7)');
            }
          }
        }

        // Seam lines
        for (let dx = -rw; dx <= rw; dx++) {
          const seamy = cy + Math.round(rh * 0.2 * Math.sin(dx * Math.PI / rw));
          if (seamy >= cy - rh && seamy <= cy + rh) {
            drawPixel(Math.floor(gridSize / 2) + dx, seamy, 'rgba(150,30,30,0.4)');
          }
        }

        // Motion blur
        if (ph === 1 || ph === 2) {
          for (let i = 1; i <= 3; i++) {
            drawPixel(Math.floor(gridSize / 2) - 2, cy - rh - i, 'rgba(255,107,107,0.15)');
            drawPixel(Math.floor(gridSize / 2) - 1, cy - rh - i, 'rgba(255,107,107,0.15)');
            drawPixel(Math.floor(gridSize / 2), cy - rh - i, 'rgba(255,107,107,0.15)');
            drawPixel(Math.floor(gridSize / 2) + 1, cy - rh - i, 'rgba(255,107,107,0.15)');
            drawPixel(Math.floor(gridSize / 2) + 2, cy - rh - i, 'rgba(255,107,107,0.15)');
          }
        }

        newFrames.push(createFrame(pixels));
      }
    }

    if (preset === 'pixel_fire') {
      // Pixel fire animation - 4 frames
      for (let f = 0; f < 4; f++) {
        const pixels = Array(gridSize * gridSize).fill('transparent');
        const cx = Math.floor(gridSize / 2);
        const by = Math.floor(gridSize * 0.75);

        const drawPixel = (x: number, y: number, color: string) => {
          if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            pixels[y * gridSize + x] = color;
          }
        };

        // Base flame
        for (let y = by - 8; y <= by; y++) {
          for (let x = cx - 3; x <= cx + 3; x++) {
            const dx = x - cx;
            const dy = y - by;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 4) continue;

            const flicker = Math.sin(f * Math.PI / 2 + dx * 0.5 + dy * 0.3) * 0.3;
            const height = 1 - (dy + 8) / 8 + flicker;
            if (height > 0) {
              const color = height > 0.8 ? '#FFF' : height > 0.6 ? '#FFA500' : height > 0.4 ? '#FF6600' : '#FF3300';
              drawPixel(x, y, color);
            }
          }
        }

        // Sparks
        for (let i = 0; i < 8; i++) {
          const sx = cx + Math.sin(f * Math.PI / 2 + i) * 2;
          const sy = by - 6 + Math.cos(f * Math.PI / 2 + i) * 1.5;
          const sparkX = Math.round(sx);
          const sparkY = Math.round(sy);
          if (sparkX >= 0 && sparkX < gridSize && sparkY >= 0 && sparkY < gridSize) {
            drawPixel(sparkX, sparkY, '#FFFF00');
          }
        }

        // Embers
        for (let i = 0; i < 5; i++) {
          const ex = cx + (i - 2) * 1.5;
          const ey = by - 2 + Math.sin(f + i) * 0.5;
          const emberX = Math.round(ex);
          const emberY = Math.round(ey);
          if (emberX >= 0 && emberX < gridSize && emberY >= 0 && emberY < gridSize) {
            drawPixel(emberX, emberY, '#FFAA00');
          }
        }

        newFrames.push(createFrame(pixels));
      }
    }

    if (preset === 'neon_heart') {
      // Neon heart animation - 4 frames
      for (let f = 0; f < 4; f++) {
        const pixels = Array(gridSize * gridSize).fill('transparent');
        const cx = Math.floor(gridSize / 2);
        const cy = Math.floor(gridSize / 2);

        const drawPixel = (x: number, y: number, color: string) => {
          if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            pixels[y * gridSize + x] = color;
          }
        };

        // Heart shape
        for (let y = -8; y <= 8; y++) {
          for (let x = -8; x <= 8; x++) {
            const inHeart = Math.abs(x) + Math.abs(y) <= 6 || (x * x + y * y <= 25 && Math.abs(x) <= 5);
            if (inHeart) {
              const pulse = Math.sin(f * Math.PI / 2) * 0.3 + 0.7;
              const color = pulse > 0.9 ? '#FF00FF' : pulse > 0.7 ? '#FF66FF' : '#CC00CC';
              drawPixel(cx + x, cy + y, color);
            }
          }
        }

        // Glow effect
        for (let y = -10; y <= 10; y++) {
          for (let x = -10; x <= 10; x++) {
            const dist = Math.sqrt(x * x + y * y);
            if (dist > 6 && dist <= 9) {
              const alpha = (9 - dist) / 3;
              drawPixel(cx + x, cy + y, `rgba(255,0,255,${alpha * 0.3})`);
            }
          }
        }

        // Pulsing outline
        const outline = [
          [-6, -2], [-5, -3], [-4, -4], [-3, -5], [-2, -6], [2, -6], [3, -5], [4, -4], [5, -3], [6, -2],
          [6, 0], [5, 2], [4, 4], [3, 5], [2, 6], [-2, 6], [-3, 5], [-4, 4], [-5, 2], [-6, 0]
        ];
        outline.forEach(([x, y]) => {
          const pulse = Math.sin(f * Math.PI / 2 + x * 0.1 + y * 0.1) * 0.5 + 0.5;
          const color = pulse > 0.7 ? '#FFFFFF' : '#FFAAFF';
          drawPixel(cx + x, cy + y, color);
        });

        newFrames.push(createFrame(pixels));
      }
    }

    if (preset === 'walk_cycle') {
      // Walk cycle animation - 4 frames
      for (let f = 0; f < 4; f++) {
        const pixels = Array(gridSize * gridSize).fill('transparent');
        const cx = Math.floor(gridSize / 2);
        const by = Math.floor(gridSize * 0.7);

        const drawPixel = (x: number, y: number, color: string) => {
          if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            pixels[y * gridSize + x] = color;
          }
        };

        // Body
        for (let y = by - 8; y <= by - 2; y++) {
          for (let x = cx - 2; x <= cx + 2; x++) {
            drawPixel(x, y, '#8B4513');
          }
        }

        // Head
        for (let y = by - 12; y <= by - 9; y++) {
          for (let x = cx - 2; x <= cx + 2; x++) {
            drawPixel(x, y, '#DEB887');
          }
        }

        // Eyes
        drawPixel(cx - 1, by - 11, '#000');
        drawPixel(cx + 1, by - 11, '#000');

        // Arms
        const armSwing = Math.sin(f * Math.PI / 2) * 2;
        drawPixel(cx - 3, by - 6 + armSwing, '#8B4513');
        drawPixel(cx + 3, by - 6 - armSwing, '#8B4513');

        // Legs
        const legPhase = f % 2;
        const leftLegY = by + (legPhase === 0 ? 0 : 2);
        const rightLegY = by + (legPhase === 0 ? 2 : 0);

        // Left leg
        for (let y = by; y <= leftLegY; y++) {
          drawPixel(cx - 1, y, '#000080');
        }

        // Right leg
        for (let y = by; y <= rightLegY; y++) {
          drawPixel(cx + 1, y, '#000080');
        }

        // Shoes
        drawPixel(cx - 1, leftLegY + 1, '#000');
        drawPixel(cx + 1, rightLegY + 1, '#000');

        newFrames.push(createFrame(pixels));
      }
    }

    if (preset === 'y2k_glitter') {
      // Y2K glitter animation - 4 frames
      for (let f = 0; f < 4; f++) {
        const pixels = Array(gridSize * gridSize).fill('transparent');

        const drawPixel = (x: number, y: number, color: string) => {
          if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
            pixels[y * gridSize + x] = color;
          }
        };

        // Glitter particles
        const colors = ['#FF00FF', '#00FFFF', '#FFFF00', '#FF0080', '#8000FF', '#00FF80'];
        for (let i = 0; i < 20; i++) {
          const x = Math.floor((Math.sin(f * Math.PI / 2 + i * 0.5) + 1) * gridSize / 2);
          const y = Math.floor((Math.cos(f * Math.PI / 2 + i * 0.7) + 1) * gridSize / 2);
          const color = colors[i % colors.length];
          const sparkle = Math.sin(f * Math.PI / 2 + i) > 0.5;
          if (sparkle) {
            drawPixel(x, y, color);
            // Add sparkle effect
            if (x + 1 < gridSize) drawPixel(x + 1, y, 'rgba(255,255,255,0.8)');
            if (y + 1 < gridSize) drawPixel(x, y + 1, 'rgba(255,255,255,0.8)');
          }
        }

        // Central burst
        const cx = Math.floor(gridSize / 2);
        const cy = Math.floor(gridSize / 2);
        for (let r = 1; r <= 3; r++) {
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
            const x = Math.round(cx + r * Math.cos(a + f * Math.PI / 2));
            const y = Math.round(cy + r * Math.sin(a + f * Math.PI / 2));
            const color = colors[Math.floor(a / (Math.PI / 3)) % colors.length];
            drawPixel(x, y, color);
          }
        }

        // Rainbow trail
        for (let i = 0; i < 8; i++) {
          const angle = f * Math.PI / 2 + i * Math.PI / 4;
          const x = Math.round(cx + 6 * Math.cos(angle));
          const y = Math.round(cy + 6 * Math.sin(angle));
          const color = colors[i % colors.length];
          drawPixel(x, y, hexToRgba(color, 0.6));
        }

        newFrames.push(createFrame(pixels));
      }
    }

    if (newFrames.length === 0) {
      showFrameNotice('Preset unavailable right now');
      playErrorSound();
      setShowAnimationTools(false);
      return;
    }

    setFrames(newFrames);
    setCurrentFrameIndex(0);
    setPreviewFrameIndex(0);
    setShowPreview(true);
    setIsPlaying(newFrames.length > 1);
    setShowAnimationTools(false);
    addXp(5, 'animation');
    updateStreak();
    trackEvent('animation_preset_applied', {
      preset,
      frame_count: newFrames.length,
      canvas_size: gridSize,
    });
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
    const normalized = normalizeToHexColor(color);
    if (!normalized) return;
    if (!palette.includes(normalized)) {
      setPalette([...palette, normalized]);
    }
  };

  const removeColorFromPalette = (color: string) => {
    setPalette(palette.filter(c => c !== color));
  };

  const downloadDataUrl = (filename: string, dataUrl: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  };

  const downloadTextFile = (filename: string, content: string, mimeType: string = 'text/plain') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getFrameDisplayColor = (frame: Frame, index: number) => {
    const color = frame.pixels[index];
    if (color && color !== 'transparent') return color;
    const baseColor = frame.basePixels?.[index];
    return baseColor && baseColor !== 'transparent' ? baseColor : 'transparent';
  };

  const renderFrameCanvas = (frame: Frame, scale: number, backgroundColor?: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = gridSize * scale;
    canvas.height = gridSize * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.imageSmoothingEnabled = false;

    if (backgroundColor) {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    for (let i = 0; i < frame.pixels.length; i++) {
      const displayColor = getFrameDisplayColor(frame, i);
      if (displayColor === 'transparent') continue;
      const x = (i % gridSize) * scale;
      const y = Math.floor(i / gridSize) * scale;
      ctx.fillStyle = displayColor;
      ctx.fillRect(x, y, scale, scale);
    }

    return canvas;
  };

  const exportAs = (format: ExportFormat) => {
    const activeFrame = frames[currentFrameIndex];
    if (!activeFrame) return;

    const safeName = projectName.trim().replace(/\s+/g, '-').toLowerCase() || 'pixel-sprite';

    if (format === 'png') {
      const canvas = renderFrameCanvas(activeFrame, 20);
      if (!canvas) return;
      downloadDataUrl(`${safeName}.png`, canvas.toDataURL('image/png'));
      audioEngineRef.current?.exportComplete();
      setShowExportMenu(false);
      trackEvent('sprite_exported', { event_category: 'creation', format: 'png' });
      trackEvent('export_completed', { format: 'png', frame_count: frames.length });
      return;
    }

    if (format === 'jpeg') {
      const canvas = renderFrameCanvas(activeFrame, 20, '#ffffff');
      if (!canvas) return;
      downloadDataUrl(`${safeName}.jpg`, canvas.toDataURL('image/jpeg', 0.92));
      audioEngineRef.current?.exportComplete();
      setShowExportMenu(false);
      trackEvent('sprite_exported', { event_category: 'creation', format: 'jpeg' });
      trackEvent('share_clicked', { event_category: 'growth', channel: 'jpeg_export' });
      trackEvent('export_completed', { format: 'jpeg', frame_count: frames.length });
      trackEvent('share_intent', { channel: 'jpeg_export' });
      return;
    }

    if (format === 'sprite-sheet' || format === 'gif') {
      const frameScale = 12;
      const columns = Math.min(8, Math.max(1, Math.ceil(Math.sqrt(frames.length))));
      const rows = Math.max(1, Math.ceil(frames.length / columns));
      const padding = 2;
      const cellSize = gridSize * frameScale;
      const canvas = document.createElement('canvas');
      canvas.width = columns * cellSize + (columns + 1) * padding;
      canvas.height = rows * cellSize + (rows + 1) * padding;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#00000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      frames.forEach((frame, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);
        const offsetX = padding + col * (cellSize + padding);
        const offsetY = padding + row * (cellSize + padding);

        for (let pixelIndex = 0; pixelIndex < frame.pixels.length; pixelIndex++) {
          const displayColor = getFrameDisplayColor(frame, pixelIndex);
          if (displayColor === 'transparent') continue;
          const x = offsetX + (pixelIndex % gridSize) * frameScale;
          const y = offsetY + Math.floor(pixelIndex / gridSize) * frameScale;
          ctx.fillStyle = displayColor;
          ctx.fillRect(x, y, frameScale, frameScale);
        }
      });

      if (format === 'gif') {
        showFrameNotice('Animated GIF exports as sprite sheet PNG for now');
        downloadDataUrl(`${safeName}-animated.png`, canvas.toDataURL('image/png'));
        trackEvent('share_clicked', { event_category: 'growth', channel: 'gif_export_fallback' });
        trackEvent('share_intent', { channel: 'gif_export_fallback' });
      } else {
        downloadDataUrl(`${safeName}-sheet.png`, canvas.toDataURL('image/png'));
      }
      audioEngineRef.current?.exportComplete();
      setShowExportMenu(false);
      trackEvent('sprite_exported', { event_category: 'creation', format });
      trackEvent('export_completed', { format, frame_count: frames.length });
      return;
    }

    if (format === 'print') {
      const printCanvas = document.createElement('canvas');
      printCanvas.width = 2480;
      printCanvas.height = 3508;
      const printCtx = printCanvas.getContext('2d');
      if (!printCtx) return;

      printCtx.fillStyle = '#ffffff';
      printCtx.fillRect(0, 0, printCanvas.width, printCanvas.height);

      const targetSize = 1700;
      const scale = Math.max(1, Math.floor(targetSize / gridSize));
      const frameCanvas = renderFrameCanvas(activeFrame, scale, '#ffffff');
      if (!frameCanvas) return;

      const x = Math.floor((printCanvas.width - frameCanvas.width) / 2);
      const y = Math.floor((printCanvas.height - frameCanvas.height) / 2);
      printCtx.drawImage(frameCanvas, x, y);

      printCtx.fillStyle = '#222222';
      printCtx.font = 'bold 54px system-ui';
      printCtx.textAlign = 'center';
      printCtx.fillText(projectName, printCanvas.width / 2, 220);

      downloadDataUrl(`${safeName}-print.png`, printCanvas.toDataURL('image/png'));
      audioEngineRef.current?.exportComplete();
      setShowExportMenu(false);
      trackEvent('sprite_exported', { event_category: 'creation', format: 'print' });
      trackEvent('export_completed', { format: 'print', frame_count: frames.length });
      return;
    }

    if (format === 'palette') {
      const paletteData = {
        project: projectName,
        colors: palette,
        exportedAt: new Date().toISOString(),
      };
      downloadTextFile(`${safeName}-palette.json`, JSON.stringify(paletteData, null, 2), 'application/json');
      audioEngineRef.current?.exportComplete();
      setShowExportMenu(false);
      trackEvent('sprite_exported', { event_category: 'creation', format: 'palette' });
      trackEvent('export_completed', { format: 'palette', color_count: palette.length });
      return;
    }
  };

  const downloadImage = () => {
    exportAs('png');
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
      playSaveSound();
      addXp(10, 'save');
      updateStreak();
      trackEvent('sprite_saved', {
        event_category: 'creation',
      });
      trackEvent('project_saved', {
        grid_size: gridSize,
        frame_count: frames.length,
      });
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

  const startWithTemplate = (template: TemplateCard) => {
    const basePixels = getTemplatePixels(template.id, template.size);
    const emptyPixels = Array(template.size * template.size).fill('transparent');
    const nextLockMask = getTemplateLockMask(template.id, template.size);
    setGridSize(template.size);
    setFrames([{ id: Math.random().toString(36).substr(2, 9), pixels: emptyPixels, basePixels }]);
    setActiveTemplateId(template.id);
    setLockMask(nextLockMask);
    setColorableMask(nextLockMask ? buildColorableMask(template.size, nextLockMask) : null);
    setTemplateCompletionAwarded(false);
    setGoldFlash(false);
    if (template.palette?.length) {
      setPalette(prev => Array.from(new Set([...template.palette!, ...prev])));
    }
    setProjectName(template.name);
    setShowTemplates(false);
    setOnboarding(false);
    saveToHistory(emptyPixels);
    trackEvent('template_started', {
      template_id: template.id,
      template_kind: template.kind,
      canvas_size: template.size,
    });
  };

  const canAddMoreFrames = frames.length < MAX_FRAMES;

  // --- Sub-Views ---

  const BirthdaySplashView = () => (
    <div className="fixed inset-0 z-[120] bg-gradient-to-br from-fuchsia-950 via-purple-950 to-indigo-950 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 18 }).map((_, index) => (
          <motion.div
            key={index}
            className="absolute rounded-full"
            style={{
              left: `${(index * 17) % 100}%`,
              top: `${(index * 23) % 100}%`,
              width: `${6 + (index % 4) * 4}px`,
              height: `${6 + (index % 4) * 4}px`,
              background: index % 2 === 0 ? 'rgba(250, 204, 21, 0.85)' : 'rgba(236, 72, 153, 0.75)',
              boxShadow: '0 0 14px rgba(250, 204, 21, 0.6)',
            }}
            animate={{
              y: [0, -16, 0],
              opacity: [0.35, 1, 0.35],
              scale: [0.85, 1.15, 0.85],
            }}
            transition={{
              duration: 2.2 + (index % 5) * 0.25,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.06,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative max-w-xl w-full rounded-[36px] border border-white/20 bg-black/35 backdrop-blur-xl px-7 py-10 md:px-10 md:py-12 shadow-2xl"
      >
        <motion.div
          animate={{ rotate: [0, -5, 5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mx-auto mb-6 w-20 h-20 rounded-3xl bg-gradient-to-br from-yellow-300 via-fuchsia-400 to-purple-500 flex items-center justify-center shadow-lg shadow-fuchsia-500/40"
        >
          <Sparkles className="w-10 h-10 text-white" />
        </motion.div>

        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-fuchsia-200 mb-3">Special Splash</p>
        <h1 className="text-4xl md:text-5xl font-display italic text-white tracking-tight leading-tight">
          Happy 10th Birthday Mariah
        </h1>
        <p className="mt-4 text-zinc-200/90 text-sm md:text-base">
          Wishing you a glitter-filled day of art, color, and fun pixel magic.
        </p>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowBirthdaySplash(false)}
          className="mt-8 w-full rounded-2xl bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-500 text-black font-black uppercase tracking-[0.22em] text-xs py-4 shadow-xl shadow-pink-500/30"
        >
          Press Enter
        </motion.button>
      </motion.div>
    </div>
  );

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
        <h1 className="text-4xl font-display italic text-white mb-4 tracking-tighter">Create Your Pixels and Spirites</h1>
        <p className="text-zinc-500 mb-12">Create. Customize. Share.</p>
        
        <Button
          onClick={() => {
            setShowTemplates(true);
            trackEvent('template_picker_opened');
          }}
          className="w-full py-4 text-lg"
        >
          Start Creating
        </Button>
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
          className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[110] flex items-center justify-center p-4 md:p-8"
        >
          <div className="w-full max-w-6xl max-h-[90vh] rounded-[32px] border border-zinc-800 bg-zinc-950/95 shadow-2xl shadow-black/60 overflow-hidden flex flex-col">
            <div className="px-6 md:px-8 py-6 border-b border-zinc-900 bg-gradient-to-r from-purple-600/20 via-fuchsia-600/10 to-blue-500/20">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-purple-300 uppercase tracking-[0.25em]">Starter Library</p>
                  <h2 className="text-2xl md:text-3xl font-display italic text-white mt-2">Choose a Starting Base</h2>
                  <p className="text-zinc-400 text-sm mt-2">Pick a premium starter by category, then customize it in your own style.</p>
                </div>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="w-10 h-10 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 flex items-center justify-center"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="px-6 md:px-8 py-6 border-b border-zinc-900">
              <div className="rounded-[24px] bg-gradient-to-r from-rose-500/20 to-orange-500/20 border border-white/10 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" /> Template Market Live
                  </p>
                  <p className="text-sm text-white/90 mt-1">Need pro bases? Jump to the Studio market for fresh drops.</p>
                </div>
                <button
                  onClick={() => {
                    setShowTemplates(false);
                    travelToStudio('template-market');
                  }}
                  className="w-full md:w-auto px-4 py-2 rounded-2xl bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/30"
                >
                  Visit Template Market
                </button>
              </div>
            </div>

            <div className="px-6 md:px-8 py-6 overflow-y-auto">
              {TEMPLATE_SECTION_ORDER.map(section => {
                const sectionTemplates = TEMPLATES.filter(template => template.category === section);
                if (!sectionTemplates.length) return null;

                return (
                  <section key={section} className="mb-8 last:mb-0">
                    <div className="mb-3 flex items-end justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">{TEMPLATE_SECTION_META[section].label}</h3>
                        <p className="text-[11px] text-zinc-500 mt-1">{TEMPLATE_SECTION_META[section].hint}</p>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{sectionTemplates.length} Templates</span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                      {sectionTemplates.map(t => (
                        <button
                          key={t.id}
                          disabled={t.locked && !isTeenMode}
                          onClick={() => startWithTemplate(t)}
                          className={`bg-gradient-to-b from-zinc-900 to-zinc-950 border p-5 rounded-3xl hover:border-purple-500 transition-all flex flex-col items-center gap-3 group relative ${activeTemplateId === t.id ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-zinc-800'} ${t.locked && !isTeenMode ? 'opacity-40 cursor-not-allowed' : ''}`}
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
                            <span className="font-bold text-lg text-zinc-300 leading-none text-center">{t.name}</span>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">
                              {t.size}x{t.size} {t.locked && !isTeenMode ? '(Lvl 10)' : ''}
                            </span>
                            <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">
                              {t.kind === 'color-in' ? 'Lock + Fill' : section}
                            </span>
                          </div>

                          {t.palette?.length ? (
                            <div className="flex items-center gap-1 mt-1">
                              {t.palette.slice(0, 5).map(color => (
                                <span
                                  key={`${t.id}-${color}`}
                                  className="w-3 h-3 rounded-full border border-zinc-700"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            <div className="px-6 md:px-8 py-4 border-t border-zinc-900 bg-zinc-950/80">
              <button 
                onClick={() => setShowTemplates(false)}
                className="text-zinc-400 hover:text-white w-full text-center font-bold"
              >
                Back
              </button>
            </div>
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
          {/* Gamification Display */}
          <div className="flex items-center gap-3 ml-4 px-3 py-1 bg-zinc-900/50 rounded-lg">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] font-bold text-zinc-300">LVL {level}</span>
            </div>
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-purple-400" />
              <span className="text-[10px] font-bold text-zinc-300">{xp}/{xpForNextLevel(level)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-[10px] font-bold text-zinc-300">{streak}</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className="w-3 h-3 text-green-400" />
              <span className="text-[10px] font-bold text-zinc-300">{achievements.length}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Auto-saving...</span>
          <Button 
            variant="ghost"
            onClick={() => travelToStudio('creator-hq')}
            className="px-3 py-2 text-xs flex items-center gap-2 border border-zinc-800"
          >
            <Map className="w-3 h-3" /> Studio HQ
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setShowTemplates(true)} 
            className="px-3 py-2 text-xs flex items-center gap-2 border border-zinc-800"
          >
            <Plus className="w-3 h-3" /> New
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setShowExportMenu(true)} 
            className="px-3 py-2 text-xs flex items-center gap-2 border border-zinc-800"
          >
            <Download className="w-3 h-3" /> Export
          </Button>
          <Button 
            variant="secondary" 
            onClick={() => setShowPreviewModal(true)} 
            className="px-4 py-2 text-xs flex items-center gap-2"
          >
            <Play className="w-3 h-3" /> Preview
          </Button>
          <Button onClick={saveProject} className="px-4 py-2 text-xs">Save</Button>
        </div>
      </header>

      <div className="md:hidden border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md px-3 py-2 flex items-center gap-2">
        <button
          onClick={() => setShowExportMenu(true)}
          className="flex-1 py-2 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-200 text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Download className="w-3 h-3" /> Export As
        </button>
        <button
          onClick={saveProject}
          className="flex-1 py-2 rounded-xl bg-purple-600 text-white text-[11px] font-bold uppercase tracking-widest flex items-center justify-center gap-2"
        >
          <Save className="w-3 h-3" /> Save
        </button>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#0a0a0a] checkerboard overflow-hidden relative">
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentFrameIndex}
            initial={{ opacity: 0.8, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.1 }}
            className="relative shadow-2xl shadow-black/50 border-4 border-zinc-900 bg-zinc-950 rounded-3xl p-2"
          >
            <PixelCanvas
              ref={pixelCanvasRef}
              gridSize={gridSize}
              frames={frames}
              currentFrameIndex={currentFrameIndex}
              selectedColor={selectedColor}
              tool={tool}
              mirrorMode={mirrorMode}
              zoom={zoom}
              onZoomChange={handleZoomChange}
              brushSize={brushSize}
              eraserSize={eraserSize}
              showGrid={showGrid}
              onionSkinning={onionSkinning}
              onPixelChange={handlePixelChange}
              onStrokeComplete={handleStrokeComplete}
              onColorPick={handleColorPick}
              isLockedPixel={isLockedPixel}
              onSelectionChange={handleSelectionChange}
            />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {goldFlash && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 pointer-events-none bg-gradient-to-br from-yellow-300/20 via-amber-300/10 to-yellow-500/20 z-30"
            />
          )}
        </AnimatePresence>

        {/* Nudge Panel */}
        <AnimatePresence>
          {showNudgePanel && selection && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex items-center gap-2 shadow-2xl z-50"
            >
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Move</span>
              <button 
                onClick={() => nudgeSelection(0, -1)}
                className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                ↑
              </button>
              <button 
                onClick={() => nudgeSelection(0, 1)}
                className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                ↓
              </button>
              <button 
                onClick={() => nudgeSelection(-1, 0)}
                className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                ←
              </button>
              <button 
                onClick={() => nudgeSelection(1, 0)}
                className="w-8 h-8 bg-zinc-800 hover:bg-zinc-700 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
              >
                →
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Tool Panel */}
        <div className="fixed md:absolute right-1.5 md:right-4 top-20 md:top-4 bottom-[calc(5.75rem+env(safe-area-inset-bottom))] md:bottom-4 w-[4.25rem] md:w-auto flex flex-col gap-2 bg-zinc-900/85 backdrop-blur-xl p-2 rounded-3xl border border-zinc-800 shadow-2xl overflow-y-auto scrollbar-hide z-50 max-h-[calc(100dvh-10.5rem-env(safe-area-inset-bottom))] md:max-h-[calc(100%-2rem)] pointer-events-auto">
          <div className="md:hidden sticky top-0 z-20 self-end relative">
            <button
              onClick={() => setShowMobileQuickColor(prev => !prev)}
              className="px-2 py-2 rounded-xl bg-zinc-900/95 border border-zinc-800 text-[8px] font-bold uppercase tracking-widest text-zinc-300 flex items-center gap-2"
            >
              <span className="w-4 h-4 rounded border border-zinc-700" style={{ backgroundColor: selectedColor }} />
              <span>{showMobileQuickColor ? 'Close' : 'Color'}</span>
            </button>

            {showMobileQuickColor && (
              <div className="absolute right-0 mt-2 w-52 bg-zinc-900/95 border border-zinc-800 rounded-2xl p-2 flex flex-col gap-2 shadow-2xl">
                <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest text-center">Quick Color</span>
                <div className="flex items-center gap-2">
                  <label className="w-10 h-10 rounded-xl border-2 border-zinc-700 overflow-hidden relative flex-shrink-0">
                    <span className="absolute inset-0" style={{ backgroundColor: selectedColor }} />
                    <input
                      type="color"
                      value={normalizeToHexColor(selectedColor) ?? '#ffffff'}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      aria-label="Select color"
                    />
                  </label>
                  <button
                    onClick={() => setActivePaletteTab('current')}
                    className="flex-1 px-2 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-[8px] font-bold uppercase tracking-widest text-zinc-300"
                  >
                    My Palette
                  </button>
                  <button
                    onClick={() => addColorToPalette(selectedColor)}
                    className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center"
                    title="Add color"
                  >
                    <Plus className="w-4 h-4 text-zinc-300" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <ToolButton active={tool === 'pencil'} onClick={() => setTool('pencil')} icon={<Pencil className="w-5 h-5" />} label="Pencil" />
          <ToolButton active={tool === 'fill'} onClick={() => setTool('fill')} icon={<PaintBucket className="w-5 h-5" />} label="Fill" />
          <ToolButton active={tool === 'eraser'} onClick={() => setTool('eraser')} icon={<Eraser className="w-5 h-5" />} label="Eraser" />
          <ToolButton active={tool === 'picker'} onClick={() => setTool('picker')} icon={<Pipette className="w-5 h-5" />} label="Picker" />
          <ToolButton active={tool === 'select'} onClick={() => setTool('select')} icon={<Square className="w-5 h-5" />} label="Select" />
          <div className="h-[1px] bg-zinc-800 mx-2 my-1" />
          <ToolButton active={false} onClick={undo} disabled={!canUndo} icon={<Undo2 className="w-5 h-5" />} label="Undo" />
          <ToolButton active={false} onClick={redo} disabled={!canRedo} icon={<Undo2 className="w-5 h-5 scale-x-[-1]" />} label="Redo" />
          <div className="h-[1px] bg-zinc-800 mx-2 my-1" />
          <ToolButton active={false} onClick={() => applyEffect('glow')} icon={<Sparkles className="w-5 h-5 text-yellow-500" />} label="Add Glow" />
          <ToolButton active={false} onClick={() => applyEffect('sparkle')} icon={<Star className="w-5 h-5 text-blue-400" />} label="Add Sparkles" />
          <ToolButton active={false} onClick={() => applyEffect('outline')} icon={<Square className="w-5 h-5 text-gray-400" />} label="Clean Outline" />
          <ToolButton active={false} onClick={() => applyEffect('remix')} icon={<Dices className="w-5 h-5 text-purple-400" />} label="Color Remix" />
          <div className="h-[1px] bg-zinc-800 mx-2 my-1" />
          <ToolButton active={false} onClick={clearCanvas} icon={<RotateCcw className="w-5 h-5" />} label="Clear Canvas" />
          <ToolButton active={mirrorMode} onClick={() => setMirrorMode(!mirrorMode)} icon={<Maximize2 className="w-5 h-5" />} label="Mirror" />
          <ToolButton active={showGrid} onClick={() => setShowGrid(!showGrid)} icon={<Grid className="w-5 h-5" />} label="Grid" />
          <ToolButton active={showPreview} onClick={() => setShowPreview(!showPreview)} icon={<Monitor className="w-5 h-5" />} label="Preview" />
          
          {!isTeenMode && (
            <div className="relative group">
              <ToolButton active={false} onClick={() => {}} icon={<ShieldCheck className="w-5 h-5 text-zinc-700" />} label="Lvl 10 Required" />
              <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-zinc-900 border border-zinc-800 p-3 rounded-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none w-48 shadow-2xl z-50">
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">Teen Mode Locked</p>
                <p className="text-[9px] text-zinc-500 leading-relaxed">Reach Level 10 to unlock 64x64 canvas and advanced shading brushes.</p>
              </div>
            </div>
          )}

          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-2 flex flex-col gap-2">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest text-center">Brush Size</span>
            <div className="flex gap-1">
              {[1, 2, 4].map(size => (
                <button
                  key={`brush-${size}`}
                  onClick={() => setBrushSize(size as 1 | 2 | 4)}
                  className={`flex-1 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest border ${brushSize === size ? 'bg-purple-600 text-white border-purple-400' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                >
                  {size}x
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-2 flex flex-col gap-2">
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest text-center">Eraser Size</span>
            <div className="flex gap-1">
              {[1, 3, 6].map(size => (
                <button
                  key={`eraser-${size}`}
                  onClick={() => setEraserSize(size as 1 | 3 | 6)}
                  className={`flex-1 py-1 rounded-lg text-[8px] font-bold uppercase tracking-widest border ${eraserSize === size ? 'bg-emerald-500 text-black border-emerald-300' : 'border-zinc-800 text-zinc-500 hover:border-zinc-600'}`}
                >
                  {size}x
                </button>
              ))}
            </div>
          </div>

          <div className="px-2 py-2 flex flex-col items-center gap-1 mt-auto">
            <div className="flex items-center gap-1 mb-1">
              <button
                onClick={() => handleZoomChange(zoom - 0.2)}
                className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white"
                title="Zoom Out"
              >
                -
              </button>
              <button
                onClick={() => handleZoomChange(zoom + 0.2)}
                className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white"
                title="Zoom In"
              >
                +
              </button>
            </div>
            <input 
              type="range" min={MIN_CANVAS_ZOOM} max={MAX_CANVAS_ZOOM} step="0.1" value={zoom} 
              onChange={(e) => handleZoomChange(Number(e.target.value))}
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
              <button
                onClick={() => {
                  setShowPreview(false);
                  setIsPlaying(false);
                }}
                className="absolute top-1 right-1 z-10 text-zinc-500 hover:text-white"
                title="Close preview"
              >
                <X className="w-3 h-3" />
              </button>
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

      {/* Animation Bar */}
        <div className="relative border-t border-zinc-900 bg-zinc-950 flex flex-col md:flex-row md:items-center px-3 md:px-6 py-3 md:py-2 gap-3 md:gap-4 flex-shrink-0">
          <div className="w-full md:w-auto flex flex-col gap-2 md:gap-1 md:pr-4 md:border-r md:border-zinc-900">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={handlePlaybackToggle}
              className={`p-2 rounded-lg transition-all ${isPlaying ? 'bg-red-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              {isPlaying ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button 
              onClick={() => setShowPreview(prev => !prev)}
              className={`p-2 rounded-lg transition-all ${showPreview ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setOnionSkinning(prev => !prev)}
              className={`p-2 rounded-lg transition-all ${onionSkinning ? 'bg-orange-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
              title="Onion Skinning"
            >
              <Layers className="w-4 h-4" />
            </button>
            <button 
              onClick={toggleSound}
              className={`p-2 rounded-lg transition-all ${soundEnabled ? 'bg-green-500 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'}`}
              title="Sound Effects"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={toggleSoftMode}
              className={`px-2 py-1.5 rounded-lg transition-all border text-[8px] font-bold uppercase tracking-widest ${softMode ? 'bg-blue-500/30 text-blue-200 border-blue-400/60' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'}`}
              title="Soft Mode"
            >
              Soft
            </button>
            <div className="h-8 w-[1px] bg-zinc-900 mx-1" />
            <div className="relative">
              <button
                onClick={() => setShowAnimationTools(prev => !prev)}
                className={`p-2 rounded-lg transition-all border ${showAnimationTools ? 'bg-purple-600 text-white border-purple-400' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white'}`}
                title="Animation Presets"
              >
                <Wand2 className="w-4 h-4" />
              </button>
              {showAnimationTools && (
                <div className="absolute bottom-12 left-0 z-50 w-64 p-2 rounded-xl border border-zinc-800 bg-zinc-950/95 shadow-2xl grid grid-cols-3 gap-1">
                  {ANIMATION_PRESET_OPTIONS.map(option => (
                    <button
                      key={option.key}
                      onClick={() => applyAnimationPreset(option.key)}
                      className="px-2 py-1.5 text-[8px] font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-all"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button 
              onClick={() => travelToStudio('motion-lab')}
              className="flex items-center gap-2 px-3 py-1 rounded-xl border border-zinc-800 text-[8px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white hover:border-purple-500 transition-all"
            >
              <Gamepad2 className="w-3 h-3" /> Visit Motion Lab
            </button>
          </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[8px] font-bold text-zinc-600">FPS</span>
              <input 
                type="range" min="1" max="24" step="1" value={fps} 
                onChange={(e) => handleFpsChange(Number(e.target.value))}
                onPointerDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="w-24 h-2 accent-purple-500 cursor-pointer touch-none"
              />
              <span className="text-[8px] font-bold text-zinc-500 w-8 text-right">{fps}</span>
            </div>
          </div>

          <div className="w-full flex items-start gap-3 overflow-x-auto scrollbar-hide pb-1">
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button 
              onClick={handleAddFrame}
              disabled={!canAddMoreFrames}
              title={canAddMoreFrames ? 'Add Frame' : `Frame limit reached (${MAX_FRAMES})`}
              className={`w-14 h-14 rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${canAddMoreFrames ? 'border-zinc-800 hover:border-zinc-600 text-white' : 'border-red-500/50 text-red-400 cursor-not-allowed opacity-60'}`}
            >
              <Plus className="w-6 h-6" />
            </button>
            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
              {frames.length}/{MAX_FRAMES} Frames
            </span>
            {!canAddMoreFrames && (
              <span className="text-[7px] font-bold text-red-400 uppercase tracking-widest">Limit Reached</span>
            )}
          </div>
          
          <div className="flex gap-3">
            {frames.map((f, i) => (
              <div 
                key={f.id}
                className="flex flex-col gap-1 flex-shrink-0"
              >
                <div 
                  onClick={() => setCurrentFrameIndex(i)}
                  className={`w-16 h-16 md:w-14 md:h-14 rounded-xl border-2 overflow-hidden cursor-pointer transition-all relative group ${currentFrameIndex === i ? 'border-purple-500 scale-105' : 'border-zinc-900'}`}
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
                          moveFrame(i, i - 1);
                        }}
                        className="p-1 hover:bg-white/20 rounded"
                      >
                        <ArrowLeft className="w-3 h-3 text-white" />
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateFrame(i);
                      }}
                      className={`p-1 rounded ${canAddMoreFrames ? 'hover:bg-white/20' : 'opacity-40 cursor-not-allowed'}`}
                      title={canAddMoreFrames ? 'Duplicate' : `Max ${MAX_FRAMES} frames`}
                      disabled={!canAddMoreFrames}
                    >
                      <Copy className="w-3 h-3 text-white" />
                    </button>
                    {i < frames.length - 1 && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          moveFrame(i, i + 1);
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
                          handleDeleteFrame(i);
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
                <div className="flex items-center gap-2">
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
                  {frames.length > 1 && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFrame(i);
                      }}
                      className="px-2 py-1 text-[8px] font-bold uppercase tracking-widest bg-red-500/20 text-red-300 rounded border border-red-500/40 hover:bg-red-500/30"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          </div>
          <AnimatePresence>
            {frameNotice && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-zinc-900/95 border border-zinc-800 text-[9px] font-bold text-white px-4 py-1.5 rounded-2xl shadow-lg"
              >
                {frameNotice}
              </motion.div>
            )}
          </AnimatePresence>
      </div>

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
                  onClick={() => {
                    setShowPreviewModal(false);
                    setIsPlaying(false);
                  }}
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

      <AnimatePresence>
        {showExportMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[220] flex items-end md:items-center justify-center p-0 md:p-6"
          >
            <motion.div
              initial={{ y: 24, opacity: 0.95 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0.95 }}
              className="w-full md:max-w-md bg-zinc-950 border border-zinc-800 md:rounded-3xl rounded-t-3xl p-5"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest">Export As</h3>
                <button onClick={() => setShowExportMenu(false)} className="text-zinc-500 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => exportAs('png')} className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-left text-zinc-200 hover:border-purple-500"><span className="font-bold">PNG</span> <span className="text-zinc-500">(Recommended)</span></button>
                <button onClick={() => exportAs('gif')} className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-left text-zinc-200 hover:border-purple-500"><span className="font-bold">Animated GIF</span></button>
                <button onClick={() => exportAs('sprite-sheet')} className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-left text-zinc-200 hover:border-purple-500"><span className="font-bold">Sprite Sheet</span></button>
                <button onClick={() => exportAs('jpeg')} className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-left text-zinc-200 hover:border-purple-500"><span className="font-bold">JPEG</span> <span className="text-zinc-500">(Sharing)</span></button>
                <button onClick={() => exportAs('print')} className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-left text-zinc-200 hover:border-purple-500"><span className="font-bold">Print File</span></button>
                <button onClick={() => exportAs('palette')} className="px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-left text-zinc-200 hover:border-purple-500"><span className="font-bold">Palette</span></button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Palette */}
      <div className="h-40 md:h-32 border-t border-zinc-900 bg-zinc-950 flex flex-col flex-shrink-0">
        <div className="flex px-6 border-b border-zinc-900 overflow-x-auto scrollbar-hide">
          <button 
            onClick={() => setActivePaletteTab('current')}
            className={`px-4 py-2 text-[11px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${activePaletteTab === 'current' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-zinc-500'}`}
          >
            My Palette
          </button>
          <button 
            onClick={() => setActivePaletteTab('saved')}
            className={`px-4 py-2 text-[11px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${activePaletteTab === 'saved' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-zinc-500'}`}
          >
            Saved
          </button>
          <button 
            onClick={() => setActivePaletteTab('trending')}
            className={`px-4 py-2 text-[11px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${activePaletteTab === 'trending' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-zinc-500'}`}
          >
            Trending
          </button>
          <button
            onClick={() => setActivePaletteTab('packs')}
            className={`px-4 py-2 text-[11px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${activePaletteTab === 'packs' ? 'text-purple-500 border-b-2 border-purple-500' : 'text-zinc-500'}`}
          >
            Color Packs
          </button>
        </div>
        
        <div className="flex-1 flex items-start md:items-center px-4 md:px-6 py-2 md:py-0 gap-3 md:gap-4 overflow-x-auto scrollbar-hide">
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
                  <div className="w-12 h-12 md:w-12 md:h-12 rounded-2xl border-2 border-zinc-800 overflow-hidden" style={{ backgroundColor: selectedColor }} />
                  <input type="color" value={normalizeToHexColor(selectedColor) ?? '#ffffff'} onChange={(e) => setSelectedColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
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
                      className={`w-11 h-11 md:w-10 md:h-10 rounded-xl border-2 transition-all ${
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
                      className={`w-9 h-9 md:w-8 md:h-8 rounded-lg border-2 transition-all ${selectedColor === c ? 'border-white scale-110' : 'border-zinc-900 hover:border-zinc-700'}`}
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
          ) : activePaletteTab === 'trending' ? (
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
          ) : (
            <div className="flex gap-4 md:gap-6">
              {COLOR_PACKS.map(pack => (
                <div key={pack.name} className="flex flex-col gap-2 min-w-[140px] md:min-w-[160px]">
                  <div>
                    <p className="text-[9px] font-bold text-white uppercase tracking-widest">{pack.name}</p>
                    <p className="text-[8px] text-zinc-500 uppercase tracking-widest mt-0.5">{pack.theme}</p>
                  </div>
                  <button
                    onClick={() => {
                      setPalette(pack.colors);
                      setSelectedColor(pack.colors[0]);
                      setActivePaletteTab('current');
                    }}
                    className="flex gap-0.5 bg-zinc-900 p-1.5 rounded-xl border border-zinc-800 hover:border-purple-500 transition-all"
                    title={`Apply ${pack.name}`}
                  >
                    {pack.colors.map((c, index) => (
                      <div key={`${pack.name}-${index}`} className="w-4 h-9 rounded-sm" style={{ backgroundColor: c }} />
                    ))}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const StudioView = () => {
    const ownedPluginMeta = PLUGIN_LIBRARY.filter(plugin => ownedPlugins.includes(plugin.id));
    const completedTasks = dailyTasks.filter(task => task.claimed).length;

    return (
      <div className="flex-1 flex flex-col gap-8 p-8 overflow-y-auto relative">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <motion.div 
            whileHover={{ y: -5 }}
            className="xl:col-span-2 bg-gradient-to-r from-purple-900/50 via-indigo-900/20 to-transparent border border-purple-500/20 rounded-[40px] p-8 relative overflow-hidden"
          >
            <div className="flex flex-col gap-6 relative z-10">
              <div className="flex items-center gap-3 text-purple-300 text-[10px] font-black uppercase tracking-widest">
                <Map className="w-4 h-4" /> Studio Passport
              </div>
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div>
                  <h2 className="text-4xl font-display italic text-white tracking-tight">Keep the studio economy humming.</h2>
                  <p className="text-zinc-400 text-sm mt-2 max-w-xl">Hop between labs, install plugins, and finish daily briefs to keep your toolkit funded.</p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <div className="px-4 py-3 rounded-2xl bg-black/30 border border-white/10 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-amber-300" />
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Coins</p>
                      <p className="text-lg font-mono text-white">{coins.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-black/30 border border-white/10 flex items-center gap-2">
                    <Gem className="w-4 h-4 text-sky-300" />
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Gems</p>
                      <p className="text-lg font-mono text-white">{gems}</p>
                    </div>
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-black/30 border border-white/10 flex items-center gap-2">
                    <BadgeDollarSign className="w-4 h-4 text-emerald-300" />
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tasks</p>
                      <p className="text-lg font-mono text-white">{completedTasks}/{dailyTasks.length}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 text-[9px] font-bold text-purple-200 uppercase tracking-[0.3em]">
                <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30">Warp-ready</span>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30">Live Sync</span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30">Economy Safe</span>
              </div>
            </div>
            <motion.div
              animate={{ rotate: [0, 6, 0], y: [0, -10, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -right-10 -bottom-6 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl"
            />
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-zinc-900 border border-zinc-800 rounded-[40px] p-6 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Installed Plugins</p>
                <p className="text-2xl font-display italic text-white mt-1">{ownedPluginMeta.length}</p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                <PlugZap className="w-5 h-5 text-purple-300" />
              </div>
            </div>
            {ownedPluginMeta.length === 0 ? (
              <p className="text-sm text-zinc-500">Install a plugin to level up your studio toolkit.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {ownedPluginMeta.map(plugin => (
                  <span key={plugin.id} className="px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                    {plugin.name}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={() => handleTravel('creator-hq')}
              className="mt-auto w-full px-4 py-3 rounded-2xl bg-purple-600/20 text-purple-200 border border-purple-500/30 text-[10px] font-bold uppercase tracking-widest hover:bg-purple-600/30 transition-colors"
            >
              Quick Sync Jump
            </button>
          </motion.div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-display italic text-white">Studio Destinations</h3>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Pick a mission lane</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {STUDIO_DESTINATIONS.map(destination => {
              const Icon = destination.icon;
              return (
                <motion.div
                  key={destination.id}
                  whileHover={{ y: -6 }}
                  className={`rounded-[36px] p-6 border border-white/10 text-white bg-gradient-to-br ${destination.gradient} relative overflow-hidden`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/80">
                        <span className="px-3 py-1 rounded-full bg-white/20">{destination.badge}</span>
                        Mission Deck
                      </div>
                      <h4 className="text-2xl font-display italic mt-3">{destination.title}</h4>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-black/20 flex items-center justify-center">
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <p className="text-sm text-white/80 mt-4 leading-relaxed">{destination.description}</p>
                  <ul className="mt-4 space-y-1 text-[11px] text-white/80">
                    {destination.tasks.map(task => (
                      <li key={task} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
                        {task}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleTravel(destination.id)}
                    className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/30"
                  >
                    <Map className="w-3 h-3" /> Warp Now
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
          <div className="bg-zinc-950 border border-zinc-900 rounded-[32px] p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-display italic text-white">Plugin Library</h3>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Boost your editor</p>
              </div>
              <PiggyBank className="w-6 h-6 text-purple-300" />
            </div>
            <div className="space-y-4 mt-6">
              {PLUGIN_LIBRARY.map(plugin => {
                const Icon = plugin.icon;
                const isOwned = ownedPlugins.includes(plugin.id);
                const hasFunds = coins >= plugin.costCoins && gems >= plugin.costGems;
                return (
                  <div
                    key={plugin.id}
                    className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 flex flex-col gap-4 md:flex-row md:items-center"
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-purple-300" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">{plugin.badge}</span>
                          {isOwned && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-bold uppercase tracking-widest">
                              Installed
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-display text-white mt-1">{plugin.name}</h4>
                        <p className="text-sm text-zinc-400 mt-1">{plugin.description}</p>
                        <p className="text-[11px] text-emerald-300 mt-2 font-bold uppercase tracking-widest">{plugin.boost}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-[11px] font-bold text-zinc-400">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-amber-300">
                          <Coins className="w-3 h-3" /> {plugin.costCoins}
                        </span>
                        <span className="flex items-center gap-1 text-sky-300">
                          <Gem className="w-3 h-3" /> {plugin.costGems}
                        </span>
                      </div>
                      <button
                        onClick={() => handlePurchasePlugin(plugin.id)}
                        disabled={!hasFunds || isOwned}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${isOwned ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 cursor-default' : hasFunds ? 'bg-purple-600 text-white border-purple-400 hover:bg-purple-500' : 'bg-zinc-800 text-zinc-500 border-zinc-700 cursor-not-allowed'}`}
                      >
                        {isOwned ? 'Installed' : hasFunds ? 'Install' : 'Need Funds'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="bg-zinc-950 border border-zinc-900 rounded-[32px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-display italic text-white">Daily Studio Tasks</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Earn rewards for shipping</p>
                </div>
                <Wallet className="w-6 h-6 text-emerald-300" />
              </div>
              <div className="space-y-4 mt-6">
                {dailyTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                    <div>
                      <p className="text-sm font-bold text-white">{task.label}</p>
                      <div className="flex gap-3 mt-2 text-[10px] font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1 text-amber-300">
                          <Coins className="w-3 h-3" /> +{task.rewardCoins}
                        </span>
                        {task.rewardGems > 0 && (
                          <span className="flex items-center gap-1 text-sky-300">
                            <Gem className="w-3 h-3" /> +{task.rewardGems}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleClaimTask(task.id)}
                      disabled={task.claimed}
                      className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${task.claimed ? 'bg-zinc-900 text-zinc-600 border-zinc-700 cursor-default' : 'bg-emerald-500 text-black border-emerald-400 hover:bg-emerald-400'}`}
                    >
                      {task.claimed ? 'Claimed' : 'Claim'}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-zinc-950 border border-zinc-900 rounded-[32px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-display italic text-white">Studio Feed</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Latest sync events</p>
                </div>
                <PiggyBank className="w-6 h-6 text-pink-300" />
              </div>
              <div className="mt-4 space-y-3">
                {studioFeed.map((entry, index) => (
                  <div key={`${entry}-${index}`} className="flex items-start gap-3 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800">
                    <div className="w-10 h-10 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-purple-300" />
                    </div>
                    <p className="text-sm text-zinc-300">{entry}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {studioNotice && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="fixed bottom-24 right-8 bg-zinc-900/95 border border-purple-500/30 text-sm font-bold text-white px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2"
            >
              <BadgeDollarSign className="w-4 h-4 text-purple-300" />
              {studioNotice}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

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
      {onboarding && activeTab === 'create' && showBirthdaySplash && <BirthdaySplashView />}
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
            {activeTab === 'studio' && <StudioView />}
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

      {/* Achievement Modal */}
      <AnimatePresence>
        {showAchievementModal && currentAchievement && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[200]"
            onClick={dismissAchievementModal}
          >
            <motion.div 
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-gradient-to-br from-yellow-400 to-orange-500 p-6 rounded-3xl shadow-2xl max-w-sm mx-4"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <Trophy className="w-8 h-8 text-yellow-500" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">Achievement Unlocked!</h3>
                <p className="text-yellow-100 font-bold">{currentAchievement}</p>
                <div className="flex items-center justify-center gap-2 mt-4 text-yellow-200">
                  <Star className="w-4 h-4" />
                  <span className="text-sm font-bold">+50 XP</span>
                </div>
                <button
                  onClick={dismissAchievementModal}
                  className="mt-4 px-4 py-2 rounded-xl bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-white/30"
                >
                  Tap to close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="h-8 border-t border-zinc-900 bg-zinc-950 px-3 flex items-center justify-center gap-3 text-[9px] font-bold uppercase tracking-widest text-zinc-500 flex-shrink-0">
        <a href="/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">Privacy Policy</a>
        <span className="text-zinc-700">•</span>
        <a href="https://antoinettewillliams.com/" target="_blank" rel="noopener noreferrer" className="hover:text-zinc-300 transition-colors">antoinettewillliams.com</a>
        <span className="text-zinc-700">•</span>
        <span>All rights reserved @True Lavender</span>
      </footer>

      {/* Bottom Navigation */}
      <nav className="h-16 border-t border-zinc-900 bg-zinc-950/80 backdrop-blur-xl flex items-center px-4 gap-2 flex-shrink-0 pb-[max(env(safe-area-inset-bottom),0px)]">
        <TabButton active={activeTab === 'create'} onClick={() => setActiveTab('create')} icon={<PlusCircle className="w-5 h-5" />} label="Create" />
        <TabButton active={activeTab === 'studio'} onClick={() => setActiveTab('studio')} icon={<Map className="w-5 h-5" />} label="Studio" />
        <TabButton active={activeTab === 'closet'} onClick={() => setActiveTab('closet')} icon={<Shirt className="w-5 h-5" />} label="Closet" />
        <TabButton active={activeTab === 'challenges'} onClick={() => setActiveTab('challenges')} icon={<Target className="w-5 h-5" />} label="Challenges" />
        <TabButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User className="w-5 h-5" />} label="Profile" />
      </nav>
    </div>
  );
}

// --- Helper Components ---

function ToolButton({ active, onClick, icon, label, disabled = false }: any) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.1 }}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      onClick={onClick}
      disabled={disabled}
      className={`p-2.5 md:p-3 rounded-2xl transition-all relative group ${
        active 
          ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' 
          : disabled
            ? 'text-zinc-700 bg-zinc-900/60 cursor-not-allowed'
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
