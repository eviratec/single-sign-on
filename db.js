'use strict';

const knex = require('knex')({  
  client: 'mysql',
  connection: {
    socketPath: '/run/mysqld/mysqld.sock',
    user: process.env.EV_MYSQL_USER,
    password: process.env.EV_MYSQL_PASS,
    database: process.env.EV_MYSQL_DB,
  }
});

const bookshelf = require('bookshelf')(knex);

const User = bookshelf.Model.extend({
  
  tableName: 'users',

});

const ERR_NO_RECORDS = new Error();

module.exports = {
  ERR_NO_RECORDS: ERR_NO_RECORDS,
  fetchUserByLogin: function (login) {

    let q = { limit: 1 };
    
    q.where = { username: login.toLowerCase() };

    return new Promise((resolve, reject) => {
      User
        .query(q)
        .fetch()
        .then((user) => {

          if (null === user) {
            reject(ERR_NO_RECORDS);
            return;
          }

          resolve(user);

        });
    });

  },
};
