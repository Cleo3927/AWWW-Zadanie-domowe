import { start_server } from "../app.mjs";
import { Builder, By, Capabilities } from "selenium-webdriver";
import firefox from 'selenium-webdriver/firefox.js';
import { get_db_sqlite } from '../database/database.mjs';
import { add_trip, add_book, add_user } from './db_tests_functions.mjs';
import { incorrect_trip, correct_trip } from './db_tests_functions.mjs';
import { incorrect_book, correct_book} from './db_tests_functions.mjs';
import { incorrect_user, correct_user} from './db_tests_functions.mjs';

describe("Testy backend", async () => {

    const TIMEOUT = 10000;
    const driver = new Builder().withCapabilities(Capabilities.firefox())
        .setFirefoxOptions(new firefox.Options().headless().windowSize({
          width: 1920,
          height: 1080,
        })).build();
    const website = 'http://localhost:2000';
    let db;
    let app;

    before(async function () {
        await driver
        .manage()
        .setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
        
        db = await get_db_sqlite();
        app = start_server(db);
    });

    it("testowanie poprawnosci walidacji w tabeli wycieczki", async function() {
        let wycieczka = {};
        // puste zgloszenie z nullami
        await incorrect_trip(db, wycieczka);

        // pusta wartosc id i ustawienie id 
        wycieczka = { tytul: 'Wycieczka do Warszawy', miejsca: 5, zdjecie: '/images/trips/miasto.jpg', opis: 'opis wycieczki do Warszawy', cena: 1800 };
        await incorrect_trip(db, wycieczka);
        wycieczka.id = 3;

        // pusta wartosc tytulu i ponowne ustawienie tytulu
        wycieczka.tytul = null;
        await incorrect_trip(db, wycieczka);
        wycieczka.tytul = 'Wycieczka do Warszawy';

        // testowanie miejsc niepuste i ilosc miejsce >= 0, ustawienie miejsc
        wycieczka.miejsca = null;
        await incorrect_trip(db, wycieczka);
        wycieczka.miejsca = -2;
        await incorrect_trip(db, wycieczka);
        wycieczka.miejsca = 5;

        // testowanie niepustosci zdjecia
        wycieczka.zdjecie = null;
        await incorrect_trip(db, wycieczka);
        wycieczka.zdjecie = '/images/trips/miasto.jpg';

        // testowanie niepostosci opisu
        wycieczka.opis = null;
        await incorrect_trip(db, wycieczka);
        wycieczka.opis = 'opis wycieczki do Warszawy';

        // testowanie ceny niepuste i cena >= 0, ustawienie ceny 
        wycieczka.cena = null;
        await incorrect_trip(db, wycieczka);
        wycieczka.cena = -2;
        await incorrect_trip(db, wycieczka);
        wycieczka.cena = 1800;

        // poprawne zgloszenie wycieczki
        await correct_trip(db, wycieczka);
        
        // id powinno byc unikalne
        await incorrect_trip(db, wycieczka);
    });
    
    it("testowanie poprawnosci walidacji w tabeli zgloszenie", async function() {
        let zgloszenie = {};
        // puste zgloszenie z nullami
        await incorrect_book(db, zgloszenie);

        // pusta wartosc imie i ustawienie imienia
        zgloszenie = { nazwisko: 'Makota', telefon: '123456789', email: 'test@wp.pl', ilosc: 2, id_wycieczki: 1 }; 
        await incorrect_book(db, zgloszenie);
        zgloszenie.imie = 'Ala';

        // pusta wartosc nazwiska i ponowne ustawienie nazwiska
        zgloszenie.nazwisko = null;
        await incorrect_book(db, zgloszenie);
        zgloszenie.nazwisko = 'Makota';

        // pusta wartosc telefon, numer nie ma 9 cyfr i ponowane ustawienie telefonu 
        zgloszenie.telefon = null;
        await incorrect_book(db, zgloszenie);
        zgloszenie.telefon = '12345';
        await incorrect_book(db, zgloszenie);
        zgloszenie.telefon = '123456789';

        // pusta wartosc email, niepoprawny email i ponowne ustawienie email 
        zgloszenie.email= null;
        await incorrect_book(db, zgloszenie);
        zgloszenie.email = 'test';
        await incorrect_book(db, zgloszenie);
        zgloszenie.email = 'test@wp.pl';

        // pusta wartosc ilosc, niepoprawna ilosc mniejsza od 1 i ponowne ustawienie ilosci
        zgloszenie.ilosc = null;
        await incorrect_book(db, zgloszenie);
        zgloszenie.ilosc = 0;
        await incorrect_book(db, zgloszenie);
        zgloszenie.ilosc = 2;

        // pusta wartosc id_wycieczki i jej ponowne ustawienie 
        zgloszenie.id_wycieczki = null;
        await incorrect_book(db, zgloszenie);
        zgloszenie.id_wycieczki = 2;

        // poprawne zgloszenie wycieczki
        await correct_book(db, zgloszenie);
        
        // drugie takie samo zgloszenie powinno byc poprawne 
        await correct_book(db, zgloszenie);
    });
    
    it("testowanie poprawnosci walidacji w tabeli user", async function() {
        let uzytkownik = {};
        // pusty uzytkownik z nullami
        await incorrect_user(db, uzytkownik);

        // pusta wartosc imie i ustawienie imienia
        uzytkownik = { nazwisko: 'Makota', email: 'test@wp.pl', haslo: 'haslo12345' }; 
        await incorrect_user(db, uzytkownik);
        uzytkownik.imie = 'Ala';

        // pusta wartosc nazwiska i ponowne ustawienie nazwiska
        uzytkownik.nazwisko = null;
        await incorrect_user(db, uzytkownik);
        uzytkownik.nazwisko = 'Makota';

        // pusta wartosc email, niepoprawny email i ponowne ustawienie email 
        uzytkownik.email= null;
        await incorrect_user(db, uzytkownik);
        uzytkownik.email = 'test';
        await incorrect_user(db, uzytkownik);
        uzytkownik.email = 'test@wp.pl';

        // pusta wartosc hasla i jego ponowne ustawienie 
        uzytkownik.haslo = null;
        await incorrect_user(db, uzytkownik);
        uzytkownik.haslo = 'haslo12345';

        // poprawny uzytkownik 
        await correct_user(db, uzytkownik);
        
        // drugi taki sam uzytkownik nie jest mozliwy 
        await incorrect_user(db, uzytkownik);
    });

    after(() => {
        driver.quit();
        app.close();
    });
});