const fs = require('fs');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = dir + '/' + file;
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('k:/Kuldeep/Odoo FInale/TheChampionsClub/FrontEnd/src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace .map( with ?.map(
  const mapRegex = /(\w+|\]|\))\s*\.\s*map\s*\(/g;
  content = content.replace(mapRegex, (match, p1) => {
    changed = true;
    return `${p1}?.map(`;
  });

  if (changed) {
    fs.writeFileSync(file, content);
  }
});
console.log('Fixed maps');
