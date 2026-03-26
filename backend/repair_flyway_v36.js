const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || 'mycard',
    password: process.env.DB_PASSWORD || 'mycard_password',
    database: process.env.DB_NAME || 'mycard',
    port: Number(process.env.DB_PORT || 3306)
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }

    console.log('Connected to MySQL.');

    connection.query(
        "DELETE FROM flyway_schema_history WHERE version = '36' AND success = 0",
        (deleteErr, results) => {
            if (deleteErr) {
                console.error('Error deleting failed V36 history:', deleteErr);
                connection.end();
                process.exit(1);
                return;
            }

            console.log('Deleted failed V36 history rows:', results.affectedRows);
            connection.end();
        }
    );
});
