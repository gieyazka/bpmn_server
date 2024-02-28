var axios = require('axios');
import express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
var FormData = require('form-data');
//import { ExecuteDecisionTable, ExecuteCondition, ExecuteExpression } from 'dmn-engine';
var mongoose = require('mongoose');
const EventEmitter = require('node:events');
const _ = require('lodash')
import FS = require('fs');

import { BPMNServer, Behaviour_names, CacheManager, Logger, dateDiff } from '..';
import { configuration as config, configuration } from '../configuration';

import { Common } from './common';
import CustomFn from '../custom_function/index'
import CustomNode from '../custom_node/index'
import EleaveFn from '../Eleave_function/index'
import { customAlphabet } from 'nanoid'

const dayjs = require('dayjs')

var utc = require('dayjs/plugin/utc')
var timezone = require('dayjs/plugin/timezone')
// dayjs.extend(utc)
// dayjs.extend(timezone)

// dayjs.tz.setDefault("Asia/Bangkok")
const AwaitEventEmitter = require('await-event-emitter').default



/* GET users listing. */

console.log("api.ts");

const awaitAppDelegateFactory = (middleware) => {
    return async (req, res, next) => {
        try {
            await middleware(req, res, next)
        } catch (err) {
            next(err)
        }
    }
}

function loggedIn(req, res, next) {

    let apiKey = req.header('x-api-key');

    if (!apiKey) {
        apiKey = req.query.apiKey;
    }

    if (apiKey == process.env.API_KEY) {
        next();
    } else {
        res.json({ errors: 'missing or invalid "x-api-key"' });
    }
}




export class API extends Common {
    get bpmnServer() { return this.webApp.bpmnServer; }


    config() {

        var router = express.Router();
        // var bpmnServer = this.bpmnServer;
        const logger = new Logger({
            toConsole: false,
            // callback: (logDAta) => {
            //     console.log('70logDAta', logDAta)
            // }
        });

        const bpmnServer = new BPMNServer(configuration, logger, { cron: false, noWait: false });
        const listener = new AwaitEventEmitter()
        // const listener = new EventEmitter();
        listener.on('all', async ({ context, event }) => {
            try {
                if (context.item) {

                    // console.log(176, context.item._status, "||", context.item.element.name, context.item.element?.name === "End", context.item.element.id);
                    if (context.item.element.name?.includes("start_flow")) {

                        if (context.item._status === 'start') {

                            const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 2)
                            context.execution.instance.task_id = `EF-${dayjs().format('YYMMDDmmss')}-${nanoid()}`

                            // console.log('context.execution.instance.data', context.execution.instance.data.createdAt, dayjs().format('YYYYMMDD'))
                            if (context.execution.instance.data.createdAt !== dayjs().format('YYYYMMDD') && context.execution.instance.data.refID === undefined) {
                                console.log('Issue Date invalid', context.execution.instance.data.createdAt, dayjs().toDate(), dayjs().format('YYYYMMDD HH:mm'))
                                throw new Error("Issue Date invalid")
                            } else {
                                context.execution.instance.createdAt = context.execution.instance.data.createdAt
                                delete context.execution.instance.data.createdAt
                            }
                            // context.execution.instance.createdAt = context.execution.instance.data.createdAt
                            if (context.execution.instance.data.requester !== undefined) {
                                if (context.execution.instance.data.requester.name === undefined) {
                                    //TODO : get name

                                    const employee = await CustomFn.getUserInfo(context.execution.instance.data.requester.empid)
                                    const getEmail = await CustomFn.getEmpByEmpID(context.execution.instance.data.requester.empid)
                                    if (employee.data.status === true) {
                                        const empData = employee.data.employee
                                        context.execution.instance.data.requester.name = empData.name_en
                                        context.execution.instance.data.requester.name_th = (empData.title ? empData.title : "") + empData.name_th + " " + empData.surname_th
                                        context.execution.instance.data.requester.email = getEmail.data.employee?.email
                                        context.execution.instance.data.requester.departmentPayroll = empData.department
                                        context.execution.instance.data.requester.position = empData.position_th
                                    } else {
                                        throw new Error("No employee id")
                                    }
                                    // context.execution.instance.data.requester.level = employee.level.level
                                }
                            }

                            //TODO: check in payload from resend
                            const requester = context.execution.instance.data.requester
                            // if (requester.empid === "AH10002500") {
                            //     try {

                            //         console.log('date : here', dayjs().toDate(), dayjs().format("DD/MM/YYYY HH:mm"))
                            //         console.log('date : js', new Date())
                            //     } catch (error) {

                            //     }
                            //     throw new Error("Issue Date invalid")
                            // }
                            const submitActionLog = {

                                name: requester.name,
                                email: requester.email,
                                empid: requester.empid,
                                position: requester.position,
                                level: requester.level,
                                section: requester.section,
                                sub_section: requester.sub_section,
                                company: requester.companyPayroll,
                                department: requester.departmentPayroll,
                                filesURL: null,
                                date: dayjs().toDate(),
                                action:
                                    "Submit",
                                remark:
                                    "Submit form",

                            }
                            const refID = context.execution.instance.data.refID
                            if (refID) {
                                submitActionLog.remark = `from Task_ID : ${refID}`
                                const getTask = await CustomFn.getTaskByTaskId({ task_id: refID })
                                context.execution.instance.issueDate = dayjs(getTask.issueDate).toDate()
                                context.execution.instance.createdAt = dayjs(getTask.issueDate).format('YYYYMMDD')
                                context.execution.instance.startedAt = dayjs(getTask.issueDate).toDate()
                                context.execution.instance.data.newTaskID = context.execution.instance.task_id
                                delete context.execution.instance.data.issueDate
                                await EleaveFn.setDuplicate(context.execution.instance.data.refID)
                            } else {
                                context.execution.instance.issueDate = dayjs().toDate()
                            }
                            context.execution.instance.data.actionLog = [submitActionLog]
                        }
                    }
                    if (context.item.element.name?.includes("check_resend")) {
                        if (context.item._status === 'start') {




                        }
                    }
                    if (context.item.element.name?.includes("check_rule")) {

                        if (context.item._status === 'start') {
                            const [name, condition, level] = context.item.element.name.split(":")

                            //TODO: add company for check if need
                            const {
                                empid, company, department, section
                            } = context.execution.instance.data.requester
                            const res = await CustomNode.checkBoolLevel({ empid, condition, level, company, department })
                            let checkStatus = res.data.status === undefined ? _.isEmpty(res.data.status) : res.data.status
                            context.item.token.execution.output = { checkStatus: checkStatus }

                            // console.log(context.item);


                        }
                    }
                    if (context.item.element.name?.includes("get_position")) {

                        if (context.item._status === 'start') {
                            const splitArr = context.item.element.name.split(":")
                            const [name, level] = splitArr
                            let {
                                company, department, section, sub_section
                            } = context.execution.instance.data.requester
                            if (splitArr.length > 2) {
                                [company, department, section] = splitArr.slice(2)
                            }
                            // console.table({ company, department, section, level })
                            const res = await CustomNode.getEmpPosition({ company, department, section, sub_section, level })
                            // throw new Error("test");
                            let checkStatus = res.data.status
                            if (res.data.status) {
                                if (res.data.data?.employee === null) {
                                    checkStatus = false
                                }
                            }
                            context.item.token.execution.output = { checkStatus: checkStatus, positionData: res.data.data?.employee }
                        }
                    }

                    if (context.item.element.name?.includes("send_email_resend")) {
                        // throw new Error("Test Error");

                        if (context.item._status === 'start') {

                            // let emailData = {
                            //     "empid": "AH10002500",

                            //     "reason": "sick kub",
                            //     "data": context.execution.instance.data,
                            //     "flowName": "leave_flow",
                            //     "linkArrove": `${process.env.Portal_url_external}/email/${context.item.id}/resend/true`,
                            //     "linkReject": `${process.env.Portal_url_external}/email/${context.item.id}/resend/false`,
                            //     // "linkArrove": `${process.env.WorkFlow_URL}/api/engine/invoke/${context.item.id}/approved/true`,
                            //     // "linkReject": `${process.env.WorkFlow_URL}/api/engine/invoke/${context.item.id}/approved/false`,
                            //     "bcc": ["pokkate.e@aapico.com", "sawanon.w@aapico.com"]
                            // }
                            // const resEmail = CustomApi.sendStrapi_email(emailData)

                            // context.execution.instance.data.status = "Waiting"
                        }


                        if (context.item._status === 'end') {
                            //onEmail Action
                            context.item.token.execution.output = { checkStatus: context.execution.instance.data.resend }
                            // let appList = context.execution.instance.data.approverList
                            //     || []
                            if (context.execution.instance.data.flowName === "leave_flow") {
                                context.execution.instance.data.approverList = []
                            }

                            if (context.execution.instance.data.requester !== undefined) {
                                if (context.execution.instance.data.requester.name === undefined) {

                                    const employee = await CustomFn.getUserInfo(context.execution.instance.data.requester.empid)
                                    const getEmail = await CustomFn.getEmpByEmpID(context.execution.instance.data.requester.empid)

                                    if (employee.data.status === true) {
                                        const empData = employee.data.employee
                                        context.execution.instance.data.requester.name = empData.name_en
                                        context.execution.instance.data.requester.name_th = (empData.title ? empData.title : "") + empData.name_th + " " + empData.surname_th
                                        context.execution.instance.data.requester.email = getEmail.data.employee?.email
                                        context.execution.instance.data.requester.departmentPayroll = empData.department
                                        context.execution.instance.data.requester.position = empData.position_th
                                    } else {
                                        throw new Error("No employee id")
                                    }
                                }
                            }



                            let action = "Resubmit"
                            if (context.execution.execution.input.resend === false) {
                                context.execution.instance.data.status = "Cancel"
                                action = "Cancel"
                            }
                            let logList = context.execution.instance.data.actionLog
                                || []
                            let arriveTime = null
                            if (logList.length > 0) {
                                arriveTime = dayjs(logList[logList.length - 1].date).toDate()
                            }

                            const requester = context.execution.instance.data.requester
                            logList.push({
                                name: requester.name,
                                email: requester.email,
                                empid: requester.empid,
                                position: requester.position,
                                level: requester.level,
                                section: requester.section,
                                sub_section: requester.sub_section,
                                company: requester.company,
                                arriveTime,
                                department: requester.department,
                                date: dayjs().toDate(),
                                filesURL: null,
                                action: action,
                                remark:
                                    context.execution.execution.input.remark,

                            })


                            context.execution.instance.data.actionLog = logList


                        }
                    }





                    if (context.item.element.name?.includes("send_email_approve")) {
                        if (context.item._status === 'start') {

                            const splitArr = context.item.element.name.split(":")
                            const [name, levelFlow] = splitArr

                            let {
                                empid, company, department, section, sub_section
                            } = context.execution.instance.data.requester

                            let res
                            if (levelFlow === 'head') {
                                ///get Head
                                res = await CustomNode.getHead({ empid, company, department })
                            } else if (levelFlow === 'findHead') {
                                let level = context.execution.instance.data.requester.level

                                let approveList = context.execution.instance.data.approverList

                                if (approveList !== undefined) {

                                    level = approveList[approveList.length - 1].level
                                    company = approveList[approveList.length - 1].company
                                    department = approveList[approveList.length - 1].department
                                    section = approveList[approveList.length - 1].section
                                }
                                if (!level) {
                                    level = "M2"
                                }
                                res = await CustomNode.findHead({ company, department, section, level })
                                console.log('res FindHead', res.data)
                                if (res.data.status === false) {
                                    throw Error("Cannot found head")
                                }
                            } else {
                                if (splitArr.length > 2) {
                                    [company, department, section] = splitArr.slice(2)
                                }

                                res = await CustomNode.getEmpPosition({ company, department, section, sub_section, level: levelFlow })
                            }
                            // console.log('res', res.data)
                            let approverData: any = { company, department, section, levelFlow }
                            // console.log('344', res.data.data)
                            if (res.data.status) {


                                // send Email
                                let approverSection = res.data.data.section
                                let approverEmployee = res.data.data.employee
                                let approverLevel = res.data.data.level
                                let approverControlLevel = res.data.data.control_level
                                approverData = {
                                    name: (approverEmployee.prefix ? approverEmployee.prefix + "." : "") + approverEmployee.firstName + " " + approverEmployee.lastName,
                                    email: approverEmployee.email.toLowerCase(),
                                    // email: "pokkate.e@aapico.com",
                                    arriveTime: dayjs().toDate(),
                                    empid: approverEmployee.empid,
                                    // empid: "AH10002500",
                                    position: approverLevel.position,
                                    priority: approverLevel.priority,
                                    // level: "E2",
                                    realLevel: approverLevel.level,
                                    level: approverControlLevel.level,
                                    section: approverSection ? approverSection.name : null,
                                    company, department,

                                }

                            }
                            let emailData = {
                                "empid": approverData.empid,
                                // "empid": "AH10002500",
                                "data": context.execution.instance.data,
                                "from": context.execution.instance.data.requester.name,
                                "reason": context.execution.instance.data.reason,
                                "flowName": context.execution.instance.data.flowName,
                                "linkArrove": `${process.env.Portal_url_external}/email/${context.item.id}/approved/true/${approverData.email}`,
                                "linkReject": `${process.env.Portal_url_external}/email/${context.item.id}/approved/false/${approverData.email}`,
                                // "linkArrove": `${process.env.WorkFlow_URL}/api/engine/invoke/${context.item.id}/approved/true`,
                                // "linkReject": `${process.env.WorkFlow_URL}/api/engine/invoke/${context.item.id}/approved/false`,
                                "bcc": ["pokkate.e@aapico.com", "sawanon.w@aapico.com", "thanaporn.s@aapico.com"]
                            }
                            try {
                                console.log('emailData', emailData.empid)
                                const resEmail = CustomFn.sendStrapi_email(emailData)

                            } catch (error) {
                                console.log('error 376', error)
                            }

                            // console.log('approverData', approverData)
                            context.execution.instance.data.currentApprover = [approverData] // to Array
                            context.execution.instance.data.status = "Waiting"

                        }


                        if (context.item._status === 'end') {
                            //onEmail Action
                            const additionApprover = context.execution.execution.input.additionApprover
                            const { email } = additionApprover
                            let findApprover = undefined
                            if (email) {
                                if (_.isArray(context.execution.instance.data.currentApprover)) {
                                    console.log('404', context.execution.instance.data.currentApprover)
                                    findApprover = context.execution.instance.data.currentApprover.find(d => d.email === email)
                                    if (!findApprover) {
                                        throw "invalid email"
                                    }
                                }
                            }
                            const isApprove = additionApprover.approved

                            let appList = context.execution.instance.data.approverList
                                || []
                            let logList = context.execution.instance.data.actionLog
                                || []
                            const oldCurApprover = email ? {} : context.execution.instance.data.currentApprover
                            let newApprover = {
                                ...oldCurApprover, ...context.execution.instance.data.newCurrentApprover,
                                date: dayjs().toISOString(),
                                action: isApprove ? "Approved" : "Rejected"
                            }

                            if (findApprover) {
                                newApprover = { ...newApprover, ...findApprover }
                            }
                            if (context.execution.instance.data.additionApprover !== undefined) {
                                context.item.token.execution.output = { checkStatus: isApprove }
                                delete additionApprover.email
                                newApprover = { ...newApprover, ...additionApprover }
                            }
                            if (newApprover["0"]) {
                                delete newApprover["0"]
                            }
                            logList.push(newApprover)
                            appList.push(newApprover)
                            context.execution.instance.data.actionLog = logList
                            context.execution.instance.data.approverList
                                = appList
                            // console.log('406', context.item.token.execution.output)
                            context.execution.instance.data.currentApprover = null
                            context.execution.instance.data.status = isApprove ? "Waiting" : "Rejected"
                            // delete context.execution.execution.input.additionApprover
                            delete context.execution.instance.data.newCurrentApprover
                            delete context.execution.instance.data.approved
                            delete context.execution.instance.data.additionApprover
                            console.log('end send_email approve');
                            // throw "test JAAAA"
                        }
                    }

                    if (context.item.element.name?.includes("send_approve")) {
                        if (context.item._status === 'start') {

                            const splitArr = context.item.element.name.split(":")
                            const [name, levelFlow] = splitArr

                            const userInfo = await CustomFn.getUserInfo(context.execution.instance.data.requester.empid)
                            if (userInfo.data.status) {
                                let { company, emp_type } = userInfo.data.employee
                                if (company === "AF" || company === "APC") {
                                    if (emp_type === "Contract") {
                                        emp_type = "Sub-Contract"
                                    }
                                }
                                // if (emp_type === "Daily" || emp_type === "Monthly") {
                                // } else {
                                //     company = "Sub_Contract"
                                // }
                                // emp_type = "Monthly" //TODO: For Test
                                // company = "AERP" //TODO: For Test
                                const getHrLeave = await EleaveFn.getHRLeave(company, emp_type)
                                if (!getHrLeave) {
                                    throw new Error("No Hr leave Conditions");
                                }
                                const checkHr = getHrLeave.responsible.find(d => {
                                    return d.type === emp_type //TODO: may be check company too
                                })
                                if (!checkHr) {
                                    throw new Error("No Hr leave Conditions");
                                }
                                const approverData = []
                                if (_.isArray(checkHr.empID)) {
                                    for (let index = 0; index < checkHr.empID.length; index++) {
                                        const hrEmpID = checkHr.empID[index];
                                        const email = checkHr.email[index];
                                        // const hrEmpID = checkHr.name[index];


                                        const hrLdap = await CustomFn.getLDAPDataByEmpID(hrEmpID)
                                        // console.log('hrLdap', hrLdap.data)
                                        const hrOrg = await CustomFn.getEmpByEmpID(hrEmpID)
                                        if (hrLdap.data.employee === undefined || hrOrg.data.employee === undefined) {
                                            throw (`No setting  type : ${emp_type} with company : ${company} `);
                                        }
                                        approverData.push({
                                            name: hrOrg.data.employee.prefix + "." + hrOrg.data.employee.firstName + " " + hrOrg.data.employee.lastName,
                                            email: hrOrg.data.employee.email.toLowerCase(),
                                            arriveTime: dayjs().toDate(),
                                            empid: hrEmpID,
                                            // empid: "AH10002500",
                                            // position: approverLevel.position,
                                            // priority: approverLevel.priority,
                                            // level: "E2",

                                            // level: approverLevel.level,
                                            section: null,
                                            company: hrLdap.data.employee.company, department: hrLdap.data.employee.department,

                                        })
                                    }
                                } else {
                                    const hrEmpID = checkHr.empID;
                                    const email = checkHr.email;
                                    // const hrEmpID = checkHr.name[index];


                                    const hrLdap = await CustomFn.getLDAPDataByEmpID(hrEmpID)

                                    const hrOrg = await CustomFn.getEmpByEmpID(hrEmpID)
                                    if (hrLdap.data.employee === undefined || hrOrg.data.employee === undefined) {
                                        throw (`No setting  type : ${emp_type} with company : ${company} `);
                                    }
                                    approverData.push({
                                        name: hrOrg.data.employee.prefix + "." + hrOrg.data.employee.firstName + " " + hrOrg.data.employee.lastName,
                                        email: hrOrg.data.employee.email.toLowerCase(),
                                        arriveTime: dayjs().toDate(),
                                        empid: hrEmpID,
                                        // empid: "AH10002500",
                                        // position: approverLevel.position,
                                        // priority: approverLevel.priority,
                                        // level: "E2",

                                        // level: approverLevel.level,
                                        section: null,
                                        company: hrLdap.data.employee.company, department: hrLdap.data.employee.department,

                                    })
                                }
                                console.log('approverData', approverData)

                                context.execution.instance.data.currentApprover = approverData
                                context.execution.instance.data.status = "Waiting"
                            }



                        }


                        if (context.item._status === 'end') {
                            //onEmail Action
                            const isApprove = context.execution.execution.input.additionApprover.approved
                            let appList = context.execution.instance.data.approverList
                                || []
                            let logList = context.execution.instance.data.actionLog
                                || []
                           
                            const setNewApprover = context.execution.instance.data.newCurrentApprover ?? context.execution.instance.data.currentApprover ? context.execution.instance.data.currentApprover[0] : null
                            let newApprover = {
                                ...setNewApprover,
                                date: dayjs().toISOString(),
                                action: isApprove ? "Approved" : "Rejected"
                            }
                            if (context.execution.instance.data.additionApprover !== undefined) {
                                context.item.token.execution.output = { checkStatus: isApprove }
                                if (context.execution.instance.data.additionApprover.email === undefined) {
                                    delete context.execution.instance.data.additionApprover.email
                                }
                                newApprover = { ...newApprover, ...context.execution.instance.data.additionApprover }
                            }
                            logList.push(newApprover)
                            appList.push(newApprover)

                            context.execution.instance.data.actionLog = logList
                            context.execution.instance.data.approverList = appList

                            context.execution.instance.data.currentApprover = null
                            context.execution.instance.data.status = isApprove ? "Waiting" : "Rejected"
                            delete context.execution.instance.data.newCurrentApprover
                            delete context.execution.instance.data.approved
                            delete context.execution.instance.data.additionApprover
                            // console.log( context.item);


                        }
                    }

                    if (context.item.element?.name?.includes("notify_user")) {
                        if (context.item._status === 'end') {
                            try {
                                if (context.execution.instance.data.status !== "Cancel") {


                                    // console.log('context.item.token.execution.output', context.item.token.execution.output)
                                    // console.log('context.execution.instance.data', context.execution.instance.data)
                                    const { checkStatus } = context.item.token.execution.output
                                    const { approverList, flowName, requester } = context.execution.instance.data
                                    const lastApprover = _.last(approverList)

                                    let doc_type = flowName
                                    if (flowName === "leave_flow") {
                                        doc_type = "E-leave"
                                    }
                                    // console.log('lastApprover', lastApprover)
                                    const createNotifyEss = await axios({
                                        url: `${process.env.ESS_URL}/requestinstances`,
                                        method: "POST",
                                        data: {
                                            details: {
                                                status: checkStatus ? "Completed" : "Rejected",
                                                task_id: context.execution.instance.task_id
                                            },
                                            action_by: `${lastApprover.name}`,
                                            isUnRead: true,
                                            doc_type,
                                            emp_id: requester.empid
                                        }
                                    })
                                }
                            } catch (error) {
                                console.log('Error Send notify')
                            }
                        }
                    }
                    if (context.item.element?.name?.includes("end_flow")) {
                        // throw new Error("test Hr");

                        if (context.item._status === 'end') {
                            if (context.execution.instance.data.status === "Waiting") {
                                context.execution.instance.data.status = "Success"
                            }

                        }
                    }
                    // console.log("name : ", context.item.element.name);
                    // console.log("Input : ", context.execution.execution.input);
                    // console.log("DATA :", context.execution.instance.data);
                    // console.log("Output : ", context.item.token.execution.output);
                }
                context.execution.instance.data.lastUpdate = dayjs().toISOString()



            } catch (error) {

                throw error

            }

        });
        bpmnServer.listener = listener
        // console.log(bpmnServer.engine)
        router.get('/datastore/findItems', loggedIn, awaitAppDelegateFactory(async (request, response) => {

            let query;
            if (request.body.query) {
                query = request.body.query;
            }
            else
                query = request.body;

            let items;
            let errors;
            try {
                items = await this.bpmnServer.dataStore.findItems(query);
            }
            catch (exc) {
                errors = exc.toString();
                console.log(errors);
            }
            response.json({ errors: errors, items });
        }));

        router.get('/datastore/findInstances', loggedIn, awaitAppDelegateFactory(async (request, response) => {


            console.log(request.body);
            let query;
            if (request.body.query) {
                query = request.body.query;
            }
            else
                query = request.body;
            console.log(query);
            let instances;
            let errors;
            try {

                instances = await this.bpmnServer.dataStore.findInstances(query, 'full');
            }
            catch (exc) {
                errors = exc.toString();
                console.log(errors);
            }
            response.json({ errors: errors, instances });
        }));
        /*
        returns list of current instances running or ended
         */
        router.get('/engine/status', loggedIn, awaitAppDelegateFactory(async (request, response) => {

            try {

                var list = [];
                CacheManager.liveInstances.forEach(exec => {
                    list.push({ instance: exec.instance, currentItem: exec.item.id, currentElement: exec.item.elementId, status: exec.instance.status });
                });
                response.json(list);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        }));

        router.post('/engine/start/:name?', loggedIn, awaitAppDelegateFactory(async (request, response) => {
            // console.log(200, mongoose.connection.readyState);
            try {
                let name = request.params.name;
                if (!name)
                    name = request.body.name;
                let data = request.body.data;
                console.log('name', name)
                let userId;

                let startNodeId, options = {}, userKey;
                if (request.body.startNodeId) {
                    startNodeId = request.body.startNodeId;
                }
                if (request.body.options) {
                    options = request.body.options;
                }

                if (request.body.userId) {
                    userId = request.body.userId;
                }
                // customFn()

                let context;
                try {

                    context = await bpmnServer.engine.start(name, data, null).then(res => res).catch(err => {
                        console.log('err', err.stack)
                        return ({ status: 400, err: err.message })
                    });
                    if (context.status === 400) {

                        response.status(400).json(context);
                    } else {
                        if (context && context.execution) {
                            await CustomFn.clearLogsTask(context.execution?.instance?.task_id)
                        }
                        response.json(context.instance);

                    }
                } catch (error) {
                    console.log('error', error)
                    response.status(400).json(error);
                }
                // console.log(context);
                // console.log(204,await CustomApi.getCurrentApprove());

                // response.json(context.instance);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        }));



        router.get('/engine/invoke/:id/:field/:value', awaitAppDelegateFactory(async (request, response) => {

            let params = request.params;
            console.log("params----", params);
            let query, data;
            query =
            {
                "items.id": params.id
            }
            let value = params.value
            if (params.field === "approved") {
                if (params.value === "true") {
                    value = true
                } else {
                    value = false
                }
            }
            data = {
                [params.field]: value
            }

            let context;
            let instance;
            let errors;
            try {
                // let Datacontext = await this.bpmnServer.engine.get(query);
                // console.log(Datacontext);

                context = await bpmnServer.engine.invoke(query, data);
                instance = context.instance;
                if (context && context.errors)
                    errors = context.errors.toString();
            }
            catch (exc) {
                errors = exc.toString();
                console.log(errors);
            }
            response.json({ errors: errors, instance });
        }));
        router.post('/engine/invoke', upload.array('files'), awaitAppDelegateFactory(async (request, response) => {
            // const data = request
            // return 
            const { task_id, email, field, fieldData, user, haveFile, remark, ...receiveData } = JSON.parse(request.body.data);
            if (!task_id) {
                response.status(404).json({ error: "invalid task_id" })
            }

            const files = request.files;
            // console.log(406, task_id, field, fieldData, user, haveFile, remark);
            let filesURL = []
            let context;
            let instance;
            let errors;

            // return ;

            let query, data;

            data = {

                ...receiveData,

            }
            if (field) {
                if (haveFile) {
                    const formData = new FormData();

                    files.forEach(element => {

                        formData.append("files", element.buffer, element.originalname);
                    });
                    const headers = {
                        headers: {
                            // Authorization: "Bearer " + localStorage.getItem("QCAPPjwt"),
                            "Content-Type": "multipart/form-data",
                        },
                    };
                    const res = await axios.post(`${process.env.Strapi_URL}/api/upload`, formData, headers);
                    if (res.status === 200) {
                        if (Array.isArray(res.data)) {
                            res.data.forEach(element => {
                                filesURL.push(element.url)
                            });
                        }
                    }


                }
                // data[field] = fieldData
                data.additionApprover = {
                    email: email,
                    filesURL: filesURL.length > 0 ? filesURL : null,
                    remark: remark,
                }
                data.additionApprover[field] = fieldData
            } else {
                data.additionApprover[field] = fieldData
            }
            //TODO: add condition to Data console.log('',)
            if (user != null) {
                data.newCurrentApprover = {
                    name: user.fullName,
                    email: user.email,
                    empid: user.username,
                    position: user.position,
                }
                // if (user.level) {
                //     data.newCurrentApprover.level = user.level
                // }
                if (user.section) {
                    data.newCurrentApprover.section = user.section
                }
                if (user.sub_section) {
                    data.newCurrentApprover.sub_section = user.sub_section ?? null
                }
                if (user.company) {
                    data.newCurrentApprover.company = user.company
                }
                if (user.department) {
                    data.newCurrentApprover.department = user.department
                }

                // await CustomApi.getMyHierachies(user.username)
            }

            // let Datacontext = await this.bpmnServer.engine.get(query);
            // console.log('data813', data)

            // throw "error"
            const getTask = await CustomFn.getTaskByItemID(task_id)
            if (!getTask) {
                throw "Cannot Find Task"
            }
            query = {
                "items.id": task_id
            }

            let new_id = _.last(getTask.items).elementId
            if (_.last(getTask.items).status === 'end') {
                const newItem = deleteLastEnd(getTask.items)
                const test = await CustomFn.setNewItem(getTask.task_id, newItem)

                new_id = _.last(newItem).elementId
                query = {
                    "items.id": _.last(newItem).id
                }
            }
            try {
                console.log('', { task_id: getTask.task_id, "items.elementId": new_id }
                )
                // context = await bpmnServer.engine.invoke(
                //     { task_id: getTask.task_id, "items.elementId": new_id }
                //     , data);
                context = await bpmnServer.engine.invoke(query, data);


                if (context && context.errors) {
                }

                if (context && context.errors) {

                    errors = context.errors.toString();
                }
                // response.setHeader('Content-Type', 'text/html');

                if (context && context.execution) {
                    await CustomFn.clearLogsTask(context.execution?.instance?.task_id)
                }
                // instance = context.instance;


                response.status(200).json({ success: 'success' })
            }
            catch (exc) {

                errors = exc.toString();
                console.log(925, errors);
                response.status(400).json({ errors: errors });
            }
        }));


        router.post('/engine/resend', upload.array('files'), awaitAppDelegateFactory(async (request, response) => {
            // const data = request
            // return 
            const { task_id, isResend, user, haveFile, remark, ...receiveData } = JSON.parse(request.body.data);
            const files = request.files;
            let filesURL = []
            let context;
            let instance;
            let errors;

            // return ;
            try {
                if (haveFile) {
                    const formData = new FormData();

                    files.forEach(element => {

                        formData.append("files", element.buffer, element.originalname);
                    });
                    const headers = {
                        headers: {
                            // Authorization: "Bearer " + localStorage.getItem("QCAPPjwt"),
                            "Content-Type": "multipart/form-data",
                        },
                    };
                    const res = await axios.post(`${process.env.Strapi_URL}/api/upload`, formData, headers);
                    if (res.status === 200) {
                        if (Array.isArray(res.data)) {
                            res.data.forEach(element => {
                                filesURL.push(element.url)
                            });
                        }
                    }


                }
                let query, data;
                query =
                {
                    "items.id": task_id
                }
                data = {
                    ...receiveData,

                }
                data['resend'] = isResend ?? true
                data['remark'] = remark
                context = await bpmnServer.engine.invoke(query, data);
                if (context && context.errors) {

                    errors = context.errors.toString();
                }
                // response.setHeader('Content-Type', 'text/html');
                if (context && context.execution) {
                    await CustomFn.clearLogsTask(context.execution?.instance?.task_id)
                }
                response.status(200).json({ success: 'success' })
            }
            catch (exc) {
                errors = exc.toString();
                console.log(errors);
                response.status(400).json({ errors: errors });
            }
        }));



        router.get('/engine/get', loggedIn, awaitAppDelegateFactory(async (request, response) => {

            let query;
            if (request.body.query) {
                query = request.body.query;
            }
            else
                query = request.body;

            let context;
            let instance;
            let errors;
            try {
                context = await this.bpmnServer.engine.get(query);
                instance = context.instance;
            }
            catch (exc) {
                errors = exc.toString();
                console.log(errors);
            }
            response.json({ errors: errors, instance });
        }));


        /*
         *      response = await bpmn.engine.throwMessage(messageId,data);
        */
        router.post('/engine/throwMessage', loggedIn, awaitAppDelegateFactory(async (request, response) => {

            try {
                let messageId = request.body.messageId;
                console.log(' MessageId ' + messageId);
                let data = request.body.data;
                let messageMatchingKey = {};

                if (request.body.messageMatchingKey)
                    messageMatchingKey = request.body.messageMatchingKey;

                let context;
                // console.log(data);

                context = await this.bpmnServer.engine.throwMessage(messageId, data, messageMatchingKey);
                if (context)
                    response.json(context.instance);
                else
                    response.json({});

            }
            catch (exc) {
                console.log(exc);
                response.json({ error: exc.toString() });
            }
        }));


        /*
         *  engine.throwSignal     - issue a signal by id
         *  ------------------
         *      same as message except multiple receipients
         *
         *
         *
         */

        router.post('/engine/throwSignal', loggedIn, awaitAppDelegateFactory(async (request, response) => {

            try {
                let signalId = request.body.signalId;
                console.log(' Signal Id: ' + signalId);
                let data = request.body.data;
                let messageMatchingKey = {};

                if (request.body.messageMatchingKey)
                    messageMatchingKey = request.body.messageMatchingKey;
                let context;

                context = await this.bpmnServer.engine.throwSignal(signalId, data, messageMatchingKey);
                response.json(context);
            }
            catch (exc) {
                console.log(exc);
                response.json({ error: exc.toString() });
            }
        }));
        ////
        var fsx = require('fs-extra');       //File System - for file manipulation

        router.post('/definitions/import/:name?', loggedIn, awaitAppDelegateFactory(async (request, response) => {

            let name = request.params.name;
            if (!name)
                name = request.body.name;

            var fstream;

            try {
                if (request.busboy) {
                    request.pipe(request.busboy);
                    request.busboy.on('file', function (fileUploaded, file, filename) {
                        console.log("Uploading: ", filename);

                        //Path where image will be uploaded
                        const filepath = __dirname + '/../tmp/' + filename.filename;
                        fstream = fsx.createWriteStream(filepath);
                        file.pipe(fstream);
                        fstream.on('close', async function () {
                            console.log("Upload Finished of " + filename.filename);
                            //const name = filename.filename;
                            const source = fsx.readFileSync(filepath,
                                { encoding: 'utf8', flag: 'r' });
                            await bpmnServer.definitions.save(name, source, null);

                            response.json("OK");

                        });
                    });
                }
                else {
                    response.json("No file to import");
                }

            }
            catch (exc) {

                console.log('request.pipe error:', exc);
                response.json(exc);
            }

        }));


        router.post('/definitions/rename', loggedIn, async function (req, response) {

            let name = req.body.name;
            let newName = req.body.newName;
            console.log('renaming ', name, newName);
            try {
                var ret = await bpmnServer.definitions.renameModel(name, newName);
                console.log('ret:', ret);
                response.json(ret);
            }
            catch (exc) {
                console.log('error:', exc);
                response.json({ errors: exc });
            }
        });

        router.post('/definitions/delete', loggedIn, async function (req, response) {

            let name = req.body.name;
            console.log('deleting ', name);
            try {
                var ret = await bpmnServer.definitions.deleteModel(name);
                console.log('ret: ', ret);
                response.json(ret);
            }
            catch (exc) {
                console.log('error:', exc);
                response.json({ errors: exc.toString() });
            }
        });

        router.get('/definitions/list', loggedIn, async function (req, response) {

            let list = await bpmnServer.definitions.getList();
            console.log(list);
            response.json(list);
        });
        router.get('/definitions/load/:name?', loggedIn, async function (request, response) {

            console.log(request.params);
            let name = request.params.name;

            let definition = await bpmnServer.definitions.load(name);
            response.json(JSON.parse(definition.getJson()));
        });
        router.get('/source/load/:name?', loggedIn, async function (request, response) {

            let name = request.params.name;

            let definition = await bpmnServer.definitions.load(name);
            const data = {
                items: definition.getJson(),
                name: definition.name,
                source: definition.source
            }
            response.json(data);
        });
        router.delete('/datastore/deleteInstances', loggedIn, awaitAppDelegateFactory(async (request, response) => {

            let query;
            if (request.body.query) {
                query = request.body.query;
            }
            else
                query = request.body;


            let errors;
            let result;
            try {
                result = await this.bpmnServer.dataStore.deleteInstances(query);
            }
            catch (exc) {
                errors = exc.toString();
                console.log(errors);
            }
            response.json({ errors: errors, result });

        }));

        router.get('/shutdown', loggedIn, async function (req, res) {

            let instanceId = req.query.id;

            await this.bpmnServer.cache.shutdown();

            let output = ['Complete ' + instanceId];
            console.log(" deleted");
            display(res, 'Show', output);
        });
        router.get('/restart', loggedIn, async function (req, res) {

            let instanceId = req.query.id;

            await this.bpmnServer.cache.restart();

            let output = ['Complete ' + instanceId];
            console.log(" deleted");
            display(res, 'Show', output);
        });
        router.put('/rules/invoke', loggedIn, awaitAppDelegateFactory(async (request, response) => {
            /*
             * 
             * 
        export async function WebService(request, response) {
        console.log(request);
        console.log(response);
        let { definition, data, options, loadFrom } = request.body;
        response.json(Execute(request.body));
        }
             */
            try {
                throw new Error("Decision Table not supported this release.");
                // await response.json(ExecuteDecisionTable(request.body));
                //await WebService(request, response);
            }
            catch (exc) {
                console.log(exc);
                response.json({ errors: JSON.stringify(exc, null, 2) });
            }
        }));

        return router;
    }
}
async function display(res, title, output, logs = [], items = []) {

    console.log(" Display Started");
    var instances = await this.bpmnServer.dataStore.findInstances({}, 'full');
    let waiting = await this.bpmnServer.dataStore.findItems({ items: { status: 'wait' } });

    waiting.forEach(item => {
        item.fromNow = dateDiff(item.startedAt);
    });

    let engines = this.bpmnServer.cache.list();

    engines.forEach(engine => {
        engine.fromNow = dateDiff(engine.startedAt);
        engine.fromLast = dateDiff(engine.lastAt);
    });

    instances.forEach(item => {
        item.fromNow = dateDiff(item.startedAt);
        if (item.endedAt)
            item.endFromNow = dateDiff(item.endedAt);
        else
            item.endFromNow = '';
    });

    res.render('index',
        {
            title: title, output: output,
            engines,
            procs: this.bpmnServer.definitions.getList(),
            debugMsgs: [], // Logger.get(),
            waiting: waiting,
            instances,
            logs, items
        });

}

export default router;



const deleteLastEnd = (itemArr) => {
    if (_.last(itemArr).status === 'end') {
        itemArr.pop()
        deleteLastEnd(itemArr);
    }
    return itemArr

}