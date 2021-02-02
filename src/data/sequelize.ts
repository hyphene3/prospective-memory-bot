import { Sequelize } from 'sequelize';


const dataFilename = "data.sqlite";

export const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: dataFilename
});
