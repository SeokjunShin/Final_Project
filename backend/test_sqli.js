const http = require('http');

let loginData = JSON.stringify({ username: "testuser", password: "password123" });
let loginOptions = {
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(loginData)
    }
};

let loginReq = http.request(loginOptions, loginRes => {
    let loginBody = '';
    loginRes.on('data', d => loginBody += d);
    loginRes.on('end', () => {
        console.log("LOGIN RESPONSE: " + loginBody);
        const resData = JSON.parse(loginBody);
        const token = resData.data.accessToken;
        console.log("Token: " + token);

        http.get('http://localhost:8080/api/board?keyword=1%27%20OR%201%3D1%20--', {
            headers: { 'Authorization': 'Bearer ' + token }
        }, boardRes => {
            let boardBody = '';
            boardRes.on('data', d => boardBody += d);
            boardRes.on('end', () => console.log("Board:", boardBody));
        });
    });
});
loginReq.write(loginData);
loginReq.end();
