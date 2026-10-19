/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{js,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ctiks: {
          cream:  '#fff7ed', // page ground
          sand:   '#ffe8c8', // nav band, announcement cards
          gold:   '#ffcb65', // hero devanagari, accent band
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
      },
      maxWidth: {
        masthead: '1320px',
        shell:    '1326px',
      },
    },
  },
  plugins: [],
};

export default config;
