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
const axios = require('axios');
const express = require("express");
const router = express.Router();
const multer = require('multer');
const upload = multer();
var FormData = require('form-data');
//import { ExecuteDecisionTable, ExecuteCondition, ExecuteExpression } from 'dmn-engine';
var mongoose = require('mongoose');
const __1 = require("..");
const configuration_1 = require("../configuration");
const common_1 = require("./common");
const index_1 = require("../custom_api/index");
const index_2 = require("../custom_node/index");
const nanoid_1 = require("nanoid");
const dayjs = require('dayjs');
const AwaitEventEmitter = require('await-event-emitter').default;
//const bpmnServer = new BPMNServer(config);
//const definitions = bpmnServer.definitions;
/* GET users listing. */
console.log("api.ts");
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
            var _a, _b, _c, _d, _e, _f, _g;
            if (context.item) {
                // console.log(176, context.item._status, "||", context.item.element.name, context.item.element?.name === "End", context.item.element.id);
                if ((_a = context.item.element.name) === null || _a === void 0 ? void 0 : _a.includes("start_flow")) {
                    if (context.item._status === 'start') {
                        context.execution.instance.task_id = `EF-${dayjs().format('YYYYMMDD')}-${(0, nanoid_1.nanoid)(6)}`;
                    }
                }
                if ((_b = context.item.element.name) === null || _b === void 0 ? void 0 : _b.includes("check_rule")) {
                    if (context.item._status === 'start') {
                        const [name, condition, level] = context.item.element.name.split(":");
                        //TODO: add company for check if need
                        const { empid, company, department, section } = context.execution.instance.data.requester;
                        const res = yield index_2.default.checkBoolLevel({ empid, condition, level, });
                        context.item.token.execution.output = { checkStatus: res.data.status };
                        // console.log(context.item);
                    }
                }
                if ((_c = context.item.element.name) === null || _c === void 0 ? void 0 : _c.includes("get_position")) {
                    if (context.item._status === 'start') {
                        const splitArr = context.item.element.name.split(":");
                        const [name, level] = splitArr;
                        let { company, department, section } = context.execution.instance.data.requester;
                        if (splitArr.length > 2) {
                            [company, department, section] = splitArr.slice(2);
                        }
                        const res = yield index_2.default.getEmpPosition({ company, department, section, level });
                        context.item.token.execution.output = { checkStatus: res.data.status, positionData: (_d = res.data.data) === null || _d === void 0 ? void 0 : _d.employee };
                    }
                }
                if ((_e = context.item.element.name) === null || _e === void 0 ? void 0 : _e.includes("send_email_approve")) {
                    if (context.item._status === 'start') {
                        const splitArr = context.item.element.name.split(":");
                        const [name, level] = splitArr;
                        let { empid, company, department, section } = context.execution.instance.data.requester;
                        let res;
                        if (level === 'head') {
                            ///get Head
                            res = yield index_2.default.getHead({ empid });
                        }
                        else {
                            if (splitArr.length > 2) {
                                [company, department, section] = splitArr.slice(2);
                            }
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
                                "linkArrove": `${process.env.Portal_url}/email/${context.item.id}/approved/true`,
                                "linkReject": `${process.env.Portal_url}/email/${context.item.id}/approved/false`,
                                // "linkArrove": `${process.env.WorkFlow_URL}/api/engine/invoke/${context.item.id}/approved/true`,
                                // "linkReject": `${process.env.WorkFlow_URL}/api/engine/invoke/${context.item.id}/approved/false`,
                                "bcc": ["pokkate.e@aapico.com", "sawanon.w@aapico.com"]
                            };
                            let approverSection = res.data.data.section;
                            let approverEmployee = res.data.data.employee;
                            let approverLevel = res.data.data.level;
                            approverData = {
                                name: approverEmployee.prefix + "." + approverEmployee.firstName + " " + approverEmployee.lastName,
                                email: approverEmployee.email,
                                empid: approverEmployee.empid,
                                position: approverLevel.position,
                                priority: approverLevel.priority,
                                level: approverLevel.level,
                                section: approverSection.name,
                                company, department,
                            };
                            const resEmail = yield index_1.default.sendStrapi_email(emailData);
                        }
                        context.execution.instance.data.currentApprover = approverData;
                        context.execution.instance.data.status = "Waiting";
                    }
                    if (context.item._status === 'end') {
                        //onEmail Action
                        context.item.token.execution.output = { checkStatus: context.execution.instance.data.approved };
                        let appList = context.execution.instance.data.approverList
                            || [];
                        let newApprover = Object.assign(Object.assign({}, context.execution.instance.data.currentApprover), { date: dayjs().toISOString(), action: context.execution.instance.data.approved ? "Approved" : "Rejected" });
                        console.log(context.execution.execution.input);
                        appList.push(newApprover);
                        context.execution.instance.data.approverList
                            = appList;
                        context.execution.instance.data.currentApprover = null;
                        context.execution.instance.data.status = context.execution.instance.data.approved ? "Waiting" : "Rejected";
                        // console.log(context.item);
                    }
                }
                if ((_g = (_f = context.item.element) === null || _f === void 0 ? void 0 : _f.name) === null || _g === void 0 ? void 0 : _g.includes("end_flow")) {
                    console.log(162, context.execution.instance.data.status);
                    if (context.item._status === 'end') {
                        if (context.execution.instance.data.status !== "Rejected") {
                            context.execution.instance.data.status = "Success";
                        }
                    }
                }
                // console.log("name : ", context.item.element.name);
                // console.log("Input : ", context.execution.execution.input);
                // console.log("DATA :", context.execution.instance.data);
                // console.log("Output : ", context.item.token.execution.output);
            }
            context.execution.instance.data.lastUpdate = dayjs().toISOString();
        }));
        bpmnServer.listener = listener;
        router.get('/datastore/findItems', loggedIn, awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
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
                items = yield this.bpmnServer.dataStore.findItems(query);
            }
            catch (exc) {
                errors = exc.toString();
                console.log(errors);
            }
            response.json({ errors: errors, items });
        })));
        router.get('/datastore/findInstances', loggedIn, awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
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
                instances = yield this.bpmnServer.dataStore.findInstances(query, 'full');
            }
            catch (exc) {
                errors = exc.toString();
                console.log(errors);
            }
            response.json({ errors: errors, instances });
        })));
        /*
        returns list of current instances running or ended
         */
        router.get('/engine/status', loggedIn, awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                var list = [];
                __1.CacheManager.liveInstances.forEach(exec => {
                    list.push({ instance: exec.instance, currentItem: exec.item.id, currentElement: exec.item.elementId, status: exec.instance.status });
                });
                response.json(list);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        })));
        router.post('/engine/start/:name?', loggedIn, awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
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
                let context;
                context = yield bpmnServer.engine.start(name, data, null);
                // console.log(context);
                // console.log(204,await CustomApi.getCurrentApprove());
                response.json(context.instance);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        })));
        router.put('/engine/invoke', loggedIn, awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
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
            let workId = request.body.id;
            let context;
            let instance;
            let errors;
            console.log(workId, data);
            try {
                userKey = this.bpmnServer.iam.getRemoteUser(userId);
                context = yield bpmnServer.engine.invoke({ id: workId, "items.name": 'send_email:M4' }, { testInvoke: true }, userKey, options);
                instance = context.instance;
                if (context && context.errors)
                    errors = context.errors.toString();
            }
            catch (exc) {
                errors = exc.toString();
                console.log(errors);
            }
            response.json({ errors: errors, instance });
        })));
        router.get('/engine/invoke/:id/:field/:value', awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            let params = request.params;
            console.log("params----", params);
            let query, data;
            query =
                {
                    "items.id": params.id
                };
            let value = params.value;
            if (params.field === "approved") {
                if (params.value === "true") {
                    value = true;
                }
                else {
                    value = false;
                }
            }
            data = {
                [params.field]: value
            };
            console.log("query----", query, data);
            let context;
            let instance;
            let errors;
            try {
                // let Datacontext = await this.bpmnServer.engine.get(query);
                // console.log(Datacontext);
                context = yield bpmnServer.engine.invoke(query, data);
                instance = context.instance;
                if (context && context.errors)
                    errors = context.errors.toString();
            }
            catch (exc) {
                errors = exc.toString();
                console.log(errors);
            }
            response.json({ errors: errors, instance });
        })));
        router.post('/engine/invoke', upload.array('files'), awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            // const data = request
            const { task_id, field, fieldData, user, haveFile, remark } = JSON.parse(request.body.data);
            const files = request.files;
            console.log(406, task_id, field, fieldData, user, haveFile, remark);
            let fileUrl = [];
            let context;
            let instance;
            let errors;
            let currentApprover = {
                name: user.name,
                email: user.email,
            };
            return;
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
                    const res = yield axios.post(`${process.env.Strapi_URL}/api/upload`, formData, headers);
                    if (res.status === 200) {
                        if (Array.isArray(res.data)) {
                            res.data.forEach(element => {
                                fileUrl.push(element.url);
                            });
                        }
                    }
                }
                console.log(fileUrl);
                // let Datacontext = await this.bpmnServer.engine.get(query);
                // console.log(Datacontext);
                // context = await bpmnServer.engine.invoke(query, data);
                // instance = context.instance;
                if (context && context.errors) {
                    errors = context.errors.toString();
                }
                // response.setHeader('Content-Type', 'text/html');
                response.status(200).json({ success: 'success' });
            }
            catch (exc) {
                errors = exc.toString();
                console.log(errors);
                response.status(400).json({ errors: errors });
            }
        })));
        router.get('/engine/get', loggedIn, awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            let query;
            if (request.body.query) {
                query = request.body.query;
            }
            else
                query = request.body;
            console.log("Query", query);
            let context;
            let instance;
            let errors;
            try {
                context = yield this.bpmnServer.engine.get(query);
                instance = context.instance;
            }
            catch (exc) {
                errors = exc.toString();
                console.log(errors);
            }
            response.json({ errors: errors, instance });
        })));
        /*
         *      response = await bpmn.engine.throwMessage(messageId,data);
        */
        router.post('/engine/throwMessage', loggedIn, awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let messageId = request.body.messageId;
                console.log(' MessageId ' + messageId);
                let data = request.body.data;
                let messageMatchingKey = {};
                if (request.body.messageMatchingKey)
                    messageMatchingKey = request.body.messageMatchingKey;
                let context;
                console.log(data);
                context = yield this.bpmnServer.engine.throwMessage(messageId, data, messageMatchingKey);
                if (context)
                    response.json(context.instance);
                else
                    response.json({});
            }
            catch (exc) {
                console.log(exc);
                response.json({ error: exc.toString() });
            }
        })));
        /*
         *  engine.throwSignal     - issue a signal by id
         *  ------------------
         *      same as message except multiple receipients
         *
         *
         *
         */
        router.post('/engine/throwSignal', loggedIn, awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            try {
                let signalId = request.body.signalId;
                console.log(' Signal Id: ' + signalId);
                let data = request.body.data;
                let messageMatchingKey = {};
                if (request.body.messageMatchingKey)
                    messageMatchingKey = request.body.messageMatchingKey;
                let context;
                context = yield this.bpmnServer.engine.throwSignal(signalId, data, messageMatchingKey);
                response.json(context);
            }
            catch (exc) {
                console.log(exc);
                response.json({ error: exc.toString() });
            }
        })));
        ////
        var fsx = require('fs-extra'); //File System - for file manipulation
        router.post('/definitions/import/:name?', loggedIn, awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            let name = request.params.name;
            if (!name)
                name = request.body.name;
            console.log(' importing: ' + name);
            console.log('request.body', request.body);
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
                        fstream.on('close', function () {
                            return __awaiter(this, void 0, void 0, function* () {
                                console.log("Upload Finished of " + filename.filename);
                                //const name = filename.filename;
                                const source = fsx.readFileSync(filepath, { encoding: 'utf8', flag: 'r' });
                                yield bpmnServer.definitions.save(name, source, null);
                                response.json("OK");
                            });
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
        })));
        router.post('/definitions/rename', loggedIn, function (req, response) {
            return __awaiter(this, void 0, void 0, function* () {
                let name = req.body.name;
                let newName = req.body.newName;
                console.log('renaming ', name, newName);
                try {
                    var ret = yield bpmnServer.definitions.renameModel(name, newName);
                    console.log('ret:', ret);
                    response.json(ret);
                }
                catch (exc) {
                    console.log('error:', exc);
                    response.json({ errors: exc });
                }
            });
        });
        router.post('/definitions/delete', loggedIn, function (req, response) {
            return __awaiter(this, void 0, void 0, function* () {
                let name = req.body.name;
                console.log('deleting ', name);
                try {
                    var ret = yield bpmnServer.definitions.deleteModel(name);
                    console.log('ret: ', ret);
                    response.json(ret);
                }
                catch (exc) {
                    console.log('error:', exc);
                    response.json({ errors: exc.toString() });
                }
            });
        });
        router.get('/definitions/list', loggedIn, function (req, response) {
            return __awaiter(this, void 0, void 0, function* () {
                let list = yield bpmnServer.definitions.getList();
                console.log(list);
                response.json(list);
            });
        });
        router.get('/definitions/load/:name?', loggedIn, function (request, response) {
            return __awaiter(this, void 0, void 0, function* () {
                console.log(request.params);
                let name = request.params.name;
                let definition = yield bpmnServer.definitions.load(name);
                response.json(JSON.parse(definition.getJson()));
            });
        });
        router.delete('/datastore/deleteInstances', loggedIn, awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
            let query;
            if (request.body.query) {
                query = request.body.query;
            }
            else
                query = request.body;
            console.log(query);
            let errors;
            let result;
            try {
                result = yield this.bpmnServer.dataStore.deleteInstances(query);
            }
            catch (exc) {
                errors = exc.toString();
                console.log(errors);
            }
            response.json({ errors: errors, result });
        })));
        router.get('/shutdown', loggedIn, function (req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                let instanceId = req.query.id;
                yield this.bpmnServer.cache.shutdown();
                let output = ['Complete ' + instanceId];
                console.log(" deleted");
                display(res, 'Show', output);
            });
        });
        router.get('/restart', loggedIn, function (req, res) {
            return __awaiter(this, void 0, void 0, function* () {
                let instanceId = req.query.id;
                yield this.bpmnServer.cache.restart();
                let output = ['Complete ' + instanceId];
                console.log(" deleted");
                display(res, 'Show', output);
            });
        });
        router.put('/rules/invoke', loggedIn, awaitAppDelegateFactory((request, response) => __awaiter(this, void 0, void 0, function* () {
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
        })));
        return router;
    }
}
exports.API = API;
function display(res, title, output, logs = [], items = []) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(" Display Started");
        var instances = yield this.bpmnServer.dataStore.findInstances({}, 'full');
        let waiting = yield this.bpmnServer.dataStore.findItems({ items: { status: 'wait' } });
        waiting.forEach(item => {
            item.fromNow = (0, __1.dateDiff)(item.startedAt);
        });
        let engines = this.bpmnServer.cache.list();
        engines.forEach(engine => {
            engine.fromNow = (0, __1.dateDiff)(engine.startedAt);
            engine.fromLast = (0, __1.dateDiff)(engine.lastAt);
        });
        instances.forEach(item => {
            item.fromNow = (0, __1.dateDiff)(item.startedAt);
            if (item.endedAt)
                item.endFromNow = (0, __1.dateDiff)(item.endedAt);
            else
                item.endFromNow = '';
        });
        res.render('index', {
            title: title, output: output,
            engines,
            procs: this.bpmnServer.definitions.getList(),
            debugMsgs: [],
            waiting: waiting,
            instances,
            logs, items
        });
    });
}
exports.default = router;
//# sourceMappingURL=api.js.map