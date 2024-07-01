module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: false,
  theme: {
    extend: {
      fontFamily: {
        'pretendard': ['Pretendard', 'sans-serif'],
      },      
      whitespace: {
        'break-spaces': 'break-spaces',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}

