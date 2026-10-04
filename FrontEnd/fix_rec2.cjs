const fs = require('fs');
const file = 'k:/Kuldeep/Odoo FInale/TheChampionsClub/FrontEnd/src/pages/ReceptionistPage.tsx';
let content = fs.readFileSync(file, 'utf8');

const wsImport = "import { websocketService } from '../services/websocketService';\n";
if (!content.includes(wsImport)) {
  content = content.replace("import toast from 'react-hot-toast';", "import toast from 'react-hot-toast';\n" + wsImport);
}

const wsEffect = `
  // ⚡ Live WebSocket synchronization for calendar and incoming changes
  useEffect(() => {
    const unsubCourt = websocketService.on('court_slot_change', () => {
      if (activeTab === 'calendar') loadCalendarData();
    });
    const unsubNotif = websocketService.on('notification', () => {
      // Reload relevant badge counters or enquiries
      loadEnquiriesData();
    });
    return () => {
      unsubCourt();
      unsubNotif();
    };
  }, [activeTab]);
`;

if (!content.includes("websocketService.on('court_slot_change'")) {
  const insertIndex = content.indexOf("const loadCalendarData = async () =>");
  content = content.substring(0, insertIndex) + wsEffect + "\n  " + content.substring(insertIndex);
  fs.writeFileSync(file, content);
  console.log('Fixed ReceptionistPage websocket');
} else {
  console.log('Already listening to websocket');
}
