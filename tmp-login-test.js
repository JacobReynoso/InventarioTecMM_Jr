const fetch = global.fetch || require('node-fetch');
(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@instituto.edu', password: 'admin123' }),
    });
    const text = await res.text();
    console.log('status', res.status);
    console.log('body', text);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
