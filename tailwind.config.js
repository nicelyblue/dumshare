/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#182743',
        shell: '#f3f8ff',
        shellSoft: '#eef4ff',
        panel: '#ffffff',
        border: '#d8e3f6',
        muted: '#5a6883',
        accentA: '#00a7a0',
        accentADeep: '#007f7a',
        accentB: '#5f6fff',
        accentC: '#8b5cf6',
        success: '#0f9f6e',
        warning: '#dd7b2f',
        danger: '#d74d66',
      },
      borderRadius: {
        card: '24px',
        field: '16px',
      },
      boxShadow: {
        lift: '0 10px 26px rgba(40, 76, 145, 0.16)',
        soft: '0 6px 16px rgba(40, 76, 145, 0.1)',
      },
      spacing: {
        4.5: '18px',
      },
    },
  },
  presets: [require('nativewind/preset')],
};
