/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#3a7d44',
          greenLight: '#6db57a',
          greenPale: '#e8f5eb',
          greenDark: '#1a2e1c',
          bg: '#f7faf7',
        },
        blue: {
          DEFAULT: '#0092CF',
          light: '#e6f6fd',
        },
        green: {
          DEFAULT: '#17b060',
          light: '#e6f7ee',
          hover: '#149e56',
        },
        dark: {
          DEFAULT: '#231F20',
          80: 'rgba(35,31,32,0.82)',
        },
        mid: '#f4f4f2',
        text: {
          DEFAULT: '#2b2728',
          muted: '#6b6667',
        },
        border: '#e0dedc',
      },
      fontFamily: {
        serif: ['"DM Serif Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
        body: ['"Inter"', 'sans-serif'],
      },
      maxWidth: {
        container: '1200px',
      },
    },
  },
  plugins: [],
};
