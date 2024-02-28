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
var mongoose = require('mongoose');
var axios = require('axios');
const dayjs = require('dayjs');
var isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
const { subStrEmpID } = require('.././utils/common');
const CustomFn = require('../custom_function/index');
const _ = require('lodash');
const quotaController = require('.././controller/quota');
const common = require('./common');
dayjs.extend(isSameOrAfter);
const UsersSchema = new mongoose.Schema({
    items: {},
    logs: [],
    data: {},
    leaveData: [],
    task_id: String,
    issueDate: Date
});
const HrLeaveSchema = new mongoose.Schema({
    company: String,
    responsible: [{
        // type: String,
        // empID: String,
        // email: String,
        // name: String,
        }
    ]
});
const quotaSchema = new mongoose.Schema({
    empID: String,
    startDate: String,
    emp_type: String,
    settingLeave: {},
    usePassProbation: Boolean,
    key: {}
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
const getHRLeaveSetting = () => __awaiter(this, void 0, void 0, function* () {
    const hrLeave = mongoose.models.hr_leaves || mongoose.model('hr_leaves', HrLeaveSchema);
    let res = yield hrLeave.find({});
    return res;
});
const addCompanyHrLeaveSetting = (data) => __awaiter(this, void 0, void 0, function* () {
    const hrLeave = mongoose.models.hr_leaves || mongoose.model('hr_leaves', HrLeaveSchema);
    const resInsert = yield hrLeave.create(data);
    return resInsert;
});
const updateSettingHrLeave = (props) => __awaiter(this, void 0, void 0, function* () {
    const { id, responsible } = props;
    if (id === undefined) {
        throw new Error("id is undefined");
    }
    // const Mongo = mongoose.models.wf_instances || mongoose.model('hr_leaves', HrLeaveSchema);
    const Mongo = mongoose.model('hr_leaves', HrLeaveSchema);
    const query = {
        _id: mongoose.Types.ObjectId(id),
    };
    const data = {
        "$set": {
            responsible: responsible
        }
    };
    const updateData = yield Mongo.updateOne(query, data);
    // console.log('updateData', updateData)
    return updateData;
});
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
const getHRLeave = (company, emp_type) => __awaiter(this, void 0, void 0, function* () {
    const hrLeave = mongoose.models.hr_leaves || mongoose.model('hr_leaves', HrLeaveSchema);
    let query = {
        company: company,
        "responsible.type": emp_type
    };
    let res = yield hrLeave.findOne(query);
    return res;
});
const getOneSetting = (company, flow) => __awaiter(this, void 0, void 0, function* () {
    const settingData = mongoose.models.company_settings || mongoose.model('company_settings', { company: String, flow: String });
    let query = {
        company: company,
        flow: flow
    };
    let res = yield settingData.findOne(query);
    return res;
});
const getCurrentApprove = () => __awaiter(this, void 0, void 0, function* () {
    const schema = new mongoose.Schema({ data: {} });
    const Tank = mongoose.model('wf_instances', schema);
    let test = yield Tank.find();
    return test;
});
// const addUserlog = async ({user,})
const setDuplicate = (taskID) => __awaiter(this, void 0, void 0, function* () {
    if (taskID === undefined) {
        throw new Error("taskID is undefined");
    }
    let Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let query = {
        task_id: taskID,
    };
    let data = {
        "data.isDuplicate": true
    };
    const updateData = yield Mongo.updateOne(query, data);
    return updateData;
});
const updateLeaveFile = (props) => __awaiter(this, void 0, void 0, function* () {
    const { taskID, filesURL } = props;
    if (taskID === undefined) {
        throw new Error("taskID is undefined");
    }
    let Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let query = {
        task_id: taskID,
    };
    let data = {
        "data.filesURL": filesURL
    };
    const updateData = yield Mongo.updateOne(query, data);
    return updateData;
});
const getLeave = ({ date }) => __awaiter(this, void 0, void 0, function* () {
    try {
        const Tasks = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
        let query = {
            "data.leaveData": { $elemMatch: { "dateStr": { $lte: date } } }
        };
        // console.log('query', query)
        const mongoData = yield Tasks.find(query, Object.assign(Object.assign({}, selectKey), { source: 0, items: 0 }));
        // const mongoData = await Tasks.deleteMany(query)
        // const mongoData = await Tasks.find(query)
        return mongoData;
    }
    catch (error) {
        console.log('error', error);
        return error;
    }
});
const getLeaveCalendar = ({ company, department, section, sub_section, startDate, endDate }) => __awaiter(this, void 0, void 0, function* () {
    try {
        const Tasks = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
        let query = {
            "data.status": { $in: ['Success', 'Waiting'] },
            "data.amount": { $ne: 0 },
            $and: [
                { "data.leaveData": { $elemMatch: { "dateStr": { $gte: startDate } } } },
                { "data.leaveData": { $elemMatch: { "dateStr": { $lte: endDate } } } },
            ],
            'data.requester.company': company,
            'data.requester.department': department
        };
        if (section) {
            query['data.requester.section'] = section;
        }
        if (sub_section) {
            query['data.requester.section.sub_section'] = sub_section;
        }
        console.log('query', query);
        const mongoData = yield Tasks.find(query, Object.assign(Object.assign({}, selectKey), { source: 0, items: 0 }));
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
const hrCancel = (props) => __awaiter(this, void 0, void 0, function* () {
    var _a;
    const { taskID, remark } = props;
    if (taskID === undefined) {
        throw new Error("taskID is undefined");
    }
    if (remark === undefined || remark === "") {
        throw new Error("remark is undefined");
    }
    let Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let query = {
        task_id: taskID,
    };
    let findTask = yield findOneTask(taskID);
    let actionLog = (_a = findTask.data.actionLog) !== null && _a !== void 0 ? _a : [];
    actionLog.push({
        "name": "HR",
        "email": null,
        "empid": null,
        "position": null,
        "level": null,
        "section": null,
        "sub_section": null,
        "company": "-",
        "department": null,
        "filesURL": null,
        "date": dayjs().toDate(),
        "action": "HR Cancel",
        "remark": remark
    });
    let data = {
        "data.actionLog": actionLog,
        "data.status": "hrCancel"
    };
    const updateData = yield Mongo.updateOne(query, data);
    return updateData;
});
const hrSetLeave = (props) => __awaiter(this, void 0, void 0, function* () {
    var _b;
    const { taskID, active, value, dateStr, hrName } = props;
    if (taskID === undefined) {
        throw new Error("taskID is undefined");
    }
    if (active === undefined) {
        throw new Error("active is undefined");
    }
    if (value === undefined) {
        throw new Error("value is undefined");
    }
    if (dateStr === undefined) {
        throw new Error("dateStr is undefined");
    }
    if (hrName === undefined) {
        throw new Error("hrName is undefined");
    }
    let Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let findTask = yield findOneTask(taskID);
    let actionLog = (_b = findTask.data.actionLog) !== null && _b !== void 0 ? _b : [];
    actionLog.push({
        "name": hrName,
        "email": null,
        "empid": null,
        "position": null,
        "level": null,
        "section": "HR",
        "sub_section": null,
        "company": "-",
        "department": null,
        "filesURL": null,
        "date": dayjs().toDate(),
        "action": `HR ${active ? "Active" : "Cancel"}`,
        "remark": `${active ? "Active" : "Cancel"} Leave : ${dayjs(dateStr, "YYYYMMDD").format("DD/MM/YYYY")}`
    });
    let query = {
        task_id: taskID,
        "data.leaveData.dateStr": dateStr
    };
    const indexLeave = _.findIndex(findTask.data.leaveData, function (o) { return o.dateStr === dateStr; });
    findTask.data.leaveData[indexLeave] = Object.assign(Object.assign({}, findTask.data.leaveData[indexLeave]), { value: parseFloat(value), active: active });
    const newAmount = _.sumBy(findTask.data.leaveData, function (o) {
        if (o.active) {
            return parseFloat(o.value);
        }
        return 0;
    });
    const updateDocument = {
        "data.amount": newAmount,
        "data.actionLog": actionLog,
        "$set": {
            "data.leaveData.$.active": active,
            "data.leaveData.$.value": value,
            "data.leaveData.$.hrName": hrName,
        }
    };
    const updateData = yield Mongo.updateOne(query, updateDocument);
    return updateData;
});
const findOneTask = (taskID) => __awaiter(this, void 0, void 0, function* () {
    if (!taskID) {
        throw new Error("taskID is undefined");
    }
    let Mongo;
    Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let query = {
        task_id: taskID,
    };
    let findTask = yield Mongo.findOne(query, selectKey);
    if (findTask === null) {
        throw new Error("taskID is not valid");
    }
    return findTask;
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
const getLeaveDay = (data) => __awaiter(this, void 0, void 0, function* () {
    let empID = data.empID.toUpperCase();
    let { endYear, startYear, date = dayjs().format("YYYYMMDD") } = data;
    // console.log('this date', date)
    //if in attenend send today
    // TODO: GEt leave check Year
    if (endYear === undefined) {
        yield common.calLeave(empID, yield common.checkYear({ empID, date }));
        const getQuota = yield quotaController.getLeaveQuota(empID, date);
        if (getQuota) {
            startYear = getQuota.settingLeave.startYear;
            endYear = getQuota.settingLeave.endYear;
        }
    }
    // const addYear = 0
    // console.log('444', dayjs(date).format("MM"), parseInt(endYear))
    const addYear = parseInt(dayjs(date).format("MM")) > parseInt(endYear) ? 1 : 0;
    // console.log('date', date, addYear)
    const year = dayjs(date).add(addYear, 'year').format("YYYY");
    const currentYear = dayjs(date).add(0, 'year').format("YYYY");
    // console.log('', endYear, startYear)
    const addEndYear = endYear < startYear;
    // console.log('addEndYear', addEndYear)
    if (!empID) {
        throw new Error("employee ID is undefine");
    }
    if (!dayjs(year, 'YYYY').isValid()) {
        throw new Error("Year is invalid");
    }
    // console.log('empID', empID)
    const userInfo = yield CustomFn.default.getUserInfo(empID);
    if (!userInfo.data.status) {
        throw new Error("invalid employee ID");
    }
    const startYearDate = new dayjs(currentYear, 'YYYY').add((addEndYear ? -1 : 0) + addYear, "year").set("month", startYear - 1).format('YYYYMMDD');
    const endYearDate = new dayjs(currentYear, 'YYYY').add(0 + addYear, 'year').set("month", endYear - 1).endOf('month').format('YYYYMMDD');
    const leaveArr = [];
    let findTask = [];
    if (year !== "2023") {
        let Mongo;
        Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
        let query = {
            "data.requester.empid": empID,
            "data.amount": { $ne: 0 },
            "data.status": { $nin: ["hrCancel", "Cancel"] },
            "data.leaveData.dateStr": {
                $gte: startYearDate,
                $lte: endYearDate
            }
        };
        findTask = yield Mongo.aggregate([
            { "$match": query }, { "$project": { source: 0, items: 0, logs: 0, tokens: 0, loops: 0, involvements: 0, authorizations: 0 } }
        ]);
        // console.log('595', query)
        // console.log('595',findTask)
        findTask.forEach((d, indexTask) => {
            const removeArr = [];
            d.data.leaveData.forEach((element, indexLeave) => {
                if (!dayjs(element.dateStr).isSameOrAfter(dayjs(startYearDate, "YYYYMMDD"))) {
                    removeArr.push(indexLeave);
                }
                if (element.active && dayjs(element.dateStr).isSameOrAfter(dayjs(startYearDate, "YYYYMMDD"))) {
                    leaveArr.push({ leaveType: d.data.type, type: d.data.type.value, amount: parseFloat(element.value), date: element.dateStr, from: d.data.reason, status: d.data.status, reason: d.data.reason });
                }
            });
            _.pullAt(findTask[indexTask].data.leaveData, removeArr);
            findTask[indexTask].data.amount = findTask[indexTask].data.leaveData.length;
        });
    }
    if (year === "2023") {
        const getLeaveEss = yield axios.get(`${process.env.ESS_URL}/events/getleave/${empID}`);
        getLeaveEss.data.forEach(d => {
            var _a, _b, _c, _d, _e, _f;
            // console.log('d', d)
            const leaveDate = dayjs(d["TMP_DATE"], "YYYY-MM-DD").format("YYYYMMDD");
            // console.log(startYearDate, "<=", leaveDate, "&&", leaveDate, '>=', endYearDate, startYearDate <= leaveDate , endYearDate >= leaveDate)
            if (startYearDate <= leaveDate && endYearDate >= leaveDate) {
                // console.log('', d)
                if (d["TMP_QTY"] === ".0000") {
                    d.amount = 1;
                }
                else {
                    d.amount = parseFloat(d['TMP_QTY']);
                }
                if ((_a = d['TMP_NOTE']) === null || _a === void 0 ? void 0 : _a.includes('ป่วย')) {
                    d.type = 'sick';
                }
                else if ((_b = d['TMP_NOTE']) === null || _b === void 0 ? void 0 : _b.includes('พักร้อน')) {
                    d.type = 'annual';
                }
                else if ((_c = d['TMP_NOTE']) === null || _c === void 0 ? void 0 : _c.includes('กิจ')) {
                    d.type = 'personal';
                }
                else if ((_d = d['TMP_NOTE']) === null || _d === void 0 ? void 0 : _d.includes('คลอด')) {
                    d.type = 'maternity';
                }
                else if ((_e = d['TMP_NOTE']) === null || _e === void 0 ? void 0 : _e.includes('บวช')) {
                    d.type = 'ordination';
                }
                else if ((_f = d['TMP_NOTE']) === null || _f === void 0 ? void 0 : _f.includes('ทหาร')) {
                    d.type = 'military ';
                }
                const leaveDate = dayjs(d['TMP_DATE'], "YYYY-MM-DD").format('YYYYMMDD');
                const checkLeaveDate = leaveArr.find(element => {
                    // console.log(element.date, leaveDate)
                    return element.date === leaveDate && element.type.toUpperCase().includes(d.type.toUpperCase());
                });
                if (checkLeaveDate) {
                    // console.log('checkLeaveDate', checkLeaveDate)
                }
                else {
                    leaveArr.push({ type: d.type, amount: d.amount, date: leaveDate, from: "ess" });
                    // return d
                }
            }
        });
    }
    const groupedByType = _.groupBy(leaveArr, 'type');
    const result = _.map(groupedByType, (group) => {
        return ({
            type: group[0].type,
            amount: _.sumBy(group, "amount")
        });
    });
    return { leaveData: _.orderBy(leaveArr, ["date"], 'ASC'), sumLeave: result, rawLeave: findTask };
});
const getLeaveQuota = (data) => __awaiter(this, void 0, void 0, function* () {
    const { empID, date = dayjs().toDate() } = data;
    if (!empID) {
        throw new Error("invalid employee ID");
    }
    yield common.calLeave(empID, yield common.checkYear({ empID, date }));
    const getQuota = yield quotaController.getLeaveQuota(empID, date);
    return { quota: getQuota };
});
const calLeaveQuota = (data) => __awaiter(this, void 0, void 0, function* () {
    // updateStartDate(getEssUser.data)
    //TODO: check Year Work
    let { empID, year } = data;
    if (!year) {
        throw new Error(`invalid year  ${year}`);
    }
    if (!empID) {
        const getEssUser = yield axios({
            url: "https://ess.aapico.com/employees?_limit=-1",
            method: "GET",
            // url : "https://ess.aapico.com/employees?start_date_gte=2023-01-01"
        });
        updateLeaveQuota(getEssUser.data, year);
        // updateLeaveQuota(getEssUser.data.filter(d=>d.emp_id.includes("SA")), year)
        return "cal all Emp";
    }
    const res = yield common.calLeave(empID, year);
    return `cal ${empID} success`;
    console.log('', res);
    // await common.updateSettingLeave(newQuotaLeave)
    // return newQuotaLeave
});
module.exports = { getTaskByTaskId, setNewItem, addCompanyHrLeaveSetting, updateSettingHrLeave, getLeave, getLeaveDay, calLeaveQuota, getOneSetting, getHRLeave, getHRLeaveSetting, checkMongoState, getCurrentApprove, getCurrentApproveTask, updateLeaveFile, getAction_logs, getTaskByItemID, hrCancel, hrSetLeave, setDuplicate, getLeaveQuota, clearLogsTask, getLeaveCalendar };
const updateLeaveQuota = (arr, year) => __awaiter(this, void 0, void 0, function* () {
    // const getEssUser = await axios({
    //     url: "https://ess.aapico.com/employees?_limit=-1",
    //     method: "GET",
    //     // url : "https://ess.aapico.com/employees?start_date_gte=2023-01-01"
    // })
    if (arr.length === 0) {
        console.log('done');
        return;
    }
    const d = arr[0];
    console.log('', arr.length, d.emp_id);
    try {
        const empID = d.emp_id;
        if (d.isPayroll !== false) {
            const res = yield common.calLeave(empID, year);
            if (d.isPayroll === null) {
                yield axios({
                    url: `https://ess.aapico.com/employees/${d.id}`,
                    method: "PUT",
                    data: { isPayroll: res.status }
                });
                console.log('updatePayroll', empID);
            }
        }
    }
    catch (error) {
    }
    arr.splice(0, 1);
    setTimeout(() => {
        updateLeaveQuota(arr, year);
    }, 100);
});
const updateStartDate = (arr) => __awaiter(this, void 0, void 0, function* () {
    // const getEssUser = await axios({
    //     url: "https://ess.aapico.com/employees?_limit=-1",
    //     method: "GET",
    //     // url : "https://ess.aapico.com/employees?start_date_gte=2023-01-01"
    // })
    console.log('', arr.length);
    if (arr.length === 0) {
        console.log('done');
        return;
    }
    arr.splice(0, 1);
    const d = arr[0];
    if (d.start_date === null || d.start_date === "") {
        try {
            const userInfo = yield CustomFn.default.getUserInfo(d.emp_id.toUpperCase());
            if (userInfo.data.status) {
                const getEssUser = yield axios({
                    url: `https://ess.aapico.com/employees/${d.id}`,
                    method: "PUT",
                    data: { start_date: userInfo.data.employee.start_date }
                });
                console.log('success', d.emp_id);
            }
            else {
                console.log("no User", d.emp_id);
            }
        }
        catch (error) {
            console.log(error);
        }
    }
    setTimeout(() => {
        updateStartDate(arr);
    }, 300);
});
//# sourceMappingURL=api.js.map