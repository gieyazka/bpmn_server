import express = require('express');
const router = express.Router();
//import { ExecuteDecisionTable, ExecuteCondition, ExecuteExpression } from 'dmn-engine';
var mongoose = require('mongoose');
import FS = require('fs');

import { BPMNServer, Behaviour_names, CacheManager, Logger, dateDiff } from '..';
import { configuration as config, configuration } from '../configuration';

import { Common } from './common';
import CustomApi from '../custom_api/index'
import CustomNode from '../custom_node/index'

const AwaitEventEmitter = require('await-event-emitter').default
//const bpmnServer = new BPMNServer(config);

//const definitions = bpmnServer.definitions;


/* GET users listing. */

console.log("Custom api.ts");

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
            // console.log(174, context.item?.element.name);

            if (context.item) {
                console.log(176, context.item._status, "||", context.item.element.name, context.item.element.id);
                if (context.item.element.name?.includes("check_rule")) {

                    if (context.item._status === 'start') {
                        const [name, condition, level] = context.item.element.name.split(":")
                        const {
                            empid, company, department, section
                        } = context.execution.instance.data

                        const res = await CustomNode.checkBoolLevel({ empid, condition, level, })

                        context.item.token.execution.output = { checkStatus: res.data.status }
                        // console.log(context.item);


                    }
                }
                if (context.item.element.name?.includes("get_position")) {

                    if (context.item._status === 'start') {
                        const [name, level] = context.item.element.name.split(":")
                        const {
                            company, department, section
                        } = context.execution.instance.data
                        const res = await CustomNode.getEmpPosition({ company, department, section, level })
                        context.item.token.execution.output = { checkStatus: res.data.status, positionData: res.data.data?.employee }
                    }
                }
                if (context.item.element.name?.includes("send_email_approve")) {

                    if (context.item._status === 'start') {
                        const [name, level] = context.item.element.name.split(":")
                        const {
                            empid, company, department, section
                        } = context.execution.instance.data
                        let res
                        if (level === 'head') {
                            ///get Head
                            res = await CustomNode.getHead({ empid })
                        } else {

                            res = await CustomNode.getEmpPosition({ company, department, section, level })
                        }
                        console.log(116, res.data);
                        let approverData: any = { company, department, section, level }
                        if (res.data.status) {
                            // send Email
                            let emailData = {
                                "empid": "AH10002500",
                                "reason": "sick kub",
                                "flowName": "leave_flow",
                                "linkArrove": `${process.env.WorkFlow_URL}/api/engine/invoke/${context.item.id}/approved/true`,
                                "linkReject": `${process.env.WorkFlow_URL}/api/engine/invoke/${context.item.id}/approved/false`,
                                "bcc": ["pokkate.e@aapico.com", "sawanon.w@aapico.com"]
                            }
                            let approverSection = res.data.data.section
                            let approverEmployee = res.data.data.employee
                            let approverLevel = res.data.data.level
                            approverData = {
                                name: approverEmployee.prefix + "." + approverEmployee.firstName + " " + approverEmployee.lastName,
                                email: approverEmployee.email,
                                emp: approverEmployee.empid,
                                position: approverLevel.position,
                                priority: approverLevel.priority,
                                level: approverLevel.level,
                                section: approverSection.name,
                                company, department,
                            }

                            await CustomApi.sendStrapi_email(emailData)
                        }

                        context.execution.instance.data.currentApprover = approverData
                    }


                    if (context.item._status === 'end') {

                        context.item.token.execution.output = { checkStatus: context.execution.instance.data.approved }
                        let appList = context.execution.instance.data.approverList
 || []
                        appList.push(context.execution.instance.data.currentApprover)
                        context.execution.instance.data.approverList
 = appList
                        context.execution.instance.data.currentApprover = null
                        // console.log(context.item);


                    }
                }
                // console.log("name : ", context.item.element.name);
                console.log("Input : ", context.execution.execution.input);
                console.log("DATA :", context.execution.instance.data);
                console.log("Output : ", context.item.token.execution.output);
            }
        });

        bpmnServer.listener = listener

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
                const mongoData = await CustomApi.getCurrentApprove();

                response.json(mongoData);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        }));
        router.post('/find_my_task', awaitAppDelegateFactory(async (request, response) => {
            // console.log(200, mongoose.connection.readyState);
            try {
                let name = request.params.name;
                if (!name)
                    name = request.body.name;
                console.log(' starting ' + name);
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
                const mongoData = await CustomApi.getmyTask(data);
                console.log(234,mongoData);
                
                response.json(mongoData);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        }));

        router.post('/find_user_approve', awaitAppDelegateFactory(async (request, response) => {
            // console.log(200, mongoose.connection.readyState);
            try {
                let name = request.params.name;
                if (!name)
                    name = request.body.name;
                console.log(' starting ' + name);
                let data = request.body.data;
                // console.log(data);

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
                const mongoData = await CustomApi.getCurrentApproveTask(data);

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
