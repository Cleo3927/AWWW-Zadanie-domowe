export async function add_trips(db) {
    await db.Wycieczki.create({
        id: 0,
        tytul: "Wycieczka nad morze",
        miejsca: 5,
        zdjecie: "/images/trips/morze.jpg",
        opis: "Wspaniała wycieczka nad morze w pięknych okolicznościach przyrody. Możliwość wycieczek statkiem a także wypożyczenia żaglówki",
        cena: 1500
    });
    await db.Wycieczki.create({
        id: 1,
        tytul: "Wycieczka w góry",
        miejsca: 3,
        zdjecie: "/images/trips/szczyt.jpg",
        opis: "Wspaniała wycieczka w góry w pięknych okolicznościach przyrody. W czasie wycieczki zdobędziemy najwyzszy szczyt Tatr",
        cena: 1400
    });
    await db.Wycieczki.create({
        id: 2,
        tytul: "Wycieczka do Krakowa",
        miejsca: 6,
        zdjecie: "/images/trips/miasto.jpg",
        opis: "Wspaniała wycieczka do dawnej stolicy Polski. W czasie wycieczki odwiedzimy smoka Wawelskiego",
        cena: 1600
    });
}