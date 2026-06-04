import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        anton:  ['Anton', 'sans-serif'],
        bebas:  ['Bebas Neue', 'sans-serif'],
        raj:    ['Rajdhani', 'sans-serif'],
      },
      colors: {
        bg:       '#080c10',
        surface:  '#0d1318',
        surface2: '#121a22',
        border:   '#1e2d3d',
        gold:     '#f0c040',
        glred:    '#d42020',
        glgreen:  '#20c060',
        palm:     '#10a050',
      },
    },
  },
  plugins: [],
} satisfies Config
