import { promises as fsp } from "fs";
import { equal, notEqual } from "assert";
import { start_server } from "../app.mjs";
import { Builder, By, Capabilities, WebElement } from "selenium-webdriver";
import { get_db_sqlite, get_db_postgres } from '../database/database.mjs';
import { add_trips } from '../database/init_db.mjs';
import { waitForDebugger } from "inspector";


// funkcje pomocnicze do testowania
async function check_header(driver, index) {
    let naglowek = await driver.findElement(By.tagName("header")).findElements(By.tagName('a')); // linki w menu
    
    equal(naglowek.length, 8); // wyswietlaja sie wszystkie elementy
    
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
    await driver.get(website);
    const title = await driver.getTitle();
    equal(title, 'Wycieczka'); // sprawdzanie tytulu
}

// testy

describe("Testy frontend", async () => {
    get_db_sqlite((db) => {
        async function add() {
            add_trips(db);  
        };
        add();
        start_server(db);
    });

    const TIMEOUT = 10000;
    const driver = new Builder().withCapabilities(Capabilities.firefox()).build();
    const website = 'http://localhost:2000';

    before(async function () {
        await driver
          .manage()
          .setTimeouts({ implicit: TIMEOUT, pageLoad: TIMEOUT, script: TIMEOUT });
      });

    it("uruchomienie strony glownej", async function() {
        check_title(driver);  // sprawdzanie tytulu
        check_header(driver, 1); // sprawdzanie poprawnosci naglowka 
        
        // sprawdzanie ilosci wycieczek
        await driver.get(website);
        let trips =  await driver.findElements(By.className("trip"));
        equal(trips.length, 3); // sprawdzenie ilosci wycieczek
    });

    it("wycieczki", async function() {
        check_title(driver);  // sprawdzanie tytulu
        check_header(driver, 2); // sprawdzanie poprawnosci naglowka 

        await driver.get(website + '/trip/0');
        
        // sprawdzanie czy to wycieczka 0
        let nazwa = await driver.findElement(By.tagName('h1'));
        equal(await nazwa.getText(), 'Wycieczka nad morze');

        // sprawdzenie guzikow
        let guziki = await driver.findElement(By.id('links')).findElements(By.tagName('a'));
        equal(await guziki[0].getAttribute('href'), website + "/");
        equal(await guziki[1].getAttribute('href'), website + "/book/0");
    });

    it("wycieczki spoza zakresu", async function() {
        check_title(driver);  // sprawdzanie tytulu
        check_header(driver, 2); // sprawdzanie poprawnosci naglowka 
        
        await driver.get(website + '/trip/-1');
        let nazwa_minus = await driver.findElement(By.tagName('main')).findElement(By.tagName('h2'));
        equal(await nazwa_minus.getText(), 'Nie ma takiej wycieczki');
        
        await driver.get(website + '/trip/5');
        let nazwa_plus = await driver.findElement(By.tagName('main')).findElement(By.tagName('h2'));
        equal(await nazwa_plus.getText(), 'Nie ma takiej wycieczki');
        
    });

    it("bookowanie nieprawidłowe pola", async function() {
        await driver.get(website + '/book/1');
        check_title(driver);
        check_header(driver, 3); // sprawdzanie poprawnosci naglowka 

        await driver.findElement(By.tagName('button')).click();


        let inputy = await driver.findElements(By.tagName('input'));
        equal(await inputy.length, 7);
        equal(await inputy[1].getAttribute('validationMessage'), 'Please fill out this field.'); // imie
        equal(await inputy[2].getAttribute('validationMessage'), 'Please fill out this field.'); // nazwisko
        equal(await inputy[3].getAttribute('validationMessage'), 'Please fill out this field.'); // numer 
        equal(await inputy[4].getAttribute('validationMessage'), 'Please fill out this field.'); // mail 
        equal(await inputy[5].getAttribute('validationMessage'), 'Please enter a number.'); // liczba osob
        equal(await inputy[6].getAttribute('validationMessage'), 'Please check this box if you want to proceed.'); // kwadracik 

        await driver.findElement(By.id('first_name')).sendKeys('Ala');
        await driver.findElement(By.id('last_name')).sendKeys('MAkota');

        // sprawdzanie numeru
        await driver.findElement(By.id('phone')).sendKeys('1234');
        await driver.findElement(By.tagName('button')).click();
        inputy = await driver.findElements(By.tagName('input'));
        equal(await inputy[3].getAttribute('validationMessage'), 'Please match the requested format: Numer powinien składać się z 9 cyfr..'); // numer 
        await driver.findElement(By.id('phone')).clear();
        await driver.findElement(By.id('phone')).sendKeys('123456789');
        await driver.findElement(By.tagName('button')).click();
        inputy = await driver.findElements(By.tagName('input'));
        equal(await inputy[3].getAttribute('validationMessage'), ''); // numer 
        
        // sprawdzanie maila
        await driver.findElement(By.id('email')).sendKeys('test');
        await driver.findElement(By.tagName('button')).click();
        inputy = await driver.findElements(By.tagName('input'));
        equal(await inputy[4].getAttribute('validationMessage'), 'Please enter an email address.'); // mail 
        await driver.findElement(By.id('email')).clear();
        await driver.findElement(By.id('email')).sendKeys('test@wp.pl');
        await driver.findElement(By.tagName('button')).click();
        inputy = await driver.findElements(By.tagName('input'));
        equal(await inputy[4].getAttribute('validationMessage'), ''); // mail 

        // sprawdzanie osob
        await driver.findElement(By.id('n_people')).sendKeys('-1');
        await driver.findElement(By.tagName('button')).click();
        inputy = await driver.findElements(By.tagName('input'));
        equal(await inputy[5].getAttribute('validationMessage'), 'Please select a value that is no less than 1.'); // miejsca 
        await driver.findElement(By.id('n_people')).clear();
        await driver.findElement(By.id('n_people')).sendKeys('5');
        await driver.findElement(By.tagName('button')).click();
        inputy = await driver.findElements(By.tagName('input'));
        equal(await inputy[5].getAttribute('validationMessage'), 'Please select a value that is no more than 4.'); // miejsca
        await driver.findElement(By.id('n_people')).clear();
        await driver.findElement(By.id('n_people')).sendKeys('2');
        await driver.findElement(By.tagName('button')).click();
        inputy = await driver.findElements(By.tagName('input'));
        equal(await inputy[5].getAttribute('validationMessage'), ''); // miejsca

        await driver.findElement(By.id('gdpr_permission')).click();
        await driver.findElement(By.tagName('button')).click();

        // brak zalogowania
        let info = await driver.findElement(By.id('trip_informations')).findElement(By.tagName('div'));
        equal(await info.getText(), "Zaloguj się");
    });

    it("rejestracja 2 razy", async function() {
        await driver.get(website + '/register/');
        check_title(driver);
        check_header(driver, 7); // sprawdzanie poprawnosci naglowka 

        // sprawdzanie danych - formularz identyczny co w book - sprawdzanie hasla      
        await driver.findElement(By.id('first_name')).sendKeys('Ala');
        await driver.findElement(By.id('last_name')).sendKeys('Makota');
        await driver.findElement(By.id('email')).sendKeys('test@wp.pl');
        await driver.findElement(By.id('pass')).sendKeys('haslo12345');
        await driver.findElement(By.id('confpass')).sendKeys('haslo1234');
        await driver.findElement(By.tagName('button')).click();
        
        let komunikat = await driver.findElement(By.tagName('div'));
        equal(await komunikat.getText(), 'Hasła nie są identyczne');
        
        // sprawdzanie czy teraz jest poprawnie
        await driver.findElement(By.id('first_name')).clear();
        await driver.findElement(By.id('first_name')).sendKeys('Ala');
        await driver.findElement(By.id('last_name')).clear();
        await driver.findElement(By.id('last_name')).sendKeys('Makota');
        await driver.findElement(By.id('email')).clear();
        await driver.findElement(By.id('email')).sendKeys('test@wp.pl');
        await driver.findElement(By.id('pass')).clear();
        await driver.findElement(By.id('pass')).sendKeys('haslo12345');
        await driver.findElement(By.id('confpass')).clear();
        await driver.findElement(By.id('confpass')).sendKeys('haslo12345');
        await driver.findElement(By.tagName('button')).click();
        
        komunikat = await driver.findElement(By.tagName('div'));
        equal(await komunikat.getText(), 'Udało się zarejestrować');
        
        // sprawdzanie drugiej rejestracji - blad
        await driver.findElement(By.id('first_name')).sendKeys('Ala');
        await driver.findElement(By.id('last_name')).sendKeys('Makota');
        await driver.findElement(By.id('email')).sendKeys('test@wp.pl');
        await driver.findElement(By.id('pass')).sendKeys('haslo12345');
        await driver.findElement(By.id('confpass')).sendKeys('haslo12345');
        await driver.findElement(By.tagName('button')).click();
        
        komunikat = await driver.findElement(By.tagName('div'));
        equal(await komunikat.getText(), 'Taki mail już jest zarejestrowany');
    });

    it("logowanie", async function() {
        check_title(driver);
        check_header(driver, 4); // sprawdzanie poprawnosci naglowka 
        // formularz ma te same metody, co bookowanie

        // zly email 
        await driver.get(website + '/login/');
        await driver.findElement(By.id('email')).sendKeys('test2@wp.pl');
        await driver.findElement(By.id('pass')).sendKeys('haslo12345');
        await driver.findElement(By.tagName('button')).click();
        let komunikat = await driver.findElement(By.tagName('div'));
        equal(await komunikat.getText(), 'Błąd logowania');
        
        // zle haslo 
        await driver.findElement(By.id('email')).sendKeys('test@wp.pl');
        await driver.findElement(By.id('pass')).sendKeys('haslo123');
        await driver.findElement(By.tagName('button')).click();
        komunikat = await driver.findElement(By.tagName('div'));
        equal(await komunikat.getText(), 'Błąd logowania');
        
        // poprawne logowanie
        await driver.findElement(By.id('email')).sendKeys('test@wp.pl');
        await driver.findElement(By.id('pass')).sendKeys('haslo12345');
        await driver.findElement(By.tagName('button')).click();
        equal(await driver.getCurrentUrl(), website + '/mainuser/');

        // puste rezerwacje
        let rezerwacje = await driver.findElements(By.tagName('h1'));
        equal(await rezerwacje[0].getText(), "brak rezerwacji");
    });
    
    it("bookowanie zalogowanie poprawne", async function() {
        await driver.get(website + '/book/1');
        check_title(driver);
        check_header(driver, 3); // sprawdzanie poprawnosci naglowka 

        // poprawne bookowanie
        await driver.get(website + '/book/1');
        await driver.findElement(By.id('first_name')).sendKeys('Ala');
        await driver.findElement(By.id('last_name')).sendKeys('Makota');
        await driver.findElement(By.id('phone')).sendKeys('123456789');
        await driver.findElement(By.id('email')).sendKeys('test@wp.pl');
        await driver.findElement(By.id('n_people')).sendKeys('2');
        await driver.findElement(By.id('gdpr_permission')).click();
        await driver.findElement(By.tagName('button')).click();
        equal(await driver.getCurrentUrl(), website + '/trip/1');
        
        // sprawdzanie rejestracji
        await driver.get(website + '/mainuser/');
        let tytuly = await driver.findElements(By.tagName('h1'));
        let zawartosc = await driver.findElements(By.tagName('p'));
        equal(await tytuly.length, 1);
        equal(await tytuly[0].getText(), "rezerwacja nr 0 na wycieczkę Wycieczka w góry");
        equal(await zawartosc[0].getText(), "Rezerwujący: Ala Makota");
        equal(await zawartosc[1].getText(), "Miejsca: 2");
    });
    
    it("bookowanie brak miejsc", async function() {
        // poprawne bookowanie, ale brak miejsc
        await driver.get(website + '/book/1');
        await driver.findElement(By.id('first_name')).sendKeys('Ala');
        await driver.findElement(By.id('last_name')).sendKeys('Makota');
        await driver.findElement(By.id('phone')).sendKeys('123456789');
        await driver.findElement(By.id('email')).sendKeys('test@wp.pl');
        await driver.findElement(By.id('n_people')).sendKeys('3');
        await driver.findElement(By.id('gdpr_permission')).click();
        await driver.findElement(By.tagName('button')).click();
        
        equal(await driver.getCurrentUrl(), website + '/book/1');
        let info = await driver.findElement(By.id('trip_informations')).findElement(By.tagName('div'));
        equal(await info.getText(), "Brak miejsc");

    });

    it("bookowanie 2 poprawne", async function() {
        // 2 rejestracja poprawna
        await driver.get(website + '/book/0');
        await driver.findElement(By.id('first_name')).sendKeys('Ala');
        await driver.findElement(By.id('last_name')).sendKeys('Makota');
        await driver.findElement(By.id('phone')).sendKeys('123456789');
        await driver.findElement(By.id('email')).sendKeys('test@wp.pl');
        await driver.findElement(By.id('n_people')).sendKeys('3');
        await driver.findElement(By.id('gdpr_permission')).click();
        await driver.findElement(By.tagName('button')).click();
        
        equal(await driver.getCurrentUrl(), website + '/trip/0');
        
        // sprawdzanie rejestracji
        await driver.get(website + '/mainuser/');
        let tytuly = await driver.findElements(By.tagName('h1'));
        let zawartosc = await driver.findElements(By.tagName('p'));
        equal(await tytuly.length, 2);
        equal(await tytuly[0].getText(), "rezerwacja nr 0 na wycieczkę Wycieczka w góry");
        equal(await tytuly[1].getText(), "rezerwacja nr 1 na wycieczkę Wycieczka nad morze");
        equal(await zawartosc[0].getText(), "Rezerwujący: Ala Makota");
        equal(await zawartosc[1].getText(), "Miejsca: 2");
        equal(await zawartosc[2].getText(), "Rezerwujący: Ala Makota");
        equal(await zawartosc[3].getText(), "Miejsca: 3");
    });

    it("wyloguj i sprawdz liste rejestracji", async function() {
        await driver.get(website + '/logout/');
        check_title(driver);
        check_header(driver, 6); // sprawdzanie poprawnosci naglowka 
        
        await driver.get(website + '/logout/');
        await driver.findElement(By.tagName('button')).click();

        // powrot do strony glownej
        equal(await driver.getCurrentUrl(), website + "/");

        // puste rezerwacje
        await driver.get(website + '/mainuser/');
        let rezerwacje = await driver.findElements(By.tagName('h1'));
        equal(await rezerwacje[0].getText(), "brak rezerwacji");
    });

    after(() => driver.quit());
});
