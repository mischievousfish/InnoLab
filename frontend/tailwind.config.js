/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,html}'],
  theme: {
    extend: {
      colors: {
        harbor: '#1B2E35',
        cliff: '#536C78',
        driftwood: '#9AA5AD',
        coral: '#D36353',
        sailcloth: '#F4F1EA',
        rope: '#D0C2B6'
      },
      fontFamily: {
        ranoya: ['RanoyaRegular'],
        sans: ['RanoyaRegular'],
        serif: ['RanoyaRegular'],
        mono: ['RanoyaRegular']
      },
      borderRadius: {
        sm: '2px',
        md: '4px'
      }
    }
  },
  plugins: []
};
