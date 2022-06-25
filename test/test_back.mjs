import { equal } from "assert";
import { start_server } from "../app.mjs";
import { Builder, By, Capabilities } from "selenium-webdriver";
import { get_db_sqlite } from '../database/database.mjs';
import { add_trips } from '../database/init_db.mjs';
import { check_book_errors, check_header, check_login_error, check_register_communicate, check_title, check_user_reservation } from './tests_functions.mjs';
import { put_date_book, put_date_login, put_date_register } from './tests_functions.mjs';

// stale do testowania
const empty_field = 'Please fill out this field.';
const empty_number = 'Please enter a number.'; 
const empty_box = 'Please check this box if you want to proceed.';
const incorrect_email = 'Please enter an email address.'; 
const incorrect_phone = 'Please match the requested format: Numer powinien składać się z 9 cyfr..'; 
const less = 'Please select a value that is no less than 1.'; 
const more = 'Please select a value that is no more than 4.';
const incorrect_trip = 'Nie ma takiej wycieczki'; 
const not_logged = 'Zaloguj się'
const not_equal_passwords = 'Hasła nie są identyczne';
const correct_register = 'Udało się zarejestrować';
const email_exist = 'Taki mail już jest zarejestrowany';
const incorrect_login = 'Błąd logowania';
const not_enough_places = 'Brak miejsc';

describe("Testy backend", async () => {

    const TIMEOUT = 10000;
    const driver = new Builder().withCapabilities(Capabilities.firefox()).build();
    const website = 'http://localhost:2000';
    let db;
    let app;

    before(async function () {
        await driver
          .manage()
          .setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
        
        db = await get_db_sqlite();
        add_trips(db);  
        app = start_server(db);
    });

    it("uruchomienie strony glownej", async function() {
        await driver.get(website);
        await check_title(driver);  // sprawdzanie tytulu
        await check_header(driver, 1, website); // sprawdzanie poprawnosci naglowka 
        
        // sprawdzanie ilosci wycieczek
        let trips =  await driver.findElements(By.className("trip"));
        equal(trips.length, 3); // sprawdzenie ilosci wycieczek
    });

    it("wycieczki", async function() {
        await driver.get(website + '/trip/0');
        await check_title(driver);  // sprawdzanie tytulu
        await check_header(driver, 2, website); // sprawdzanie poprawnosci naglowka 

        // sprawdzanie czy to wycieczka 0
        let nazwa = await driver.findElement(By.tagName('h1'));
        equal(await nazwa.getText(), 'Wycieczka nad morze');

        // sprawdzenie guzikow
        let guziki = await driver.findElement(By.id('links')).findElements(By.tagName('a'));
        equal(await guziki[0].getAttribute('href'), website + "/");
        equal(await guziki[1].getAttribute('href'), website + "/book/0");
    });

    it("wycieczki spoza zakresu", async function() {
        await driver.get(website + '/trip/-1');
        await check_title(driver);  // sprawdzanie tytulu
        await check_header(driver, 2, website); // sprawdzanie poprawnosci naglowka 
        let nazwa_minus = await driver.findElement(By.tagName('main')).findElement(By.tagName('h2'));
        equal(await nazwa_minus.getText(), incorrect_trip);
        
        await driver.get(website + '/trip/5');
        await check_title(driver);  // sprawdzanie tytulu
        await check_header(driver, 2, website); // sprawdzanie poprawnosci naglowka 
        let nazwa_plus = await driver.findElement(By.tagName('main')).findElement(By.tagName('h2'));
        equal(await nazwa_plus.getText(), incorrect_trip); 
    });

    it("bookowanie nieprawidłowe pola", async function() {
        await driver.get(website + '/book/1');
        await check_title(driver);
        await check_header(driver, 3, website); // sprawdzanie poprawnosci naglowka 

        // pusty formularz
        await put_date_book(driver, ['', '', '', '', '', '']); // pusty 
        await check_book_errors(driver, [empty_field, empty_field, empty_field, empty_field, empty_number, empty_box]);

        // sprawdzanie numeru
        await put_date_book(driver, ['Ala', 'Makota', '1234']);
        await check_book_errors(driver, ['', '', incorrect_phone, empty_field, empty_number, empty_box]);
        await put_date_book(driver, ['Ala', 'Makota', '123456789'], false);
        await check_book_errors(driver, ['', '', '', empty_field, empty_number, empty_box]);

        // sprawdzanie maila
        await put_date_book(driver, ['Ala', 'Makota', '123456789', 'test']);
        await check_book_errors(driver, ['', '', '', incorrect_email, empty_number, empty_box]);
        await put_date_book(driver, ['Ala', 'Makota', '123456789', 'test@wp.pl'], false);
        await check_book_errors(driver, ['', '', '', '', empty_number, empty_box]);
        
        // sprawdzanie osob
        await put_date_book(driver, ['Ala', 'Makota', '123456789', 'test@wp.pl', '-1']);
        await check_book_errors(driver, ['', '', '', '', less, empty_box]);
        await put_date_book(driver, ['Ala', 'Makota', '123456789', 'test@wp.pl', '5']);
        await check_book_errors(driver, ['', '', '', '', more, empty_box]);
        await put_date_book(driver, ['Ala', 'Makota', '123456789', 'test@wp.pl', '2']);
        await check_book_errors(driver, ['', '', '', '', '', empty_box]);
        
        // wszystko uzupelnione
        await put_date_book(driver, ['Ala', 'Makota', '123456789', 'test@wp.pl', '2'], true);

        // brak zalogowania
        let info = await driver.findElement(By.id('trip_informations')).findElement(By.tagName('div'));
        equal(await info.getText(), not_logged);
    });

    it("rejestracja 2 razy", async function() {
        // sprawdzanie poprawnosci naglowka 
        await driver.get(website + '/register/');
        await check_title(driver);
        await check_header(driver, 7, website); 

        // sprawdzanie rejestracji - niezgodne hasla 
        await put_date_register(driver, ['Ala', 'Makota', 'test@wp.pl', 'haslo12345', 'haslo1234']);
        await check_register_communicate(driver, not_equal_passwords); 
        
        // sprawdzanie rejestracji - poprawne
        await put_date_register(driver, ['Ala', 'Makota', 'test@wp.pl', 'haslo12345', 'haslo12345']);
        await check_register_communicate(driver, correct_register); 
        
        // sprawdzanie drugiej rejestracji - blad
        await put_date_register(driver, ['Ala', 'Makota', 'test@wp.pl', 'haslo12345', 'haslo12345']);
        await check_register_communicate(driver, email_exist); 
    });

    it("logowanie", async function() {
        // sprawdzanie poprawnosci naglowka 
        await driver.get(website + '/login/');
        await check_title(driver);
        await check_header(driver, 4, website); 

        // zly email 
        await put_date_login(driver, ['test2@wp.pl', 'haslo12345']);
        await check_login_error(driver, incorrect_login);
        
        // zle haslo 
        await put_date_login(driver, ['test@wp.pl', 'haslo123']);
        await check_login_error(driver, incorrect_login);
        
        // poprawne logowanie
        await put_date_login(driver, ['test@wp.pl', 'haslo12345']);
        equal(await driver.getCurrentUrl(), website + '/mainuser/');

        // puste rezerwacje
        await check_user_reservation(driver, ['brak rezerwacji'], []);
    });
    
    it("bookowanie zalogowanie poprawne", async function() {
        // sprawdzanie poprawnosci naglowka 
        await driver.get(website + '/book/1');
        await check_title(driver);
        await check_header(driver, 3, website); 

        // poprawne bookowanie
        await put_date_book(driver, ['Ala', 'Makota', '123456789', 'test@wp.pl', '2'], true);
        equal(await driver.getCurrentUrl(), website + '/trip/1');
        
        // sprawdzanie rejestracji
        await driver.get(website + '/mainuser/');
        await check_user_reservation(driver, ['rezerwacja nr 0 na wycieczkę Wycieczka w góry'], ['Rezerwujący: Ala Makota', 'Miejsca: 2']);
    });
    
    it("bookowanie brak miejsc", async function() {
        // poprawne bookowanie, ale brak miejsc
        await driver.get(website + '/book/1');
        await put_date_book(driver, ['Ala', 'Makota', '123456789', 'test@wp.pl', '3'], true);
        equal(await driver.getCurrentUrl(), website + '/book/1');
        let info = await driver.findElement(By.id('trip_informations')).findElement(By.tagName('div'));
        equal(await info.getText(), not_enough_places);
    });

    it("bookowanie druga poprawna", async function() {
        // 2 rejestracja poprawna
        await driver.get(website + '/book/0');
        await put_date_book(driver, ['Ala', 'Makota', '123456789', 'test@wp.pl', '3'], true);
        equal(await driver.getCurrentUrl(), website + '/trip/0');
        
        // sprawdzanie rejestracji
        await driver.get(website + '/mainuser/');
        await check_user_reservation(driver, ['rezerwacja nr 0 na wycieczkę Wycieczka nad morze', 'rezerwacja nr 1 na wycieczkę Wycieczka w góry'], 
            ['Rezerwujący: Ala Makota', 'Miejsca: 3', 'Rezerwujący: Ala Makota', 'Miejsca: 2']);
    });

    it("wyloguj i sprawdz liste rejestracji", async function() {
        // sprawdzanie poprawnosci naglowka 
        await driver.get(website + '/logout/');
        await check_title(driver);
        await check_header(driver, 6, website); 
        
        await driver.get(website + '/logout/');
        await driver.findElement(By.tagName('button')).click();

        // powrot do strony glownej
        equal(await driver.getCurrentUrl(), website + "/");

        // puste rezerwacje
        await driver.get(website + '/mainuser/');
        await check_user_reservation(driver, ['brak rezerwacji'], []);
    });

    after(() => {
        driver.quit();
        app.close();
    });
});