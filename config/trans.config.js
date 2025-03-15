require('dotenv').config()

const transConfig = {
    key: process.env.AZURE_TRANS_KEY,
    location: process.env.AZURE_TRANS_LOCATION
}

module.exports = transConfig