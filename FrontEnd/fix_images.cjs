const fs = require('fs');
const file = 'k:/Kuldeep/Odoo FInale/TheChampionsClub/FrontEnd/src/pages/MemberPortalPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /src=\{([a-zA-Z\.]+)\.image_url\s*\|\|\s*'([^']+)'\}/g;
let count = 0;
content = content.replace(regex, (match, p1, p2) => {
  count++;
  return `src={${p1}.image_url ? (${p1}.image_url.startsWith('http') ? ${p1}.image_url : (import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000') + (${p1}.image_url.startsWith('/') ? '' : '/') + ${p1}.image_url) : '${p2}'}`;
});

fs.writeFileSync(file, content);
console.log('Fixed ' + count + ' image URLs');
