import express = require('express');
const router = express.Router();
//import { ExecuteDecisionTable, ExecuteCondition, ExecuteExpression } from 'dmn-engine';
var mongoose = require('mongoose');
import FS = require('fs');

import { BPMNServer, Behaviour_names, CacheManager, Logger, dateDiff } from '..';
import _, { isArray, } from 'lodash';
import { configuration as config, configuration } from '../configuration';
import { xml2js, xml2json } from "xml-js"

import { Common } from './common';
import CustomNode from '../custom_node/index'
import ELeaveFn from '../Eleave_function/index'
import customFn from '../custom_function/index'

console.log("Leave api.ts");

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

        router.get("/getHRLeaveSetting", async (req, res) => {
            const mongoData = await ELeaveFn.getHRLeaveSetting();

            res.json(mongoData);
        })


        router.get('/current_approve', awaitAppDelegateFactory(async (request, response) => {
            // console.log(200, mongoose.connection.readyState);
            try {
                let name = request.params.name;
                if (!name)
                    name = request.body.name;
                console.log(' starting ' + name);
                let data = request.body.data;
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



                // console.log(context);
                const mongoData = await customFn.getCurrentApprove();

                response.json(mongoData);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        }));

        router.post('/getLeaveQuota', loggedIn, awaitAppDelegateFactory(async (request, response) => {
            // console.log(200, mongoose.connection.readyState);
            try {
                let data = request.body;
                // console.log('data', data)
                if (data.data) {
                    data = data.data
                }
                const leaveQuota = await ELeaveFn.getLeaveQuota(data);
                response.json(leaveQuota);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        }));
        router.post('/calLeaveQuota', loggedIn, awaitAppDelegateFactory(async (request, response) => {
            // console.log(200, mongoose.connection.readyState);
            try {
                let data = request.body;
                const leaveQuota = await ELeaveFn.calLeaveQuota(data);
                response.json(leaveQuota);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        }));

        router.post('/getLeaveDay', loggedIn, awaitAppDelegateFactory(async (request, response) => {
            // console.log(200, mongoose.connection.readyState);
            try {
                let { data } = request.body;
                if (request.body.data === undefined) {
                    data = request.body
                }
                const leaveDay = await ELeaveFn.getLeaveDay(data);
                response.json(leaveDay);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        }));







        router.post('/getLeaveCalendar', awaitAppDelegateFactory(async (request, response) => {
            let data = request.body;
            const mongoData = await ELeaveFn.getLeaveCalendar(data);
            response.json(mongoData);
        }))

        router.post('/find_my_task', awaitAppDelegateFactory(async (request, response) => {
            // console.log(200, mongoose.connection.readyState);
            try {
                let name = request.params.name;
                if (!name)
                    name = request.body.name;
                let data = request.body.data;
                // console.log(data);
                // console.log('find_my_task', data)
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




                const mongoData = await customFn.getmyTask(data);

                response.json(mongoData);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        }));

        router.post('/addLeaveHrCompany', awaitAppDelegateFactory(async (request, response) => {
            try {
                let name = request.params.name;
                if (!name)
                    name = request.body.name;
                let data = request.body;
                const mongoData = await ELeaveFn.addCompanyHrLeaveSetting(data);
                response.json(mongoData);
            }
            catch (exc) {
                response.status(404).json({ error: exc.toString() });
            }
        }));
        router.post('/updateSettingHrLeave', awaitAppDelegateFactory(async (request, response) => {
            try {
                let name = request.params.name;
                if (!name)
                    name = request.body.name;
                let data = request.body;
                const mongoData = await ELeaveFn.updateSettingHrLeave(data);
                response.json(mongoData);
            }
            catch (exc) {
                response.status(404).json({ error: exc.toString() });
            }
        }));

        router.post('/hrCancel', awaitAppDelegateFactory(async (request, response) => {
            try {
                let name = request.params.name;
                if (!name)
                    name = request.body.name;
                let data = request.body;
                // console.log(data);
                const mongoData = await ELeaveFn.hrCancel(data);
                response.json(mongoData);
            }
            catch (exc) {
                response.status(404).json({ error: exc.toString() });
            }
        }));



        router.post('/updateLeaveFile', awaitAppDelegateFactory(async (request, response) => {
            try {
                let data = request.body;
                const mongoData = await ELeaveFn.updateLeaveFile(data);

                response.json(mongoData);
                // response.json("test");
            }
            catch (exc) {
                response.status(404).json({ error: exc.toString() });
            }
        }));

        router.post('/getManager', awaitAppDelegateFactory(async (request, response) => {

            try {
                let data = request.body;
                const { empid, level = "E1", company, department, section, sub_section } = data
                let condition = "gte"
                const checkRule = await CustomNode.checkBoolLevel({ empid, condition, level, company, department })
                let checkStatus = checkRule.data.status === undefined ? _.isEmpty(checkRule.data.status) : checkRule.data.status
                //Note: Ky check isEmpty cuz API Broken not return
                if (checkRule.data.status === true || checkStatus) {
                    //findHead
                    const getHead = await CustomNode.getHead({ empid, company, department })
                    response.json(getHead.data);
                    return
                }
                let approveData
                if (section === null || section === undefined) {
                    //get M2
                    approveData = await CustomNode.getEmpPosition({ company, department, section, sub_section, level: "M2" })
                } else if (sub_section === null || sub_section === undefined) {
                    approveData = await CustomNode.getEmpPosition({ company, department, section, sub_section, level: "M4" })
                } else {
                    approveData = await CustomNode.getEmpPosition({ company, department, section, sub_section, level: "E1" })
                }
                response.json(approveData.data);
                // response.json("test");
            }
            catch (exc) {
                console.log('', 290)
                response.status(404).json({ error: exc.toString() });
            }
        }));


        router.post('/hrSetLeave', awaitAppDelegateFactory(async (request, response) => {
            try {
                let name = request.params.name;
                if (!name)
                    name = request.body.name;
                let data = request.body;




                const mongoData = await ELeaveFn.hrSetLeave(data);

                response.json(mongoData);
                // response.json("test");
            }
            catch (exc) {
                response.status(404).json({ error: exc.toString() });
            }
        }));
        router.post('/getTaskByItemID', awaitAppDelegateFactory(async (request, response) => {
            // console.log(200, mongoose.connection.readyState);
            try {
                let name = request.params.name;
                if (!name)
                    name = request.body.name;
                let data = request.body.data;
                console.log(data);

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


                // console.log(context);
                const mongoData = await customFn.getTaskByItemID(data);
                response.json(mongoData);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        }));
        router.post('/getTaskByTaskId', awaitAppDelegateFactory(async (request, response) => {
            // console.log(200, mongoose.connection.readyState);
            try {

                let data = request.body.data;
                // console.log(context);
                const mongoData = await customFn.getTaskByTaskId(data);

                response.json(mongoData);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        }));

        router.post('/find_user_approve', awaitAppDelegateFactory(async (request, response) => {

            try {
                let name = request.params.name;
                if (!name)
                    name = request.body.name;
                let data = request.body.data;
                let userId;
                // console.log('find_user_approve', data)
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



                const mongoData = await customFn.getCurrentApproveTask(data);
                response.json(mongoData);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        }));
        router.post('/find_action_logs', awaitAppDelegateFactory(async (request, response) => {

            try {
                let name = request.params.name;
                if (!name)
                    name = request.body.name;
                let data = request.body.data;
                console.log(data)
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




                const mongoData = await customFn.getAction_logs(data);
                response.json(mongoData);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        }));


        return router;
    }
}


export default router;
