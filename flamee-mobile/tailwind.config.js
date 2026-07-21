/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './shared/**/*.{js,jsx,ts,tsx}',
    './features/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        flamee: {
          coral: '#FF7158',
          red: '#FF0000',
          cream: '#FFF1E4',
          softCream: '#FFE6CE',
          ink: '#000000',
          muted: '#555555',
          success: '#0FBB5D',
        },
      },
      borderRadius: {
        flamee: '20px',
      },
    },
  },
  plugins: [],
}
