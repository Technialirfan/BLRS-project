const http = require('http');

function checkService(name, url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      console.log(`✅ ${name} is running at ${url} (Status: ${res.statusCode})`);
      resolve(true);
    }).on('error', (e) => {
      console.log(`❌ ${name} is NOT running at ${url} (${e.message})`);
      resolve(false);
    });
    req.setTimeout(2000, () => {
      req.abort();
      console.log(`❌ ${name} timed out at ${url}`);
      resolve(false);
    });
  });
}

async function main() {
  await checkService('Blockchain Node', 'http://127.0.0.1:8545');
  await checkService('Backend API', 'http://127.0.0.1:5000/api/health');
  await checkService('Frontend UI', 'http://127.0.0.1:5173');
}

main();
