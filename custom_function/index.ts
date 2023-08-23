const { getLeaveQuota, getHRLeave, checkMongoState, getCurrentApprove, getmyTask, getCurrentApproveTask, getAction_logs, getTaskByItemID, hrCancel, hrSetLeave, setDuplicate, getLeaveDay } = require('./api.ts')
const { sendStrapi_email, getMyHierachies, getEmployee, getUserInfo, getLDAPData, getLDAPDataByEmpID } = require('./strapi_api.ts')
// const { checkMongoState, getCurrentApprove } = require('./api_custom.ts')

export default {
    getUserInfo, getHRLeave, getLDAPData, getLDAPDataByEmpID, getLeaveQuota, hrSetLeave,
    checkMongoState, getCurrentApprove, sendStrapi_email, getmyTask, getCurrentApproveTask, getMyHierachies, getAction_logs, getTaskByItemID, getEmployee, hrCancel, setDuplicate, getLeaveDay
}