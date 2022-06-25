import { equal } from "assert";

export async function add_trip(db, wycieczka) {
    await db.Wycieczki.create(wycieczka);
}

export async function add_book(db, zgloszenie) {
    await db.Zgloszenia.create(zgloszenie);
}

export async function add_user(db, uzytkownik) {
    await db.User.create(uzytkownik);
}

export async function incorrect_trip(db, wycieczka) {
    try {
        await add_trip(db, wycieczka);
        equal(1, 0);
    } catch (e) {
        equal(1, 1);
    }
}

export async function correct_trip(db, wycieczka) {
    try {
        await add_trip(db, wycieczka);
        equal(1, 1);
    } catch (e) {
        equal(1, 0);
    }
}

export async function incorrect_book(db, zgloszenie) {
    try {
        await add_book(db, zgloszenie);
        equal(1, 0);
    } catch (e) {
        equal(1, 1);
    }
}

export async function correct_book(db, zgloszenie) {
    try {
        await add_book(db, zgloszenie);
        equal(1, 1);
    } catch (e) {
        equal(1, 0);
    }
}

export async function incorrect_user(db, uzytkownik) {
    try {
        await add_user(db, uzytkownik);
        equal(1, 0);
    } catch (e) {
        equal(1, 1);
    }
}

export async function correct_user(db, uzytkownik) {
    try {
        await add_user(db, uzytkownik);
        equal(1, 1);
    } catch (e) {
        equal(1, 0);
    }
}