const mysql = require('mysql2');
const fs = require('fs');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'mycard',
    password: 'mycard_password',
    database: 'mycard',
    port: 3306,
    multipleStatements: true
});

connection.connect(err => {
    if (err) throw err;

    const sql = fs.readFileSync('src/main/resources/db/migration/V27__add_bank_account_transactions.sql', 'utf8');
    console.log('Running SQL...');

    connection.query(sql, (err, results) => {
        if (err) {
            console.error('SQL Error details:');
            console.error('Message:', err.message);
            console.error('Code:', err.code);
            console.error('Error No:', err.errno);
            console.error('SQL State:', err.sqlState);
            console.error('SQL:', err.sql);
        } else {
            console.log('Success!', results);
        }
        connection.end();
    });
});
