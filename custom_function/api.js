//@ts-nocheck
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const quotaController = require('../controller/quota');
const Fn = require('./index');
const _ = require('lodash');
var axios = require('axios');
const dayjs = require('dayjs');
const mongoose = require('mongoose');
const { subStrEmpID } = require('../utils/common');
const strapi_api = require('./strapi_api.ts');
const UsersSchema = new mongoose.Schema({
    items: {},
    logs: [],
    data: {},
    leaveData: [],
    task_id: String,
    issueDate: Date
});
const selectKey = {
    tokens: 0, loops: 0, involvements: 0, source: 0, logs: 0, authorizations: 0
};
const checkMongoState = () => {
    return (mongoose.connection.readyState);
    // 0: disconnected
    // 1: connected
    // 2: connecting
    // 3: disconnecting
};
const setNewItem = (task_id, items) => __awaiter(this, void 0, void 0, function* () {
    if (task_id === undefined) {
        throw new Error("task_id is undefined");
    }
    let Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let query = {
        task_id: task_id,
    };
    let data = {
        "items": items,
    };
    const updateData = yield Mongo.updateOne(query, data);
    return updateData;
});
const getCurrentApprove = () => __awaiter(this, void 0, void 0, function* () {
    const schema = new mongoose.Schema({ data: {} });
    const Tank = mongoose.model('wf_instances', schema);
    let test = yield Tank.find();
    return test;
});
const getmyTask = ({ email, empid, status, startDate, endDate, flowNames }) => __awaiter(this, void 0, void 0, function* () {
    // console.log(23, empid, status, startDate, endDate, flowNames);
    if (!empid && !email) {
        throw new Error("empid is undefine");
    }
    // if (!startDate) {
    //     throw new Error("startDate is undefined");
    // }
    try {
        const Tasks = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
        let query = {
            $and: [
                { "data.leaveData": { $elemMatch: { "date": { $gte: startDate } } } },
                { "data.leaveData": { $elemMatch: { "date": { $lt: endDate } } } },
            ],
        };
        // let query = {
        //     "issueDate": {
        //         $gte: startDate,
        //         $lt: endDate
        //     }
        // }
        if (email) {
            query["data.requester.email"] = {
                $regex: new RegExp("^" + email.toLowerCase(), "i")
            };
        }
        if (empid) {
            query["data.requester.empid"] = empid === null || empid === void 0 ? void 0 : empid.toUpperCase();
        }
        if (endDate === null || endDate === undefined) {
            // @ts-ignore
            query["$and"] = [{ "data.leaveData": { $elemMatch: { "date": { $gte: startDate } } } }];
        }
        if (!startDate && !endDate) {
            delete query["$and"];
        }
        if (status !== undefined && status !== null) {
            if (status === "Success" || status === "Cancel") {
                query["data.status"] = { $in: ['Success', 'Cancel', "hrCancel"] };
            }
            else {
                query["data.status"] = status;
            }
        }
        if (Array.isArray(flowNames) && flowNames.length != 0) {
            query["data.flowName"] = { $all: flowNames }; //sendFlowName Arr
        }
        // console.log('query', query)
        // if (empid?.toUpperCase() === "AH10002500") {
        //     delete query['data.requester.empid']
        // }
        // if (email === "watthana.m@aapico.com") {
        if (email === "pokkate.e@aapico.com" || email === "watthana.m@aapico.com" || (email === null || email === void 0 ? void 0 : email.toLowerCase()) === "thanaporn.s@aapico.com") {
            delete query['data.requester.email'];
        }
        // console.log('query', query)
        const mongoData = yield Tasks.find(query, selectKey).hint("getMyTask");
        // const mongoData = await Tasks.find(query)
        return mongoData;
    }
    catch (error) {
        console.log('error', error);
        return error;
    }
});
const getTaskByItemID = (itemID) => __awaiter(this, void 0, void 0, function* () {
    // console.log(23, empid, status, startDate, endDate, flowNames);
    if (!itemID) {
        return "ItemID is undefined";
    }
    const Tasks = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    const query = { items: { $elemMatch: { id: itemID } } };
    const mongoData = yield Tasks.find(query, selectKey);
    // const mongoData = await Tasks.find(query)
    if (mongoData.length > 0) {
        return mongoData[0];
    }
    return undefined;
});
const getTaskByTaskId = (props) => __awaiter(this, void 0, void 0, function* () {
    const { task_id } = props;
    if (!task_id) {
        return "task_id is undefined";
    }
    const Tasks = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    const query = { task_id: task_id };
    const mongoData = yield Tasks.findOne(query);
    return mongoData;
});
const getCurrentApproveTask = (props) => __awaiter(this, void 0, void 0, function* () {
    const { empid, level, section, department, company, username, name, email } = props.user;
    const { startDate, endDate } = props.filterStore;
    if (!email) {
        throw new Error("email is undefine");
    }
    // if (!startDate) {
    //     throw new Error("startDate is undefined");
    // }
    // console.log('111 user',username)
    // console.log('112 name',name)
    let Mongo;
    Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let query = {
        // "data.empid": empid?.toUpperCase(),
        "data.status": "Waiting", "issueDate": {
            $gte: startDate,
            $lt: endDate
        },
        $or: [{
                $and: [
                    { "data.currentApprover.level": level ? level : "" },
                    { "data.currentApprover.section": section },
                    { "data.currentApprover.department": department },
                    { "data.currentApprover.company": company },
                ]
            }, {
                "data.currentApprover.email": {
                    $regex: new RegExp("^" + email.toLowerCase(), "i")
                }
            }]
    };
    if (!endDate) {
        delete query.issueDate.$lt;
    }
    if (!startDate && !endDate) {
        delete query.issueDate;
    }
    let mongoData = yield Mongo.find(query, selectKey);
    return mongoData;
});
const getAction_logs = (props) => __awaiter(this, void 0, void 0, function* () {
    const { empid, level, section, department, company, username, email } = props.user;
    const { startDate, endDate } = props.filterStore;
    if (!email) {
        throw new Error("email is undefined");
    }
    // if (!startDate) {
    //     throw new Error("startDate is undefined");
    // }
    // if (!endDate) {
    //     return "endDate is undefined";
    // }
    let Mongo;
    Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let query = {
        "issueDate": {
            $gte: startDate,
            $lt: endDate
        },
        // "data.actionLog": { $elemMatch: { empid: username, "action": { "$ne": "Submit" } } }
        "data.actionLog": {
            $elemMatch: {
                $or: [
                    {
                        $or: [
                            { "0.email": { $regex: new RegExp("^" + email, "i") } },
                            { "email": { $regex: new RegExp("^" + email, "i") } }
                        ]
                    }, {
                        $or: [
                            { "0.empid": { $regex: new RegExp("^" + empid, "i") } },
                            { "empid": { $regex: new RegExp("^" + empid, "i") } }
                        ]
                    }
                ],
                "action": { "$ne": "Submit" }
            }
        }
    };
    if (endDate === null) {
        // @ts-ignore
        delete query.issueDate.$lt;
    }
    if (!startDate && !endDate) {
        delete query.issueDate;
    }
    let mongoData = yield Mongo.find(query, selectKey);
    return mongoData;
});
const clearLogsTask = (taskID) => __awaiter(this, void 0, void 0, function* () {
    // console.log('taskID', taskID)
    if (!taskID) {
        throw new Error("taskID is undefined");
    }
    let Mongo;
    Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let query = {
        task_id: taskID,
    };
    const updateDocument = {
        "$set": {
            "logs": [],
        }
    };
    const resUpdate = yield Mongo.updateOne(query, updateDocument);
    // console.log('resUpdate', resUpdate)
});
const editApprover = (props) => __awaiter(this, void 0, void 0, function* () {
    const { oldUser, newUser } = props;
    if (!oldUser.empid) {
        return "Invalid empid  for oldUser";
    }
    if (!newUser.empid) {
        return "Invalid empid  for newUser";
    }
    let Mongo;
    Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    const matchOldUser = { empid: oldUser.empid };
    const { company, department, section } = oldUser;
    if (company) {
        matchOldUser["company"] = company;
        if (department) {
            matchOldUser["department"] = department;
            if (section) {
                matchOldUser["section"] = section;
            }
        }
    }
    const getNewApprover = yield strapi_api.getEmpByEmpID(newUser.empid);
    if (getNewApprover.data.employee === null || getNewApprover.data.employee === false) {
        return "Not Found New User empid";
    }
    const { employee } = getNewApprover.data;
    let query = { 'data.currentApprover': { $elemMatch: matchOldUser } };
    const mongoData = yield Mongo.find(query, selectKey);
    const arrUpdate = [];
    for (const element of mongoData) {
        const getOldApprover = element.data.currentApprover.find(currentApp => {
            return currentApp.empid === oldUser.empid;
        });
        if (getOldApprover) {
            const { priority, realLevel, level, section, company, department, position } = getOldApprover;
            const newApprover = {
                name: (employee.prefix ? employee.prefix + "." : "") + employee.firstName + " " + employee.lastName,
                email: employee.email.toLowerCase(),
                // email: "pokkate.e@aapico.com",
                arriveTime: dayjs().toDate(),
                empid: employee.empid,
                position,
                priority: priority, realLevel, level, section, company, department
            };
            // if (element.task_id === "EF-2401123920-KV") {
            // แทนคนเก่า
            const mongoData = yield Mongo.updateOne({
                "task_id": element.task_id,
                "data.currentApprover.empid": oldUser.empid
            }, {
                $set: { "data.currentApprover.$": newApprover }
                // $set: { "data.currentApprover.name": newApprover }
            });
            //เพิ่มคนใหม่
            // const mongoData = await Mongo.updateOne({
            //     "task_id": element.task_id,
            // }, {
            //     $push: { "data.currentApprover": newApprover }
            //     // $set: { "data.currentApprover.name": newApprover }
            // })
            if (mongoData.modifiedCount >= 1) {
                let emailData = {
                    "empid": newApprover.empid,
                    // "empid": "AH10002500",
                    "data": element.data,
                    "from": element.data.requester.name,
                    "reason": element.data.reason,
                    "flowName": element.data.flowName,
                    "linkArrove": `${process.env.Portal_url_external}/email/${_.last(element.items).id}/approved/true/${newApprover.email}`,
                    "linkReject": `${process.env.Portal_url_external}/email/${_.last(element.items).id}/approved/false/${newApprover.email}`,
                    // "linkArrove": `${process.env.WorkFlow_URL}/api/engine/invoke/${context.item.id}/approved/true`,
                    // "linkReject": `${process.env.WorkFlow_URL}/api/engine/invoke/${context.item.id}/approved/false`,
                    "bcc": ["pokkate.e@aapico.com", "sawanon.w@aapico.com", "thanaporn.s@aapico.com"]
                };
                strapi_api.sendStrapi_email(emailData);
                arrUpdate.push(element.task_id);
            }
            // }
        }
        // { $push: { myArray: "newData" } }
    }
    return arrUpdate;
});
module.exports = { editApprover, checkMongoState, setNewItem, getCurrentApprove, getmyTask, getTaskByItemID, getTaskByTaskId, clearLogsTask, getAction_logs, getCurrentApproveTask };
//# sourceMappingURL=api.js.map