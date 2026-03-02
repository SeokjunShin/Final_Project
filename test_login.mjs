fetch("http://localhost:8080/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "user1@mycard.local", password: "MyCard!234" })
}).then(async r => {
    console.log('Status:', r.status);
    console.log('Response:', await r.text());
}).catch(console.error);
