module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji'],
      },
      whitespace: {
        'break-spaces': 'break-spaces',
      },
      maxHeight: {
        '800px': '800px',
        '500px': '500px',
        '50px' : '50px'

      },
      
      minHeight: {
        '60vh': '60vh',
      },
      minWidth: {
        '1/4': '25%',
        '1/2': '50%',
        '3/4': '75%',
        '300': '300px',
        '400': '400px',
        '500': '500px',
      },
      inset: {
        '30': '30px',
        '25': '25px',
      },
      width: {
        'fit': 'fit-content',
      },
      colors: {
        customYellow: 'rgb(246, 255, 127)',
      }
    },
  },
  plugins: [],
}