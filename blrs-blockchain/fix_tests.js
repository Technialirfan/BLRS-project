const fs = require('fs');
const files = ['test/LandRegistry.test.js', 'test/Integration.test.js', 'test/DisputeResolution.test.js'];

files.forEach(f => {
  if (!fs.existsSync(f)) return;
  let code = fs.readFileSync(f, 'utf8');
  code = code.replace(/67008900\s*\)/g, "67008900, 'mockGeoJson', 'mockGis')");
  fs.writeFileSync(f, code);
  console.log('Fixed', f);
});
