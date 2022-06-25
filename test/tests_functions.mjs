import { equal } from "assert";
import { By } from "selenium-webdriver";

// funkcje pomocnicze do testowania
export async function check_header(driver, index, website) {
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

export async function check_title(driver) {
    const title = await driver.getTitle();
    equal(title, 'Wycieczka'); // sprawdzanie tytulu
}

export async function put_date_book(driver, date, box = false) {
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

export async function check_book_errors(driver, errors) {
    let inputy = await driver.findElements(By.tagName('input'));
    equal(await inputy.length, 7);
    for (let i = 1; i < inputy.length; i++)
        equal(await inputy[i].getAttribute('validationMessage'), errors[i - 1]); 
}

export async function put_date_register(driver, date) {
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

export async function check_register_communicate(driver, error) {
    let info = await driver.findElement(By.id('trip_informations')).findElement(By.tagName('div'));
    equal(await info.getText(), error);
}

export async function put_date_login(driver, date) {
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

export async function check_login_error(driver, error) {
    let komunikat = await driver.findElement(By.tagName('div'));
    equal(await komunikat.getText(), error);
}

export async function check_user_reservation(driver, titles, reservations) {
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
