const bcrypt = require('bcryptjs');

const hash = '$2a$12$PqcXBVTaFDti5bPDa2k5IOxs0zN9cUTeoN9ZxFocsXmyIaWgx0Yvu'; // user1
const pwd = 'MyCard!234';

console.log('Match:', bcrypt.compareSync(pwd, hash));
