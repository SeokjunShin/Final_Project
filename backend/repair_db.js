const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'mycard',
    password: 'mycard_password',
    database: 'mycard',
    port: 3306
});

connection.connect(err => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }

    console.log('Connected to MySQL.');

    connection.query(
        `DELETE FROM flyway_schema_history WHERE version = '27';`,
        (err, results) => {
            if (err) console.error('Error deleting from flyway_schema_history:', err);
            else console.log('Deleted V27 from flyway_schema_history:', results.affectedRows, 'rows');

            connection.query(
                `DROP TABLE IF EXISTS bank_account_transactions;`,
                (err, results) => {
                    if (err) console.error('Error dropping table:', err);
                    else console.log('Dropped table bank_account_transactions if existed.');

                    connection.end();
                }
            );
        }
    );
});
