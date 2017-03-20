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

const AppUser = bookshelf.Model.extend({
  tableName: 'app_users'
});

const ERR_NO_RECORDS = new Error();

module.exports = {
  ERR_NO_RECORDS: ERR_NO_RECORDS,
  fetchAppUserByLogin: function (app_id, login) {

    let q = {limit: 1};
    
    q.where = { app_id: app_id, username: login };

    if (/@/.test(login)) {
      delete q.where.username;
      q.where.email_address = login;
    }

    return new Promise((resolve, reject) => {
      AppUser
        .query(q)
        .fetch()
        .then((appUser) => {

          if (null === appUser) {
            reject(ERR_NO_RECORDS);
            return;
          }

          resolve(appUser);

        });
    });

  },
};
