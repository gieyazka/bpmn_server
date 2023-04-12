"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.API = void 0;
const express = require("express");
const router = express.Router();
//import { ExecuteDecisionTable, ExecuteCondition, ExecuteExpression } from 'dmn-engine';
var mongoose = require('mongoose');
const __1 = require("..");
const configuration_1 = require("../configuration");
const common_1 = require("./common");
const index_1 = require("../custom_api/index");
const index_2 = require("../custom_node/index");
const AwaitEventEmitter = require('await-event-emitter').default;
//const bpmnServer = new BPMNServer(config);
//const definitions = bpmnServer.definitions;
/* GET users listing. */
console.log("Custom api.ts");
const awaitAppDelegateFactory = (middleware) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield middleware(req, res, next);
        }
        catch (err) {
            next(err);
        }
    });
};
function loggedIn(req, res, next) {
    let apiKey = req.header('x-api-key');
    if (!apiKey) {
        apiKey = req.query.apiKey;
    }
    if (apiKey == process.env.API_KEY) {
        next();
    }
    else {
        res.json({ errors: 'missing or invalid "x-api-key"' });
    }
}
class API extends common_1.Common {
    get bpmnServer() { return this.webApp.bpmnServer; }
    config() {
        var router = express.Router();
        // var bpmnServer = this.bpmnServer;
        const logger = new __1.Logger({
            toConsole: false
        });
        const bpmnServer = new __1.BPMNServer(configuration_1.configuration, logger, { cron: false, noWait: false });
        const listener = new AwaitEventEmitter();
        listener.on('all', ({ context, event }) => __awaiter(this, void 0, void 0, function* () {
            // console.log(174, context.item?.element.name);
            var _a, _b, _c, _d;
            if (context.item) {
                console.log(176, context.item._status, "||", context.item.element.name, context.item.element.id);
                if ((_a = context.item.element.name) === null || _a === void 0 ? void 0 : _a.includes("check_rule")) {
                    if (context.item._status === 'start') {
                        const [name, condition, level] = context.item.element.name.split(":");
                        const { empid, company, department, section } = context.execution.instance.data;
                        const res = yield index_2.default.checkBoolLevel({ empid, condition, level, });
                        context.item.token.execution.output = { checkStatus: res.data.status };
                        // console.log(context.item);
                    }
                }
                if ((_b = context.item.element.name) === null || _b === void 0 ? void 0 : _b.includes("get_position")) {
                    if (context.item._status === 'start') {
                        const [name, level] = context.item.element.name.split(":");
                        const { company, department, section } = context.execution.instance.data;
                        const res = yield index_2.default.getEmpPosition({ company, department, section, level });
                        context.item.token.execution.output = { checkStatus: res.data.status, positionData: (_c = res.data.data) === null || _c === void 0 ? void 0 : _c.employee };
                    }
                }
                if ((_d = context.item.element.name) === null || _d === void 0 ? void 0 : _d.includes("send_email_approve")) {
                    if (context.item._status === 'start') {
                        const [name, level] = context.item.element.name.split(":");
                        const { empid, company, department, section } = context.execution.instance.data;
                        let res;
                        if (level === 'head') {
                            ///get Head
                            res = yield index_2.default.getHead({ empid });
                        }
                        else {
                            res = yield index_2.default.getEmpPosition({ company, department, section, level });
                        }
                        console.log(116, res.data);
                        let approverData = { company, department, section, level };
                        if (res.data.status) {
                            // send Email
                            let emailData = {
                                "empid": "AH10002500",
                                "reason": "sick kub",
                                "flowName": "leave_flow",
                                "linkArrove": `${process.env.WorkFlow_URL}/api/engine/invoke/${context.item.id}/approved/true`,
                                "linkReject": `${process.env.WorkFlow_URL}/api/engine/invoke/${context.item.id}/approved/false`,
                                "bcc": ["pokkate.e@aapico.com", "sawanon.w@aapico.com"]
                            };
                            let approverSection = res.data.data.section;
                            let approverEmployee = res.data.data.employee;
                            let approverLevel = res.data.data.level;
                            approverData = {
                                name: approverEmployee.prefix + "." + approverEmployee.firstName + " " + approverEmployee.lastName,
                                email: approverEmployee.email,
                                emp: approverEmployee.empid,
                                position: approverLevel.position,
                                priority: approverLevel.priority,
                                level: approverLevel.level,
                                section: approverSection.name,
                                company, department,
                            };
                            yield index_1.default.sendStrapi_email(emailData);
                        }
                        context.execution.instance.data.currentApprover = approverData;
                    }
                    if (context.item._status === 'end') {
                        context.item.token.execution.output = { checkStatus: context.execution.instance.data.approved };
                        let appList = context.execution.instance.data.approverList
                            || [];
                        appList.push(context.execution.instance.data.currentApprover);
                        context.execution.instance.data.approverList
                            = appList;
                        context.execution.instance.data.currentApprover = null;
                        // console.log(context.item);
                    }
                }
                // console.log("name : ", context.item.element.name);
                console.log("Input : ", context.execution.execution.input);
                console.log("DATA :", context.execution.instance.data);
                console.log("Output : ", context.item.token.execution.output);
            }
        }));
        bpmnServer.listener = listener;
        router.get('/current_approve', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
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
                const mongoData = yield index_1.default.getCurrentApprove();
                response.json(mongoData);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        })));
        router.post('/find_my_task', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
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
                const mongoData = yield index_1.default.getmyTask(data);
                console.log(234, mongoData);
                response.json(mongoData);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        })));
        router.post('/find_user_approve', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
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
                const mongoData = yield index_1.default.getCurrentApproveTask(data);
                response.json(mongoData);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        })));
        return router;
    }
}
exports.API = API;
exports.default = router;
//# sourceMappingURL=custom_api.js.map