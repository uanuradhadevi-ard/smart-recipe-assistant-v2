/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fdf8f5',
          100: '#f9f0e9',
          200: '#f3e4d5',
          300: '#EAE7DC',
          400: '#e0d5c5',
          500: '#D8C3A5',
          600: '#c9ad8a',
          700: '#b8956d',
          800: '#9a7c59',
          900: '#7d6449',
        },
        accent: {
          50: '#fef4f3',
          100: '#fde8e6',
          200: '#fbd1cd',
          300: '#f8b5ae',
          400: '#f59088',
          500: '#E98074',
          600: '#E85A4F',
          700: '#d94237',
          800: '#b83830',
          900: '#9a302b',
        },
        neutral: {
          50: '#f7f7f7',
          100: '#efefef',
          200: '#dcdcdc',
          300: '#bdbdbd',
          400: '#9e9e9e',
          500: '#8E8D8A',
          600: '#757575',
          700: '#616161',
          800: '#424242',
          900: '#2c2c2c',
        },
      },
    },
  },
  plugins: [],
};
