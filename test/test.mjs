import { equal } from "assert";
import { start_server } from "../app.mjs";
import { Builder, By, Capabilities, WebElement } from "selenium-webdriver";
import { get_db_sqlite } from '../database/database.mjs';
import { add_trips } from '../database/init_db.mjs';

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

// funkcje pomocnicze do testowania
async function check_header(driver, index, website) {
    let naglowek = await driver.findElement(By.tagName("header")).findElements(By.tagName('a')); // linki w menu
    
    // wyswietlaja sie wszystkie elementy
    equal(naglowek.length, 8); 
    
    // kolorowanie menu
    equal(await naglowek[index].getAttribute('style'), "color: red;");
    
    for (let i = 0; i < naglowek.length; i++)
        if (i != index)
            equal(await naglowek[i].getAttribute('style'), "");

    // sprawdzanie linkowania stron
    equal(await naglowek[0].getAttribute('href'), website + "/");
    equal(await naglowek[1].getAttribute('href'), website + "/");
    equal(await naglowek[2].getAttribute('href'), website + "/trip/0");
    equal(await naglowek[3].getAttribute('href'), website + "/book/0");
    equal(await naglowek[4].getAttribute('href'), website + "/login/");
    equal(await naglowek[5].getAttribute('href'), website + "/mainuser/");
    equal(await naglowek[6].getAttribute('href'), website + "/logout/");
    equal(await naglowek[7].getAttribute('href'), website + "/register/");
}

async function check_title(driver) {
    const title = await driver.getTitle();
    equal(title, 'Wycieczka'); // sprawdzanie tytulu
}

async function put_date_book(driver, date, box = false) {
    let inputy = await driver.findElements(By.tagName('input'));
    equal(await inputy.length, 7);
    // resetowanie odpowiedzi
    for (let i = 1; i < inputy.length - 1; i++) // first is id hidden, last is gdbr
        await inputy[i].clear();

    if (await inputy[inputy.length - 1].isSelected())
        await inputy[inputy.length - 1].click();
    
    //ustawianie wartosci w polach
    for (let i = 0; i < date.length; i++)
        await inputy[i + 1].sendKeys(date[i]);
    
    if (box == true)
        await inputy[inputy.length - 1].click();
    
    // wyslanie danych
    await driver.findElement(By.tagName('button')).click();
} 

async function check_book_errors(driver, errors) {
    let inputy = await driver.findElements(By.tagName('input'));
    equal(await inputy.length, 7);
    for (let i = 1; i < inputy.length; i++)
        equal(await inputy[i].getAttribute('validationMessage'), errors[i - 1]); 
}

async function put_date_register(driver, date) {
    let inputy = await driver.findElements(By.tagName('input'));
    equal(await inputy.length, 5);
    // resetowanie odpowiedzi
    for (let i = 0; i < inputy.length; i++) 
        await inputy[i].clear();

    //ustawianie wartosci w polach
    for (let i = 0; i < date.length; i++)
        await inputy[i].sendKeys(date[i]);
    
    // wyslanie danych
    await driver.findElement(By.tagName('button')).click();
}

async function check_register_communicate(driver, error) {
    let info = await driver.findElement(By.id('trip_informations')).findElement(By.tagName('div'));
    equal(await info.getText(), error);
}

async function put_date_login(driver, date) {
    let inputy = await driver.findElements(By.tagName('input'));
    equal(await inputy.length, 2);
    // resetowanie odpowiedzi
    for (let i = 0; i < inputy.length; i++) 
        await inputy[i].clear();

    //ustawianie wartosci w polach
    for (let i = 0; i < date.length; i++)
        await inputy[i].sendKeys(date[i]);
    
    // wyslanie danych
    await driver.findElement(By.tagName('button')).click();
}

async function check_login_error(driver, error) {
    let komunikat = await driver.findElement(By.tagName('div'));
    equal(await komunikat.getText(), error);
}

async function check_user_reservation(driver, titles, reservations) {
    // sprawdza zawartosc nagłówków rezerwacji
    let tytuly = await driver.findElements(By.tagName('h1'));
    equal(await tytuly.length, titles.length);
    for (let i = 0; i < tytuly.length; i++)
        equal(await tytuly[i].getText(), titles[i]);
    
    if (reservations.length > 0) {
        let zawartosc = await driver.findElements(By.tagName('p'));

        equal(await zawartosc.length, reservations.length);
    
        for (let i = 0; i < zawartosc.length; i++)
            equal(await zawartosc[i].getText(), reservations[i]);
    }
}

// testy
describe("Testy frontend", async () => {

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