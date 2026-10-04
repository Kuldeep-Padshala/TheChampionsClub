const fs = require('fs');
const file = 'k:/Kuldeep/Odoo FInale/TheChampionsClub/FrontEnd/src/pages/ReceptionistPage.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("websocketService.on('court_slot_change'")) {
  const useEffectTarget = "useEffect(() => {\n    loadData();\n  }, [loadData]);";
  const replacement = `useEffect(() => {
    loadData();

    const unsubCourt = websocketService.on('court_slot_change', () => {
      loadData();
    });
    return () => {
      unsubCourt();
    };
  }, [loadData]);`;

  if (content.includes(useEffectTarget)) {
    content = content.replace(useEffectTarget, replacement);
    fs.writeFileSync(file, content);
    console.log('Fixed ReceptionistPage websocket');
  } else {
    console.log('Could not find loadData useEffect');
  }
} else {
  console.log('Already listening to websocket');
}
