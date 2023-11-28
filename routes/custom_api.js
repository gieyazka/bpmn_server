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
const common_1 = require("./common");
const index_1 = require("../custom_function/index");
const index_2 = require("../custom_node/index");
const axios_1 = require("axios");
var DOMParser = require('xmldom').DOMParser;
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
        router.get("/getHRLeaveSetting", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const mongoData = yield index_1.default.getHRLeaveSetting();
            res.json(mongoData);
        }));
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
        router.post('/getLeaveQuota', loggedIn, awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            // console.log(200, mongoose.connection.readyState);
            try {
                let data = request.body;
                console.log('data', data);
                const leaveQuota = yield index_1.default.getLeaveQuota(data);
                response.json(leaveQuota);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        })));
        router.post('/calLeaveQuota', loggedIn, awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            // console.log(200, mongoose.connection.readyState);
            try {
                let data = request.body;
                console.log('data', data);
                const leaveQuota = yield index_1.default.calLeaveQuota(data);
                response.json(leaveQuota);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        })));
        router.get('/getLeaveQuota', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            // console.log(200, mongoose.connection.readyState);
            try {
                let data = request.body;
                console.log('data', data);
                const leaveQuota = yield axios_1.default.get('https://ess.aapico.com/annualleaves?emp_id=10002564&company=AH');
                response.json(leaveQuota);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        })));
        router.post('/getLeaveDay', loggedIn, awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            // console.log(200, mongoose.connection.readyState);
            try {
                let { data } = request.body;
                if (request.body.data === undefined) {
                    data = request.body;
                }
                const leaveDay = yield index_1.default.getLeaveDay(data);
                response.json(leaveDay);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        })));
        router.get('/testGetLeave/:date', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let data = request.params;
                const { date } = data;
                const mongoData = yield index_1.default.getLeave({ date });
                console.log(mongoData.length);
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
                // console.log(context);
                const mongoData = yield index_1.default.getmyTask(data);
                // console.log(234,mongoData);
                console.log(mongoData.length);
                response.json(mongoData);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        })));
        router.post('/addLeaveHrCompany', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let name = request.params.name;
                if (!name)
                    name = request.body.name;
                let data = request.body;
                const mongoData = yield index_1.default.addCompanyHrLeaveSetting(data);
                response.json(mongoData);
            }
            catch (exc) {
                response.status(404).json({ error: exc.toString() });
            }
        })));
        router.post('/updateSettingHrLeave', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let name = request.params.name;
                if (!name)
                    name = request.body.name;
                let data = request.body;
                const mongoData = yield index_1.default.updateSettingHrLeave(data);
                response.json(mongoData);
            }
            catch (exc) {
                response.status(404).json({ error: exc.toString() });
            }
        })));
        router.post('/hrCancel', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let name = request.params.name;
                if (!name)
                    name = request.body.name;
                let data = request.body;
                // console.log(data);
                const mongoData = yield index_1.default.hrCancel(data);
                response.json(mongoData);
            }
            catch (exc) {
                response.status(404).json({ error: exc.toString() });
            }
        })));
        router.post('/updateLeaveFile', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let data = request.body;
                const mongoData = yield index_1.default.updateLeaveFile(data);
                response.json(mongoData);
                // response.json("test");
            }
            catch (exc) {
                response.status(404).json({ error: exc.toString() });
            }
        })));
        router.post('/getManager', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let data = request.body;
                const { empid, level = "E1", company, department, section, sub_section } = data;
                let condition = "gte";
                const checkRule = yield index_2.default.checkBoolLevel({ empid, condition, level, company, department });
                if (checkRule.data.status === true) {
                    //findHead
                    const getHead = yield index_2.default.getHead({ empid, company, department });
                    response.json(getHead.data);
                    return;
                }
                let approveData;
                if (section === null || section === undefined) {
                    //get M2
                    approveData = yield index_2.default.getEmpPosition({ company, department, section, sub_section, level: "M2" });
                }
                else if (sub_section === null || sub_section === undefined) {
                    approveData = yield index_2.default.getEmpPosition({ company, department, section, sub_section, level: "M4" });
                }
                else {
                    approveData = yield index_2.default.getEmpPosition({ company, department, section, sub_section, level: "E1" });
                }
                response.json(approveData.data);
                // response.json("test");
            }
            catch (exc) {
                response.status(404).json({ error: exc.toString() });
            }
        })));
        router.post('/hrSetLeave', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let name = request.params.name;
                if (!name)
                    name = request.body.name;
                let data = request.body;
                const mongoData = yield index_1.default.hrSetLeave(data);
                response.json(mongoData);
                // response.json("test");
            }
            catch (exc) {
                response.status(404).json({ error: exc.toString() });
            }
        })));
        router.post('/getTaskByItemID', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
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
                const mongoData = yield index_1.default.getTaskByItemID(data);
                response.json(mongoData);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        })));
        router.post('/find_user_approve', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
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
                const mongoData = yield index_1.default.getCurrentApproveTask(data);
                response.json(mongoData);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        })));
        router.post('/find_action_logs', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
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
                const mongoData = yield index_1.default.getAction_logs(data);
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