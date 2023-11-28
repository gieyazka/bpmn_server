const customAPI = require('./api.ts')
const strapi_api = require('./strapi_api.ts')
// const { checkMongoState, getCurrentApprove } = require('./api_custom.ts')

// export default {
//     clearLogsTask, getUserInfo, getHRLeave, getLDAPData, getLDAPDataByEmpID, getLeaveQuota, hrSetLeave,
//     checkMongoState, getCurrentApprove, sendStrapi_email, getmyTask, getLeave, getCurrentApproveTask, getMyHierachies, getAction_logs, getTaskByItemID, getEmployee, hrCancel, setDuplicate, getLeaveDay, updateLeaveFile
// }

export default {
    ...customAPI, ...strapi_api
}