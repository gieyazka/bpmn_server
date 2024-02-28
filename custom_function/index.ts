const customAPI = require('./api.ts')
const strapi_api = require('./strapi_api.ts')


export default {
    ...customAPI, ...strapi_api
}