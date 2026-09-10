/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ctiks: {
          cream:  '#fff7ed', // page ground
          sand:   '#ffe8c8', // nav band, announcement cards
          gold:   '#ffcb65', // hero devanagari, accent band
          rule:   '#f9c531', // footer top rule
          red:    '#aa1313', // primary
          maroon: '#820d0d', // masthead title
          clay:   '#a88f6e', // hero base beneath the photograph
        },
      },
      fontFamily: {
        display: ['"Red Rose"', 'serif'],            // masthead, section titles
        body:    ['Montserrat', 'sans-serif'],       // nav, copy, buttons
        deva:    ['Laila', 'serif'],                 // ज्ञानमयं तपः
        motto:   ['Cormorant', 'Georgia', 'serif'],  // hero subtitle
        link:    ['"Open Sans"', 'sans-serif'],      // footer links
      },
      maxWidth: {
        masthead: '1320px',
        shell:    '1326px',
        footer:   '1140px',
      },
    },
  },
  plugins: [],
};
