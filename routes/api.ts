const axios = require('axios');
import express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer();
var FormData = require('form-data');
//import { ExecuteDecisionTable, ExecuteCondition, ExecuteExpression } from 'dmn-engine';
var mongoose = require('mongoose');
import FS = require('fs');

import { BPMNServer, Behaviour_names, CacheManager, Logger, dateDiff } from '..';
import { configuration as config, configuration } from '../configuration';

import { Common } from './common';
import CustomFn from '../custom_function/index'
import CustomNode from '../custom_node/index'
import _ from "lodash"
import { customAlphabet } from 'nanoid'

const dayjs = require('dayjs')
const AwaitEventEmitter = require('await-event-emitter').default
//const bpmnServer = new BPMNServer(config);

//const definitions = bpmnServer.definitions;


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
            toConsole: false
        });

        const bpmnServer = new BPMNServer(configuration, logger, { cron: false, noWait: false });
        const listener = new AwaitEventEmitter()
        listener.on('all', async ({ context, event }) => {
            try {
                // console.log(174, context.item?.element.name);

                if (context.item) {

                    // console.log(176, context.item._status, "||", context.item.element.name, context.item.element?.name === "End", context.item.element.id);
                    if (context.item.element.name?.includes("start_flow")) {
                        if (context.item._status === 'start') {
                            if (context.execution.instance.data.requester !== undefined) {
                                if (context.execution.instance.data.requester.name === undefined) {
                                    //TODO : get name
                                    // console.log(84);
                                    const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 2)
                                    context.execution.instance.task_id = `EF-${dayjs().format('YYMMDDmmss')}-${nanoid()}`
                                    context.execution.instance.createdAt = dayjs().format('YYYYMMDD')
                                    const employee = await CustomFn.getUserInfo(context.execution.instance.data.requester.empid)
                                    console.log('90', employee.data)
                                    if (employee.data.status === true) {
                                        const empData = employee.data.employee
                                        context.execution.instance.data.requester.name = empData.name_en
                                        context.execution.instance.data.requester.name_th = (empData.title ? empData.title : "") + empData.name_th + " " + empData.surname_th
                                        context.execution.instance.data.requester.email = empData.email ?? null
                                    } else {
                                        throw new Error("No employee id")
                                    }

                                    // context.execution.instance.data.requester.level = employee.level.level
                                }
                            }


                            //TODO: check in payload from resend

                            const requester = context.execution.instance.data.requester
                            const submitActionLog = {

                                name: requester.name,
                                email: requester.email,
                                empid: requester.empid,
                                position: requester.position,
                                level: requester.level,
                                section: requester.section,
                                sub_section: requester.sub_section,
                                company: requester.company,
                                department: requester.department,
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
                                context.execution.instance.issueDate = dayjs(context.execution.instance.data.issueDate).toDate()
                                context.execution.instance.data.newTaskID = context.execution.instance.task_id
                                delete context.execution.instance.data.issueDate
                                await CustomFn.setDuplicate(context.execution.instance.data.refID)
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
                            const res = await CustomNode.checkBoolLevel({ empid, condition, level, })
                            context.item.token.execution.output = { checkStatus: res.data.status ?? false }

                            // console.log(context.item);


                        }
                    }
                    if (context.item.element.name?.includes("get_position")) {

                        if (context.item._status === 'start') {
                            const splitArr = context.item.element.name.split(":")
                            const [name, level] = splitArr
                            let {
                                company, department, section
                            } = context.execution.instance.data.requester
                            if (splitArr.length > 2) {
                                [company, department, section] = splitArr.slice(2)
                            }
                            console.table({ company, department, section, level })
                            const res = await CustomNode.getEmpPosition({ company, department, section, level })
                            console.log('res', res.data)
                            // throw new Error("test");

                            context.item.token.execution.output = { checkStatus: res.data.status, positionData: res.data.data?.employee }
                        }
                    }

                    if (context.item.element.name?.includes("send_email_resend")) {

                        if (context.item._status === 'start') {

                            let emailData = {
                                "empid": "AH10002500",

                                "reason": "sick kub",
                                "data": context.execution.instance.data,
                                "flowName": "leave_flow",
                                "linkArrove": `${process.env.Portal_url}/email/${context.item.id}/resend/true`,
                                "linkReject": `${process.env.Portal_url}/email/${context.item.id}/resend/false`,
                                // "linkArrove": `${process.env.WorkFlow_URL}/api/engine/invoke/${context.item.id}/approved/true`,
                                // "linkReject": `${process.env.WorkFlow_URL}/api/engine/invoke/${context.item.id}/approved/false`,
                                "bcc": ["pokkate.e@aapico.com", "sawanon.w@aapico.com"]
                            }
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
                                    if (employee.data.status === true) {
                                        const empData = employee.data.employee
                                        context.execution.instance.data.requester.name = empData.name_en
                                        context.execution.instance.data.requester.name_th = (empData.title ? empData.title : "") + empData.name_th + " " + empData.surname_th
                                        context.execution.instance.data.requester.email = empData.email ?? null
                                    } else {
                                        throw new Error("No employee id")
                                    }
                                    // const hierachies = await CustomApi.getMyHierachies(context.execution.instance.data.requester.empid)
                                    // // console.log(86, hierachies)
                                    // context.execution.instance.data.requester.name = hierachies.employee.prefix ? hierachies.employee.prefix + "." : "" + hierachies.employee.firstName + " " + hierachies.employee.lastName
                                    // context.execution.instance.data.requester.level = hierachies.level.level
                                }
                            }



                            let action = "Resubmit"
                            if (context.execution.execution.input.resend === false) {
                                context.execution.instance.data.status = "Cancel"
                                action = "Cancle"
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
                            console.log('248', logList)

                            context.execution.instance.data.actionLog = logList


                        }
                    }






                    if (context.item.element.name?.includes("send_email_approve")) {

                        if (context.item._status === 'start') {

                            const splitArr = context.item.element.name.split(":")
                            const [name, levelFlow] = splitArr


                            let {
                                empid, company, department, section
                            } = context.execution.instance.data.requester

                            let res
                            if (levelFlow === 'head') {
                                ///get Head
                                res = await CustomNode.getHead({ empid })
                            } else if (levelFlow === 'findHead') {
                                let level = context.execution.instance.data.requester.level

                                let approveList = context.execution.instance.data.approverList
                                console.log('approveList', approveList)
                                if (approveList !== undefined) {
                                    console.log("last App Level ", approveList[approveList.length - 1].level);
                                    level = approveList[approveList.length - 1].level
                                    company = approveList[approveList.length - 1].company
                                    department = approveList[approveList.length - 1].department
                                    section = approveList[approveList.length - 1].section
                                }
                                console.table({ company, department, section, level });
                                if (!level) {
                                    level = "M4"
                                }
                                console.table({ company, department, section, level })
                                res = await CustomNode.findHead({ company, department, section, level })
                                console.log('320', res.data)
                            }
                            else {
                                if (splitArr.length > 2) {
                                    [company, department, section] = splitArr.slice(2)
                                }


                                res = await CustomNode.getEmpPosition({ company, department, section, level: levelFlow })
                            }
                            // console.log(116, res.data);

                            // console.log('238', levelFlow)
                            let approverData: any = { company, department, section, levelFlow }

                            if (res.data.status) {
                                // send Email
                                let approverSection = res.data.data.section
                                let approverEmployee = res.data.data.employee
                                let approverLevel = res.data.data.level
                                approverData = {
                                    name: approverEmployee.prefix ? approverEmployee.prefix + "." : "" + "" + approverEmployee.firstName + " " + approverEmployee.lastName,
                                    email: approverEmployee.email,
                                    arriveTime: dayjs().toDate(),
                                    empid: approverEmployee.empid,
                                    // empid: "AH10002500",
                                    position: approverLevel.position,
                                    priority: approverLevel.priority,
                                    // level: "E2",

                                    level: approverLevel.level,
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
                                "linkArrove": `${process.env.Portal_url}/email/${context.item.id}/approved/true`,
                                "linkReject": `${process.env.Portal_url}/email/${context.item.id}/approved/false`,
                                // "linkArrove": `${process.env.WorkFlow_URL}/api/engine/invoke/${context.item.id}/approved/true`,
                                // "linkReject": `${process.env.WorkFlow_URL}/api/engine/invoke/${context.item.id}/approved/false`,
                                "bcc": ["pokkate.e@aapico.com", "sawanon.w@aapico.com"]
                            }

                            const resEmail = CustomFn.sendStrapi_email(emailData)

                            context.execution.instance.data.currentApprover = approverData
                            context.execution.instance.data.status = "Waiting"
                        }


                        if (context.item._status === 'end') {
                            //onEmail Action


                            const isApprove = context.execution.execution.input.additionApprover.approved
                            let appList = context.execution.instance.data.approverList
                                || []
                            let logList = context.execution.instance.data.actionLog
                                || []
                            let newApprover = {
                                ...context.execution.instance.data.currentApprover, ...context.execution.instance.data.newCurrentApprover,
                                date: dayjs().toISOString(),
                                action: context.execution.instance.data.additionApprover.approved ? "Approved" : "Rejected"
                            }
                            if (context.execution.instance.data.additionApprover !== undefined) {
                                context.item.token.execution.output = { checkStatus: isApprove }

                                newApprover = { ...newApprover, ...context.execution.instance.data.additionApprover }
                            }

                            logList.push(newApprover)
                            appList.push(newApprover)

                            context.execution.instance.data.actionLog = logList
                            context.execution.instance.data.approverList
                                = appList

                            context.execution.instance.data.currentApprover = null
                            context.execution.instance.data.status = isApprove ? "Waiting" : "Rejected"
                            delete context.execution.instance.data.newCurrentApprover
                            delete context.execution.instance.data.approved
                            delete context.execution.instance.data.additionApprover
                            // console.log( context.item);


                        }
                    }

                    if (context.item.element.name?.includes("send_approve")) {

                        if (context.item._status === 'start') {

                            const splitArr = context.item.element.name.split(":")
                            const [name, levelFlow] = splitArr

                            const userInfo = await CustomFn.getUserInfo(context.execution.instance.data.requester.empid)
                            if (userInfo.data.status) {
                                let { company, emp_type } = userInfo.data.employee
                                if (emp_type === "Daily" || emp_type === "Monthly") {
                                } else {
                                    company = "Sub_Contract"
                                }
                                const getHrLeave = await CustomFn.getHRLeave(company, emp_type)
                                if (!getHrLeave) {
                                    throw new Error("NO Hr leave Conditions");
                                }
                                const checkHr = getHrLeave.responsible.find(d => {
                                    return d.type === emp_type
                                })
                                const hrLdap = await CustomFn.getLDAPDataByEmpID(checkHr.empID)
                                console.log('hrLdap', hrLdap.data.employee)
                                const approverData = {
                                    name: hrLdap.data.employee.name,
                                    email: hrLdap.data.employee.email,
                                    arriveTime: dayjs().toDate(),
                                    empid: checkHr.empID,
                                    // empid: "AH10002500",
                                    // position: approverLevel.position,
                                    // priority: approverLevel.priority,
                                    // level: "E2",

                                    // level: approverLevel.level,
                                    section: null,
                                    company: hrLdap.data.employee.company, department: hrLdap.data.employee.department,

                                }

                                context.execution.instance.data.currentApprover = approverData
                                context.execution.instance.data.status = "Waiting"
                            }
                            // throw new Error("test Hr");



                        }


                        if (context.item._status === 'end') {
                            //onEmail Action


                            const isApprove = context.execution.execution.input.additionApprover.approved
                            let appList = context.execution.instance.data.approverList
                                || []
                            let logList = context.execution.instance.data.actionLog
                                || []
                            let newApprover = {
                                ...context.execution.instance.data.currentApprover, ...context.execution.instance.data.newCurrentApprover,
                                date: dayjs().toISOString(),
                                action: context.execution.instance.data.additionApprover.approved ? "Approved" : "Rejected"
                            }
                            if (context.execution.instance.data.additionApprover !== undefined) {
                                context.item.token.execution.output = { checkStatus: isApprove }

                                newApprover = { ...newApprover, ...context.execution.instance.data.additionApprover }
                            }

                            logList.push(newApprover)
                            appList.push(newApprover)

                            context.execution.instance.data.actionLog = logList
                            context.execution.instance.data.approverList
                                = appList

                            context.execution.instance.data.currentApprover = null
                            context.execution.instance.data.status = isApprove ? "Waiting" : "Rejected"
                            delete context.execution.instance.data.newCurrentApprover
                            delete context.execution.instance.data.approved
                            delete context.execution.instance.data.additionApprover
                            // console.log( context.item);


                        }
                    }

                    if (context.item.element?.name?.includes("end_flow")) {

                        if (context.item._status === 'end') {
                            if (context.execution.instance.data.status !== "Rejected") {
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

                throw new Error(error);

            }
        });
        bpmnServer.listener = listener
        router.get('/datastore/findItems', loggedIn, awaitAppDelegateFactory(async (request, response) => {

            console.log(request.body);
            let query;
            if (request.body.query) {
                query = request.body.query;
            }
            else
                query = request.body;

            console.log(query);
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
                console.log(' starting ' + name);
                let data = request.body.data;
                console.log(430, name, data)

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
                userKey = this.bpmnServer.iam.getRemoteUser(userId);

                let context;
                try {

                    context = await bpmnServer.engine.start(name, data, null).then(res => res).catch(err => {
                        return ({ status: 400, err: err.message })
                    });
                    if (context.status === 400) {

                        response.status(400).json(context);
                    } else {
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

        router.put('/engine/invoke', loggedIn, awaitAppDelegateFactory(async (request, response) => {

            console.log(request.body);
            let query, data, userId, options, userKey;
            if (request.body.query) {
                query = request.body.query;
            }
            if (request.body.data) {
                data = request.body.data;
            }
            if (request.body.options) {
                options = request.body.options;
            }

            if (request.body.userId) {
                userId = request.body.userId;
            }
            let workId = request.body.id
            let context;
            let instance;
            let errors;
            console.log(workId, data);
            try {
                userKey = this.bpmnServer.iam.getRemoteUser(userId);

                context = await bpmnServer.engine.invoke({ id: workId, "items.name": 'send_email:M4' }, { testInvoke: true }, userKey, options);
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

            console.log("query----", query, data);
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
            console.log(request.body);
            // return 
            const { task_id, field, fieldData, user, haveFile, remark, ...receiveData } = JSON.parse(request.body.data);
            if (!task_id) {
                response.status(404).json({ error: "invalid task_id" })
            }
            const files = request.files;
            console.log(406, task_id, field, fieldData, user, haveFile, remark);
            let filesURL = []
            let context;
            let instance;
            let errors;

            // return ;
            try {

                let query, data;
                query =
                {
                    "items.id": task_id
                }
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
                    if (user.level) {
                        data.newCurrentApprover.level = user.level
                    }
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
                context = await bpmnServer.engine.invoke(query, data);
                // instance = context.instance;

                if (context && context.errors) {

                    errors = context.errors.toString();
                }
                // response.setHeader('Content-Type', 'text/html');
                response.status(200).json({ success: 'success' })
            }
            catch (exc) {
                errors = exc.toString();
                console.log(errors);
                response.status(400).json({ errors: errors });
            }
        }));


        router.post('/engine/resend', upload.array('files'), awaitAppDelegateFactory(async (request, response) => {
            // const data = request
            // return 
            const { task_id, isResend, user, haveFile, remark, ...receiveData } = JSON.parse(request.body.data);
            const files = request.files;
            // console.log(406, task_id, isResend, user, haveFile, remark);
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
