import React from 'react';

// Beatrix Potter classic watercolor storybook assets
import coverImg from '../assets/images/storybook_cover_squirrel_1791399778393.jpg';
import page1Img from '../assets/images/storybook_p1_empty_stump_1791399790707.jpg';
import page2Img from '../assets/images/storybook_p2_robin_oak_tree_1791399803124.jpg';
import page3Img from '../assets/images/storybook_p3_robin_pond_1791399813024.jpg';
import page4Img from '../assets/images/storybook_p4_rabbit_mushroom_1791399823764.jpg';
import page5Img from '../assets/images/storybook_p5_rain_hollow_tree_1791399835267.jpg';
import page6Img from '../assets/images/storybook_p6_mouse_shiny_acorn_1791399846010.jpg';
import page7Img from '../assets/images/storybook_p7_pip_and_mia_1791399858692.jpg';
import page8Img from '../assets/images/storybook_p8_picnic_sharing_1791399869572.jpg';

interface IllustrationProps {
  scene: string;
  className?: string;
  altText?: string;
}

const SCENE_IMAGE_MAP: Record<string, { src: string; alt: string }> = {
  cover: {
    src: coverImg,
    alt: 'Pip the detective squirrel with an acorn in the Mystery Forest, classic Beatrix Potter watercolor illustration',
  },
  scene_page_1: {
    src: page1Img,
    alt: 'Pip looking at an empty tree stump with tiny footprints on the woodland floor',
  },
  scene_page_2: {
    src: page2Img,
    alt: 'Pip talking to Robin the bird perched on a tall English oak tree branch',
  },
  scene_page_3: {
    src: page3Img,
    alt: 'Robin the bird pointing towards the serene blue pond',
  },
  scene_page_4: {
    src: page4Img,
    alt: 'Pip meeting Ben the fluffy wild rabbit near the pond and mushrooms',
  },
  scene_page_5: {
    src: page5Img,
    alt: 'Soft gentle raindrops falling on footprints leading into an ancient hollow tree',
  },
  scene_page_6: {
    src: page6Img,
    alt: 'Inside the cozy tree hollow, a big shiny acorn and tiny shy mouse Mia',
  },
  scene_page_7: {
    src: page7Img,
    alt: 'Pip smiling warmly at little mouse Mia sheltering from the rain',
  },
  scene_page_8: {
    src: page8Img,
    alt: 'Pip and Mia happily sharing acorn slices on a picnic blanket under gentle sunshine',
  },
};

export const StoryIllustration: React.FC<IllustrationProps> = ({
  scene,
  className = 'w-full h-auto',
  altText,
}) => {
  const item = SCENE_IMAGE_MAP[scene];

  if (!item) {
    return (
      <div className="w-full h-48 bg-amber-50/80 rounded-2xl flex items-center justify-center text-amber-800 text-sm font-serif">
        Mystery Forest Storybook
      </div>
    );
  }

  return (
    <div className="relative w-full rounded-2xl overflow-hidden shadow-xs border border-amber-200/60 bg-amber-50/40">
      <img
        src={item.src}
        alt={altText || item.alt}
        referrerPolicy="no-referrer"
        className={`${className} object-cover w-full max-h-60 sm:max-h-72 transition-transform duration-300 hover:scale-[1.01]`}
        loading="eager"
      />
      {/* Soft classic watercolor vignette border */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-amber-900/10 shadow-inner" />
    </div>
  );
};

export const ForestDetectiveBadgeSVG: React.FC<{ className?: string }> = ({
  className = 'w-36 h-40',
}) => {
  return (
    <svg viewBox="0 0 240 260" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Rich Gold Gradient */}
        <linearGradient id="gold_shield" x1="20" y1="10" x2="220" y2="250" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="25%" stopColor="#FACC15" />
          <stop offset="60%" stopColor="#EAB308" />
          <stop offset="85%" stopColor="#CA8A04" />
          <stop offset="100%" stopColor="#854D0E" />
        </linearGradient>

        {/* Shiny Inner Rim */}
        <linearGradient id="gold_inner" x1="40" y1="20" x2="200" y2="230" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFBEB" />
          <stop offset="30%" stopColor="#FEF08A" />
          <stop offset="70%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#A16207" />
        </linearGradient>

        {/* Medallion Core Gradient */}
        <radialGradient id="center_radial" cx="50%" cy="45%" r="50%">
          <stop offset="0%" stopColor="#FEF9C3" />
          <stop offset="55%" stopColor="#FDE047" />
          <stop offset="85%" stopColor="#CA8A04" />
          <stop offset="100%" stopColor="#78350F" />
        </radialGradient>

        {/* Ribbon Gradient */}
        <linearGradient id="ribbon_grad" x1="20" y1="170" x2="220" y2="220" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="20%" stopColor="#FBBF24" />
          <stop offset="50%" stopColor="#F59E0B" />
          <stop offset="80%" stopColor="#D97706" />
          <stop offset="100%" stopColor="#92400E" />
        </linearGradient>

        {/* Drop Shadow filter */}
        <filter id="badge_shadow" x="-10%" y="-10%" width="125%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#78350F" floodOpacity="0.25" />
        </filter>
      </defs>

      <g filter="url(#badge_shadow)">
        {/* Outer Laurel Leaves / Sunburst Rays */}
        <g stroke="#CA8A04" strokeWidth="2.5" opacity="0.6">
          <circle cx="120" cy="110" r="82" strokeDasharray="4 6" fill="none" />
          <circle cx="120" cy="110" r="76" strokeDasharray="3 5" fill="none" />
        </g>

        {/* Main Golden Shield Contour */}
        <path
          d="M120 12 C150 12 182 28 206 24 C216 52 220 90 220 124 C220 178 180 222 120 248 C60 222 20 178 20 124 C20 90 24 52 34 24 C58 28 90 12 120 12 Z"
          fill="url(#gold_shield)"
          stroke="#78350F"
          strokeWidth="5"
          strokeLinejoin="round"
        />

        {/* Inner Engraved Shield */}
        <path
          d="M120 25 C146 25 174 38 194 35 C202 58 205 92 205 122 C205 168 171 206 120 230 C69 206 35 168 35 122 C35 92 38 58 46 35 C66 38 94 25 120 25 Z"
          fill="url(#gold_inner)"
          stroke="#92400E"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Delicate Oak Leaf Sprigs at top corners */}
        <g fill="#15803D" stroke="#166534" strokeWidth="1">
          {/* Left leaf */}
          <path d="M50 48 C42 42 42 34 50 32 C58 34 60 42 54 48 Z" />
          <path d="M56 46 C64 42 70 46 68 54 C60 56 54 52 56 46 Z" />
          {/* Right leaf */}
          <path d="M190 48 C198 42 198 34 190 32 C182 34 180 42 186 48 Z" />
          <path d="M184 46 C176 42 170 46 172 54 C180 56 186 52 184 46 Z" />
        </g>

        {/* Center Circular Medallion with Raised 3D Rim */}
        <circle cx="120" cy="108" r="54" fill="#B45309" stroke="#78350F" strokeWidth="4" />
        <circle cx="120" cy="108" r="50" fill="url(#center_radial)" stroke="#FEF08A" strokeWidth="2.5" />
        <circle cx="120" cy="108" r="44" stroke="#A16207" strokeWidth="1.5" strokeDasharray="3 3" fill="none" opacity="0.8" />

        {/* Central Detective Emblem: Acorn + Magnifying Glass + Detective Star */}
        <g transform="translate(120, 108)">
          {/* 7-Point Starburst background */}
          <polygon
            points="0,-36 9,-16 28,-22 20,-3 36,12 16,18 16,37 -1,26 -17,37 -16,18 -36,12 -20,-3 -28,-22 -9,-16"
            fill="#FEF08A"
            stroke="#CA8A04"
            strokeWidth="2"
            opacity="0.9"
          />

          {/* Acorn Cupule (Cap) */}
          <path
            d="M-18 -8 C-18 -22 18 -22 18 -8 C18 -5 -18 -5 -18 -8 Z"
            fill="#78350F"
            stroke="#451A03"
            strokeWidth="2.5"
          />
          {/* Acorn Stem */}
          <path d="M0 -20 C2 -26 6 -28 9 -27" stroke="#451A03" strokeWidth="3" strokeLinecap="round" fill="none" />
          {/* Cap cross hatch texture */}
          <path d="M-12 -12 L12 -12 M-14 -16 L14 -16" stroke="#A16207" strokeWidth="1.5" strokeLinecap="round" />

          {/* Acorn Nut Body */}
          <path
            d="M-17 -6 C-17 18 -6 28 0 32 C6 28 17 18 17 -6 Z"
            fill="#B45309"
            stroke="#451A03"
            strokeWidth="2.5"
          />
          {/* Acorn Shiny Highlight */}
          <path
            d="M-10 0 C-10 14 -4 20 0 24 C-3 18 -6 10 -6 0 Z"
            fill="#FDE047"
            opacity="0.6"
          />

          {/* Detective Magnifying Glass Ring across Acorn */}
          <circle cx="2" cy="4" r="16" fill="none" stroke="#FDE047" strokeWidth="3" />
          <line x1="14" y1="16" x2="24" y2="26" stroke="#78350F" strokeWidth="4.5" strokeLinecap="round" />
          <line x1="14" y1="16" x2="24" y2="26" stroke="#FEF08A" strokeWidth="2.5" strokeLinecap="round" />

          {/* Sparkling Little Stars */}
          <polygon points="-24,-18 -22,-14 -18,-13 -21,-10 -20,-6 -24,-8 -27,-6 -26,-10 -29,-13 -25,-14" fill="#FEF9C3" />
          <polygon points="24,-18 26,-14 30,-13 27,-10 28,-6 24,-8 21,-6 22,-10 19,-13 23,-14" fill="#FEF9C3" />
        </g>

        {/* Elegant Curved Banner across bottom */}
        <path
          d="M26 176 C60 162 180 162 214 176 C218 196 208 214 196 224 C154 206 86 206 44 224 C32 214 22 196 26 176 Z"
          fill="url(#ribbon_grad)"
          stroke="#78350F"
          strokeWidth="4"
          strokeLinejoin="round"
        />

        {/* Ribbon Fold Edge Accents */}
        <path d="M44 224 L38 206 M196 224 L202 206" stroke="#78350F" strokeWidth="2.5" />

        {/* "FOREST DETECTIVE" Gold Embossed Lettering */}
        <text
          x="120"
          y="196"
          fontSize="13"
          fontWeight="900"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#451A03"
          textAnchor="middle"
          letterSpacing="2"
        >
          FOREST DETECTIVE
        </text>

        {/* Subtitle Under Ribbon */}
        <text
          x="120"
          y="207"
          fontSize="7.5"
          fontWeight="700"
          fontFamily="system-ui, -apple-system, sans-serif"
          fill="#78350F"
          textAnchor="middle"
          letterSpacing="1.2"
        >
          ★ OFFICIAL BADGE ★
        </text>
      </g>
    </svg>
  );
};
