export type ToolItem = {
  label: string;
  page?: string;
  href?: string;
};

export type CategoryId = 'gaming' | 'tools' | 'instruments' | 'casse';

export type Category = {
  id: CategoryId;
  label: string;
  icon: string;
  items: ToolItem[];
  isTikTok?: boolean;
};

const LEGACY = '/legacy';

export const categories: Category[] = [
  {
    id: 'gaming',
    label: 'Gaming',
    icon: '🎮',
    items: [
      { label: '🎯 OFFITRON 🎯', page: `${LEGACY}/offitron.html` },
      { label: '🔫 Cacciatron – Spara ai cattivi', page: `${LEGACY}/cacciatron.html` },
      { label: '👨‍👩‍👧‍👦 Insiemetron 👨‍👨‍👧', page: `${LEGACY}/Insiemetron.html` },
      { label: '👨‍👩‍👧‍👦 Insiemetron2 👨‍👨‍👧', page: `${LEGACY}/Insiemetron2.html` },
    ],
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: '🛠️',
    items: [
      { label: '📸 Fototron 📷', page: `${LEGACY}/fototron.html` },
      { label: 'Kaustitron 💊', page: `${LEGACY}/Kaustitron.html` },
      { label: 'Campionatron 🔝🎛️🧱', page: `${LEGACY}/Campionatron.html` },
      { label: '🎛️🎧 FRATEMIX 🎧🎛️', href: 'https://francocerone.github.io/fratemix/' },
      { label: '🎬🎵 YOUTUBE DAW 🎵🎬', href: 'https://francocerone.github.io/youtube_daw/' },
    ],
  },
  {
    id: 'instruments',
    label: 'Instruments',
    icon: '🎹',
    items: [
      { label: '🎹 SOGNOTRON 🎹', page: `${LEGACY}/synt.html` },
      { label: '🎶 SONATRON 😢', page: `${LEGACY}/sonatron.html` },
      { label: '🥁💊 Drammatron', page: `${LEGACY}/drammatron.html` },
      { label: '🎹 STRUDETRON 🎹', page: `${LEGACY}/strudetron.html` },
      { label: '🎛️🎧 FRATEMIX 🎧🎛️', href: 'https://francocerone.github.io/fratemix/' },
      { label: '😞 Non lo fa 😞', page: `${LEGACY}/seconda.html` },
      { label: 'PIPPATRON ❄️', page: `${LEGACY}/pippatron.html` },
      { label: 'GIANGIOTRON 🤷‍♂️', page: `${LEGACY}/giangiotron.html` },
    ],
  },
  {
    id: 'casse',
    label: 'Casse',
    icon: '📦',
    isTikTok: true,
    items: [],
  },
];
