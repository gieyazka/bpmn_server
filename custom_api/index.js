"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { checkMongoState, getCurrentApprove, getmyTask, getCurrentApproveTask } = require('./api.ts');
const { sendStrapi_email } = require('./strapi_api.ts');
// const { checkMongoState, getCurrentApprove } = require('./api_custom.ts')
exports.default = {
    checkMongoState, getCurrentApprove, sendStrapi_email, getmyTask, getCurrentApproveTask
};
//# sourceMappingURL=index.js.map