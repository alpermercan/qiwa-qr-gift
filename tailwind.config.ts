import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    'node_modules/preline/dist/*.js',
  ],
  theme: {
    extend: {
      colors: {
        qiwa: {
          primary: '#2B5E0F',      // Koyu yeşil (ana renk)
          secondary: '#1E4109',    // Daha koyu yeşil (hover için)
          accent: '#3A7A15',       // Parlak yeşil (vurgu için)
          light: '#F0F7E6',        // Açık yeşil (arka plan)
          hover: '#234D0C',        // Hover için koyu ton
          ghost: '#E6F0D6',        // Ghost buton arka planı
        },
      },
    },
  },
  plugins: [
    require('preline/plugin'),
  ],
}
export default config 