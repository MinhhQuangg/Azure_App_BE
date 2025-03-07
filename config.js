require('dotenv').config()

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 5432, 
    ssl: {
        rejectUnauthorized: false
    }
}

const transConfig = {
    key: process.env.AZURE_TRANS_KEY,
    location: process.env.AZURE_TRANS_LOCATION
}

module.exports = { dbConfig, transConfig }