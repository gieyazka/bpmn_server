"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.configuration = void 0;
const __1 = require("../");
const __2 = require("../");
const __3 = require("../");
const __4 = require("../");
const appDelegate_1 = require("./appDelegate");
const dotenv = require('dotenv');
const res = dotenv.config();
let definitionsPath = __dirname + '/../processes/';
var configuration = new __2.Configuration({
    definitionsPath: definitionsPath,
    templatesPath: __dirname + '/../emailTemplates',
    timers: {
        forceTimersDelay: 1000,
        precision: 3000,
    },
    database: {
        MongoDB: {
            db_url: process.env.MONGO_DB_URL,
            db: 'bpmn'
        }
    },
    apiKey: process.env.API_KEY,
    logger: function (server) {
        new __4.Logger(server);
    },
    definitions: function (server) {
        return new __2.ModelsDatastore(server);
    },
    appDelegate: function (server) {
        return new appDelegate_1.MyAppDelegate(server);
    },
    dataStore: function (server) {
        return new __3.DataStore(server);
    },
    IAM: function (server) {
        return new __1.IAM(server);
    },
    ACL: function (server) {
        return new __1.ACL(server);
    }
});
exports.configuration = configuration;
//# sourceMappingURL=testConfiguration.js.map