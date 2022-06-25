import { Sequelize, DataTypes } from 'sequelize';


export const get_db_sqlite = async (logging = false) => {
    const sequelize = new Sequelize("sqlite::memory:", { logging });
    let db = {};
    db.sequelize = sequelize;
    db.Wycieczki = create_wycieczki(db.sequelize);
    db.Zgloszenia = create_zgloszenia(db.sequelize);
    db.User = create_user(db.sequelize);
    
    await db.sequelize.sync({force: true});
    return db;
}

export const get_db_postgres = async () => {
    const sequelize = new Sequelize('postgres://jd429182:iks@localhost:2022/bd', {
        define: {
            //prevent sequelize from pluralizing table names
            freezeTableName: true
        }
    });
    
    let db = {};
    db.sequelize = sequelize;
    db.Wycieczki = create_wycieczki(db.sequelize);
    db.Zgloszenia = create_zgloszenia(db.sequelize);
    db.User = create_user(db.sequelize);
    
    await db.sequelize.sync();
    
    return db;
}

function create_wycieczki(sequelize) {
    const Wycieczki = sequelize.define('wycieczki', {
    id: {type: DataTypes.INTEGER, unique: true, primaryKey: true, allowNull: false},
    tytul:  {type: DataTypes.STRING, allowNull: false}, 
    miejsca: {type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
    zdjecie: {type: DataTypes.STRING, allowNull: false},
    opis: {type: DataTypes.STRING, allowNull: false},
    cena: {type: DataTypes.INTEGER, allowNull: false, validate: { min: 0 } },
    }, {
        timestamps: false,
        freezeTableName: true,
        tableName: 'wycieczki'
    });

    return Wycieczki;
}

function create_zgloszenia(sequelize) {
    const Zgloszenia = sequelize.define('zgloszenia', {
        imie: {type: DataTypes.STRING, allowNull: false}, 
        nazwisko: {type: DataTypes.STRING, allowNull: false}, 
        telefon: {type: DataTypes.STRING, allowNull: false, validate: { len: [9, 9] } }, 
        email: {type: DataTypes.STRING, validate: { isEmail: true }, allowNull: false },
        ilosc: {type: DataTypes.STRING, validate: { min: 1 }, allowNull: false }, 
        id_wycieczki: {type: DataTypes.INTEGER, allowNull: false}
    }, {
        timestamps: false,
        freezeTableName: true,
        tableName: 'zgloszenia'
    });
    return Zgloszenia;
}

function create_user(sequelize) {
    const User = sequelize.define("user", {
        imie: { type: DataTypes.STRING, allowNull: false, },
        nazwisko: { type: DataTypes.STRING, allowNull: false, },
        email: { type: DataTypes.STRING, allowNull: false, unique: true, primaryKey: true },
        haslo: { type: DataTypes.STRING, allowNull: false, },
    }, {
        timestamps: false,
        freezeTableName: true,
        tableName: 'user'
    });   
    return User; 
};
