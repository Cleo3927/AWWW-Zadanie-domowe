import express from 'express';

import session from 'express-session';
import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';

import { Op } from 'sequelize';
import { get_db_postgres, get_db_sqlite } from './database/database.mjs';
import { add_trips } from './database/init_db.mjs';
import console from 'console';
import { addConsoleHandler } from 'selenium-webdriver/lib/logging.js';

export function start_server(db) {

   const app = express();
   const port = 2000
   const salt = bcrypt.genSaltSync(8);

   async function get_all_trips() {

      const result = await db.Wycieczki.findAll({
         attributes: ['id', 'tytul', 'miejsca', 'zdjecie', 'opis', 'cena'],
         order: ['id']
      });

      let res = [];
      for (let i = 0; i < result.length; i++) {
         res.push({
            id: result[i].id,
            tytul: result[i].tytul,
            miejsca: result[i].miejsca,
            zdjecie: result[i].zdjecie,
            opis: result[i].opis,
            cena: result[i].cena
         });
      }

      return res;
   }

   async function get_user_trips(email) {
      const result = await db.Zgloszenia.findAll({
         attributes: ['imie', 'nazwisko', 'ilosc', 'id_wycieczki'],
         where: { email: email },
         order: ['id_wycieczki'],
      });
      const res = [];
      const wyc = await get_all_trips();

      for (let i = 0; i < result.length; i++) {
         let tytul = wyc[result[i].id_wycieczki].tytul;
         res.push({
            imie: result[i].imie,
            nazwisko: result[i].nazwisko,
            ilosc: result[i].ilosc,
            tytul: tytul
         });
      }
      return res;
   }

   app.set('view engine', 'pug');
   app.set('views', './views');
   app.use(express.static('.'))

   app.use(session({
      secret: 'keyboard cat',
      resave: false,
      saveUninitialized: true
   }))

   app.get('/', function (req, res) {
      async function rend() {
         res.render('main', { id: 0, location: req.url, wycieczki: await get_all_trips() });
      }
      rend();
   });

   app.get('/trip/:id', function (req, res) {
      async function rend() {
         res.render('trip', { id: req.params.id, location: req.url, wycieczki: await get_all_trips(), komunikat: false });
      }
      rend();
   });

   app.get('/book/:id', function (req, res) {
      async function rend() {
         res.render('book', { id: req.params.id, location: req.url, wycieczki: await get_all_trips(), komunikat: '' });
      }
      rend();
   });

   app.get('/register/', function (req, res) {
      async function rend() {
         res.render('register', { location: req.url, wycieczki: await get_all_trips(), komunikat: '' });
      }
      rend();
   });

   app.get('/login/', function (req, res) {
      async function rend() {
         res.render('login', { location: req.url, wycieczki: await get_all_trips(), komunikat: '' });
      }
      rend();
   });

   app.get('/mainuser/', function (req, res) {
      async function rend() {
         if (req.session.email != null && req.session.email != undefined)
            res.render('mainuser', { location: req.url, wycieczki: await get_user_trips(req.session.email) });
         else
            res.render('mainuser', { location: req.url, wycieczki: [] });
      }
      rend();
   });


   app.get('/logout/', function (req, res) {
      async function rend() {
         res.render('logout', { location: req.url, wycieczki: await get_all_trips(), komunikat: '' });
      }
      rend();
   });

   var urlencodedParser = bodyParser.urlencoded({ extended: false })
   app.use(bodyParser.json())

   app.post('/book/:id', urlencodedParser, function (req, res) {
      let imie = req.body.first_name;
      let nazwisko = req.body.last_name;
      let telefon = req.body.phone;
      let email = req.body.email;
      let ilosc = req.body.n_people;
      let id = req.body.id;

      if (req.session.email == null) {
         async function rend() {
            res.render('book', { id: id, location: req.url, wycieczki: await get_all_trips(), komunikat: 'Zaloguj się' });
         }
         rend();

      } else {

         async function dodawanie() {
            let transaction = await db.sequelize.transaction();
            try {
               const ile = await db.Wycieczki.count({
                  where: {
                     miejsca: { [Op.gte]: parseInt(ilosc) },
                     id: { [Op.eq]: id }
                  }
               }, { transaction: transaction });

               if (ile > 0) {
                  await db.Wycieczki.decrement({
                     miejsca: parseInt(ilosc)
                  }, {
                     where: { id: id }
                  }, { transaction: transaction });

                  await db.Zgloszenia.create({
                     imie: imie,
                     nazwisko: nazwisko,
                     telefon: telefon,
                     email: email,
                     ilosc: ilosc,
                     id_wycieczki: id
                  }, { transaction: transaction });


                  await transaction.commit();
                  res.redirect('/trip/' + id);

               } else {

                  await transaction.rollback();
                  res.render('book', { id: id, location: req.url, wycieczki: await get_all_trips(), komunikat: 'Brak miejsc' });

               }
            }
            catch (e) {
               if (transaction) {
                  await transaction.rollback();
               }
               res.render('book', { id: id, location: req.url, wycieczki: await get_all_trips(), komunikat: 'Blad bazy danych' });
            }
         }

         dodawanie();
      }
   });

   app.post('/register/', urlencodedParser, function (req, res) {
      let imie = req.body.first_name;
      let nazwisko = req.body.last_name;
      let email = req.body.email;
      let haslo = req.body.pass;
      let potwierdzenie = req.body.confpass;

      if (haslo != potwierdzenie) {
         async function rend() {
            res.render('register', { location: req.url, wycieczki: await get_all_trips(), komunikat: 'Hasła nie są identyczne' });
         }
         rend();
         return;
      }
      const hash = bcrypt.hashSync(haslo, salt);

      async function dodawanie() {
         let transaction = await db.sequelize.transaction();
         try {
            await db.User.create({
               imie: imie,
               nazwisko: nazwisko,
               email: email,
               haslo: hash
            }, { transaction: transaction });

            await transaction.commit();
            res.render('register', { location: req.url, wycieczki: await get_all_trips(), komunikat: "Udało się zarejestrować" });
         }
         catch (e) {
            if (transaction) {
               await transaction.rollback();
            }
            res.render('register', { location: req.url, wycieczki: await get_all_trips(), komunikat: 'Taki mail już jest zarejestrowany' });
         }
      }

      dodawanie();
   });

   app.post('/login/', urlencodedParser, async function (req, res) {
      let email = req.body.email;
      let haslo = req.body.pass;

      async function dodawanie() {
         try {
            const user = await db.User.findAll({
               where: {
                  email: { [Op.eq]: email }
               }
            });

            if (user.length == 0) { // zly email
               res.render('login', { location: req.url, wycieczki: await get_user_trips(email), komunikat: "Błąd logowania" });
               return 0;
            }

            let rownosc = bcrypt.compareSync(haslo, user[0].haslo);

            if (rownosc) { // dobre haslo
               return 1;
            } else {
               res.render('login', { location: req.url, wycieczki: await get_user_trips(email), komunikat: "Błąd logowania" });
               return 0;
            }
         }
         catch (e) {
            res.render('login', { location: req.url, wycieczki: await get_user_trips(email), komunikat: 'Błąd logowania' });
            return 0;
         }
      }

      let wynik = await dodawanie();
      if (wynik == 0)
         return;

      req.session.regenerate(function (err) {
         if (err) next(err)

         req.session.email = req.body.email;

         req.session.save(function (err) {
            if (err) next(err)

            res.redirect('/mainuser/')
         })
      })
   });

   app.post('/logout/', urlencodedParser, function (req, res, next) {
      req.session.email = null
      req.session.save(function (err) {
         if (err) next(err)

         req.session.regenerate(function (err) {
            if (err) next(err)

            res.redirect('/');
         })
      })
   });

   return app.listen(port, () => {
      console.log("RUNNING");
   });

};

// const db = await get_db_sqlite();
// console.log(db);
// add_trips(db);
// start_server(db);