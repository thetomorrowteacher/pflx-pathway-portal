export interface PathwayNode {
  id: string;
  title: string;
  icon?: string;
  courseUrl?: string;
  badgeId?: string;
  unlockRequires?: string[];
  position: { x: number; y: number };
  status: 'locked' | 'unlocked' | 'in_progress' | 'completed';
  comingSoon?: boolean;
}

export interface Pathway {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  accentColor: string;
  backgroundTheme: string;
  nodes: PathwayNode[];
}

export const pathways: Pathway[] = [
  {
    id: 'professional-entrepreneur',
    slug: 'professional-entrepreneur',
    title: 'Professional Entrepreneur',
    subtitle: 'Welcome to the Universe of Entrepreneurship',
    description:
      "In the Professional Entrepreneur Pathway, you'll step into the mindset of a founder, innovator, and changemaker. Whether you're building a brand, starting a movement, or solving a problem, this journey gives you the tools to shape your identity, organize your time, lead a team, and tell your story like a pro.",
    icon: '📖',
    accentColor: '#00d4ff',
    backgroundTheme: 'from-purple-900/40 via-fuchsia-900/20 to-transparent',
    nodes: [
      { id: 'pe-intro', title: 'Intro to Entrepreneurship', position: { x: 50, y: 90 }, status: 'unlocked' },
      { id: 'pe-branding', title: 'Personal Branding', position: { x: 30, y: 78 }, status: 'locked', unlockRequires: ['pe-intro'] },
      { id: 'pe-pitch', title: 'Perfect Pitch', position: { x: 20, y: 62 }, status: 'locked', unlockRequires: ['pe-branding'] },
      { id: 'pe-team', title: 'Team Building', position: { x: 20, y: 48 }, status: 'locked', unlockRequires: ['pe-pitch'] },
      { id: 'pe-digital-citizen', title: 'The Digital Citizen & The Age of Tech', position: { x: 45, y: 55 }, status: 'locked', unlockRequires: ['pe-branding'] },
      { id: 'pe-video-ad', title: 'Brand Video Ad Development', position: { x: 40, y: 40 }, status: 'locked', unlockRequires: ['pe-digital-citizen'] },
      { id: 'pe-exhibit', title: 'Exhibit Design', position: { x: 50, y: 30 }, status: 'locked', unlockRequires: ['pe-video-ad'] },
      { id: 'pe-portfolio', title: 'Portfolio Development', position: { x: 70, y: 62 }, status: 'locked', unlockRequires: ['pe-digital-citizen'] },
      { id: 'pe-second-brain', title: 'Second Brain', position: { x: 20, y: 32 }, status: 'locked', comingSoon: true, unlockRequires: ['pe-team'] },
      { id: 'pe-signal-noise', title: 'The Signal to Noise Ratio', position: { x: 20, y: 22 }, status: 'locked', comingSoon: true, unlockRequires: ['pe-second-brain'] },
    ],
  },
  {
    id: 'content-creator',
    slug: 'content-creator',
    title: 'Content Creator',
    subtitle: 'Welcome to the Universe of Content Creation',
    description:
      "Step into the Content Creator Pathway, a dynamic journey where media and storytelling unite. This course covers digital photography, video production, and editing, teaching you real-world techniques used by creators and filmmakers.",
    icon: '🎬',
    accentColor: '#ff6ec7',
    backgroundTheme: 'from-pink-900/40 via-purple-900/20 to-transparent',
    nodes: [
      { id: 'cc-intro', title: 'Intro to Media Production', position: { x: 50, y: 90 }, status: 'unlocked' },
      { id: 'cc-storyboard', title: 'Storybuilding & Storyboarding', position: { x: 25, y: 78 }, status: 'locked', unlockRequires: ['cc-intro'] },
      { id: 'cc-screenwriting', title: 'Screenwriting', position: { x: 20, y: 62 }, status: 'locked', unlockRequires: ['cc-storyboard'] },
      { id: 'cc-media-capture', title: 'Media Capture Techniques', position: { x: 70, y: 62 }, status: 'locked', unlockRequires: ['cc-intro'] },
      { id: 'cc-sound-design', title: 'Sound Design', position: { x: 18, y: 48 }, status: 'locked', unlockRequires: ['cc-screenwriting'] },
      { id: 'cc-video-editing', title: 'Video Editing', position: { x: 45, y: 48 }, status: 'locked', unlockRequires: ['cc-screenwriting', 'cc-media-capture'] },
      { id: 'cc-project-pilot', title: 'Project Pilot', position: { x: 55, y: 30 }, status: 'locked', unlockRequires: ['cc-video-editing'] },
    ],
  },
  {
    id: 'digital-artist',
    slug: 'digital-artist',
    title: 'Digital Artist',
    subtitle: 'Welcome to the Universe of Digital Art',
    description:
      "Welcome to the Digital Artist Pathway, a creative space where design transforms experiences. Here, you'll develop skills in modern visual design, combining graphic design, UI/UX, animation, and digital illustration to create impactful visual messages.",
    icon: '🎨',
    accentColor: '#c084fc',
    backgroundTheme: 'from-violet-900/40 via-fuchsia-900/20 to-transparent',
    nodes: [
      { id: 'da-intro', title: 'Graphic Design Concepts', position: { x: 50, y: 90 }, status: 'unlocked' },
      { id: 'da-storyboard', title: 'Storybuilding & Storyboarding', position: { x: 25, y: 78 }, status: 'locked', unlockRequires: ['da-intro'] },
      { id: 'da-digitize', title: 'Digitize Art', position: { x: 25, y: 62 }, status: 'locked', unlockRequires: ['da-storyboard'] },
      { id: 'da-flipbook', title: 'Flipbook Animation', position: { x: 70, y: 62 }, status: 'locked', unlockRequires: ['da-intro'] },
      { id: 'da-vector', title: 'Vector Graphics', position: { x: 18, y: 48 }, status: 'locked', unlockRequires: ['da-digitize'] },
      { id: 'da-photo', title: 'Photo Art', position: { x: 38, y: 45 }, status: 'locked', unlockRequires: ['da-digitize'] },
      { id: 'da-digital-anim', title: 'Digital Animation', position: { x: 65, y: 45 }, status: 'locked', unlockRequires: ['da-flipbook'] },
      { id: 'da-comic', title: 'Comicbook Creator', position: { x: 38, y: 30 }, status: 'locked', unlockRequires: ['da-photo'] },
      { id: 'da-infinity', title: 'Infinity Art', position: { x: 18, y: 30 }, status: 'locked', unlockRequires: ['da-vector'] },
      { id: 'da-animated-adv', title: 'Animated Adventure', position: { x: 60, y: 28 }, status: 'locked', unlockRequires: ['da-digital-anim'] },
    ],
  },
  {
    id: '3d-modeler',
    slug: '3d-modeler',
    title: '3D Modeler',
    subtitle: 'Welcome to the Universe of 3D Modeling',
    description:
      "Welcome to the 3D Modeler Pathway — a hands-on, open world experience where you'll bring ideas to life in three dimensions. You'll sculpt characters, design environments, and construct entire worlds using the same tools real artists, architects, engineers, and game developers use.",
    icon: '🧊',
    accentColor: '#22d3ee',
    backgroundTheme: 'from-cyan-900/40 via-blue-900/20 to-transparent',
    nodes: [
      { id: '3d-intro', title: 'Intro to 3D Modeling', position: { x: 50, y: 90 }, status: 'unlocked' },
      { id: '3d-mazes', title: 'The Amazing World of Mazes', position: { x: 25, y: 78 }, status: 'locked', unlockRequires: ['3d-intro'] },
      { id: '3d-earthship', title: 'Earthship Colony', position: { x: 22, y: 60 }, status: 'locked', unlockRequires: ['3d-mazes'] },
      { id: '3d-3dprint', title: '3D Printing', position: { x: 70, y: 65 }, status: 'locked', unlockRequires: ['3d-intro'] },
      { id: '3d-character', title: 'Character Creator', position: { x: 68, y: 50 }, status: 'locked', unlockRequires: ['3d-3dprint'] },
      { id: '3d-asd-map', title: 'ASD 3D Map', position: { x: 50, y: 50 }, status: 'locked', unlockRequires: ['3d-earthship'] },
      { id: '3d-expo', title: 'Expo 4020 Dubai UAE', position: { x: 20, y: 42 }, status: 'locked', unlockRequires: ['3d-earthship'] },
      { id: '3d-home', title: 'Home Designer', position: { x: 50, y: 35 }, status: 'locked', unlockRequires: ['3d-asd-map'] },
      { id: '3d-park', title: 'Park of Tomorrow', position: { x: 30, y: 25 }, status: 'locked', unlockRequires: ['3d-expo'] },
    ],
  },
  {
    id: 'cs-ai-specialist',
    slug: 'cs-ai-specialist',
    title: 'CS/AI Specialist',
    subtitle: 'Welcome to the Universe of Computer Science and Artificial Intelligence',
    description:
      "This core pathway is designed to develop your skills as a Computer Programmer or AI Specialist. You'll engage in hands-on projects and receive expert guidance to master essential programming languages, AI Literacy, Digital Citizenship, software/App development, and problem-solving techniques.",
    icon: '🤖',
    accentColor: '#a78bfa',
    backgroundTheme: 'from-indigo-900/40 via-purple-900/20 to-transparent',
    nodes: [
      { id: 'cs-intro', title: 'Intro to CS/AI', position: { x: 55, y: 90 }, status: 'unlocked' },
      { id: 'cs-prompt', title: 'AI Prompt Engineering', position: { x: 25, y: 78 }, status: 'locked', unlockRequires: ['cs-intro'] },
      { id: 'cs-digital-citizen', title: 'The Digital Citizen & The Age of Tech', position: { x: 28, y: 62 }, status: 'locked', unlockRequires: ['cs-prompt'] },
      { id: 'cs-codeorg', title: 'Code.org Express', position: { x: 55, y: 65 }, status: 'locked', unlockRequires: ['cs-intro'] },
      { id: 'cs-karel', title: 'CodeHS: Intro to Programming with Karel', position: { x: 68, y: 55 }, status: 'locked', unlockRequires: ['cs-codeorg'] },
      { id: 'cs-webdev', title: 'Web Dev', position: { x: 42, y: 50 }, status: 'locked', unlockRequires: ['cs-digital-citizen', 'cs-codeorg'] },
      { id: 'cs-python', title: 'CodeHS: Intro to Python with Tracy', position: { x: 62, y: 40 }, status: 'locked', unlockRequires: ['cs-karel'] },
      { id: 'cs-coming-soon', title: 'Coming Soon', position: { x: 20, y: 42 }, status: 'locked', comingSoon: true, unlockRequires: ['cs-digital-citizen'] },
    ],
  },
  {
    id: 'sound-designer',
    slug: 'sound-designer',
    title: 'Sound Designer',
    subtitle: 'Welcome to the Universe of Sound Design',
    description:
      "This core pathway focuses on crafting immersive auditory experiences. Through hands-on projects and expert guidance, you'll learn the art of designing soundscapes, mastering audio tools, music production and enhancing storytelling with sound.",
    icon: '🎧',
    accentColor: '#f472b6',
    backgroundTheme: 'from-rose-900/40 via-purple-900/20 to-transparent',
    nodes: [
      { id: 'sd-intro', title: 'Intro to Sound Design', position: { x: 55, y: 90 }, status: 'unlocked' },
      { id: 'sd-music', title: 'Music Production', position: { x: 30, y: 78 }, status: 'locked', unlockRequires: ['sd-intro'] },
      { id: 'sd-songwriting', title: 'Song Writing & Composition', position: { x: 25, y: 62 }, status: 'locked', unlockRequires: ['sd-music'] },
      { id: 'sd-cover', title: 'Cover Song', position: { x: 18, y: 48 }, status: 'locked', unlockRequires: ['sd-songwriting'] },
      { id: 'sd-fl-studio', title: 'FL Studio', position: { x: 22, y: 32 }, status: 'locked', unlockRequires: ['sd-cover'] },
      { id: 'sd-challenge', title: 'Sound Design Challenge', position: { x: 48, y: 50 }, status: 'locked', unlockRequires: ['sd-songwriting'] },
      { id: 'sd-podcasting', title: 'Podcasting', position: { x: 70, y: 50 }, status: 'locked', unlockRequires: ['sd-intro'] },
    ],
  },
  {
    id: 'game-designer',
    slug: 'game-designer',
    title: 'Game Designer',
    subtitle: 'Welcome to the Universe of Game Design',
    description:
      "Upon entering this world, you'll begin a quest to discover the secrets of game design. Explore creative platforms like Scratch, MakeCode, Unity, Unreal Engine, and Godot. Experiment with Gimkit Creative, create interactions in CoSpaces EDU, and enhance your skills with tools like Buildbox.",
    icon: '🎮',
    accentColor: '#34d399',
    backgroundTheme: 'from-emerald-900/40 via-teal-900/20 to-transparent',
    nodes: [
      { id: 'gd-intro', title: 'Intro to Game Design', position: { x: 55, y: 90 }, status: 'unlocked' },
      { id: 'gd-gamedev', title: 'Game Dev', position: { x: 35, y: 78 }, status: 'locked', unlockRequires: ['gd-intro'] },
      { id: 'gd-scratch', title: 'Scratch', position: { x: 22, y: 62 }, status: 'locked', unlockRequires: ['gd-gamedev'] },
      { id: 'gd-makecode', title: 'MakeCode Arcade', position: { x: 18, y: 48 }, status: 'locked', unlockRequires: ['gd-scratch'] },
      { id: 'gd-godot', title: 'Godot', position: { x: 20, y: 32 }, status: 'locked', unlockRequires: ['gd-makecode'] },
      { id: 'gd-unity', title: 'Unity', position: { x: 42, y: 48 }, status: 'locked', unlockRequires: ['gd-scratch'] },
      { id: 'gd-unreal', title: 'Unreal Engine', position: { x: 50, y: 35 }, status: 'locked', comingSoon: true, unlockRequires: ['gd-unity'] },
      { id: 'gd-gimkit', title: 'Gimkit Creative', position: { x: 68, y: 48 }, status: 'locked', unlockRequires: ['gd-intro'] },
      { id: 'gd-beta', title: 'Beta Testers Network', position: { x: 68, y: 62 }, status: 'locked', unlockRequires: ['gd-gimkit'] },
      { id: 'gd-project-bac', title: 'Project BAC', position: { x: 72, y: 35 }, status: 'locked', unlockRequires: ['gd-beta'] },
    ],
  },
];
