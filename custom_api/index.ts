const { checkMongoState, getCurrentApprove , getmyTask ,getCurrentApproveTask } = require('./api.ts')
const { sendStrapi_email } = require('./strapi_api.ts')
// const { checkMongoState, getCurrentApprove } = require('./api_custom.ts')

export default {
    checkMongoState, getCurrentApprove , sendStrapi_email , getmyTask ,getCurrentApproveTask
}