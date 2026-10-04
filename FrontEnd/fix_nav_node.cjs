const fs = require('fs');
const file = 'k:/Kuldeep/Odoo FInale/TheChampionsClub/FrontEnd/src/components/layout/Navbar.tsx';
let content = fs.readFileSync(file, 'utf8');

// Change header to full width
content = content.replace(
  /className="fixed top-3\.5 sm:top-5 left-1\/2 -translate-x-1\/2 z-50 w-\[96%\] max-w-\[1360px\]"/g,
  'className="fixed top-0 left-0 right-0 z-50 w-full"'
);

// Remove rounded-full and shadow from nav, make it standard border-b
content = content.replace(
  /'flex items-center justify-between rounded-full px-4 sm:px-6 py-2\.5 sm:py-3 transition-colors duration-200 border shadow-lg select-none',/g,
  `'flex items-center justify-between px-4 sm:px-8 py-3 transition-colors duration-200 border-b shadow-sm select-none',`
);

content = content.replace(
  /\? 'bg-\[#0D0D12\]\/95 border-white\/15 shadow-\[0_16px_40px_rgba\(0,0,0,0\.85\)\] backdrop-blur-xl'/g,
  `? 'bg-[#0D0D12]/95 border-white/15 backdrop-blur-xl'`
);

content = content.replace(
  /: 'bg-\[#FCFBF9\]\/95 border-black\/10 shadow-\[0_12px_32px_rgba\(0,0,0,0\.08\)\] backdrop-blur-xl'/g,
  `: 'bg-[#FCFBF9]/95 border-black/10 backdrop-blur-xl'`
);

fs.writeFileSync(file, content);
console.log('Fixed Navbar to full width');
