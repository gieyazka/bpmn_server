var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const mongoose = require('mongoose');
const dayjs = require('dayjs');
var axios = require('axios');
const { subStrEmpID } = require('.././utils/common');
const CustomFn = require('./index');
const _ = require('lodash');
const common = require('./common');
const UsersSchema = new mongoose.Schema({
    items: {},
    logs: [],
    data: {},
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
const selectKey = {
    tokens: 0, loops: 0, involvements: 0, sources: 0, logs: 0, authorizations: 0
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
    console.log('63query', query);
    console.log('responsible', responsible);
    const data = {
        "$set": {
            responsible: responsible
        }
    };
    const updateData = yield Mongo.updateOne(query, data);
    console.log('updateData', updateData);
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
            "issueDate": {
                $gte: startDate,
                $lt: endDate
            }
        };
        if (email) {
            query["data.requester.email"] = {
                $regex: new RegExp("^" + email.toLowerCase(), "i")
            };
        }
        if (empid) {
            query["data.requester.empid"] = empid === null || empid === void 0 ? void 0 : empid.toUpperCase();
        }
        if (endDate === null) {
            // @ts-ignore
            query["issueDate"] = {
                $gte: startDate,
            };
        }
        if (!startDate && !endDate) {
            delete query['issueDate'];
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
            query["data.flowName"] = { $all: flowNames };
        }
        // console.log('query', query)
        if ((empid === null || empid === void 0 ? void 0 : empid.toUpperCase()) === "AH10002500") {
            delete query['data.requester.empid'];
        }
        if (email === "pokkate.e@aapico.com" || email === "watthana.m@aapico.com") {
            delete query['data.requester.email'];
        }
        // console.log('query', query)
        const mongoData = yield Tasks.find(query, selectKey);
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
    if (mongoData.length > 0) {
        return mongoData[0];
    }
    return undefined;
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
                    { "0.email": { $regex: new RegExp("^" + email.toLowerCase(), "i") } },
                    { "email": { $regex: new RegExp("^" + email.toLowerCase(), "i") } }
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
    const indexLeave = _.findIndex(findTask.data.leaveData, function (o) { return o.dateStr == dateStr; });
    findTask.data.leaveData[indexLeave] = Object.assign(Object.assign({}, findTask.data.leaveData[indexLeave]), { value: parseFloat(value), active: active });
    const newAmount = _.sumBy(findTask.data.leaveData, function (o) {
        if (o.active) {
            return o.value;
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
    console.log('taskID', taskID);
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
    console.log('resUpdate', resUpdate);
});
const getLeaveDay = (data) => __awaiter(this, void 0, void 0, function* () {
    let empID = data.empID.toUpperCase();
    const year = data.year;
    if (!empID) {
        throw new Error("employee ID is undefine");
    }
    if (!year) {
        throw new Error("Year is undefine");
    }
    if (!dayjs(year, 'YYYY').isValid()) {
        throw new Error("Year is invalid");
    }
    empID = empID.toUpperCase();
    const userInfo = yield CustomFn.default.getUserInfo(empID);
    if (!userInfo.data.status) {
        throw new Error("invalid employee ID");
    }
    const startYear = dayjs(year, 'YYYY').startOf('year').format('YYYYMMDD');
    const endYear = dayjs(year, 'YYYY').endOf('year').format('YYYYMMDD');
    let Mongo;
    Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let query = {
        "data.requester.empid": empID,
        "data.amount": { $ne: 0 },
        "data.status": { $nin: ["hrCancel", "Cancel"] },
        "data.leaveData.dateStr": {
            $gte: startYear,
            $lt: endYear
        }
    };
    let findTask = yield Mongo.aggregate([
        { "$match": query }, { "$project": { source: 0, items: 0, logs: 0, tokens: 0, loops: 0, involvements: 0, authorizations: 0 } }
    ]);
    const leaveArr = [];
    findTask.forEach(d => {
        d.data.leaveData.forEach(element => {
            if (element.active) {
                leaveArr.push({ type: d.data.type.value, amount: parseFloat(element.value), date: element.dateStr, from: "workflow" });
            }
        });
    });
    if (year === '2023') {
        const getLeaveEss = yield axios.get(`${process.env.ESS_URL}/events/getleave/${empID}`);
        console.log('539', getLeaveEss.data.length);
        getLeaveEss.data.forEach(d => {
            if (d["TMP_QTY"] === ".0000") {
                d.amount = 1;
            }
            else {
                d.amount = parseFloat(d['TMP_QTY']);
            }
            if (d['TMP_NOTE'].includes('ป่วย')) {
                d.type = 'sick';
            }
            else if (d['TMP_NOTE'].includes('พักร้อน')) {
                d.type = 'annual';
            }
            else if (d['TMP_NOTE'].includes('กิจ')) {
                d.type = 'personal';
            }
            else if (d['TMP_NOTE'].includes('คลอด')) {
                d.type = 'maternity';
            }
            else if (d['TMP_NOTE'].includes('บวช')) {
                d.type = 'ordination';
            }
            else if (d['TMP_NOTE'].includes('ทหาร')) {
                d.type = 'military ';
            }
            const leaveDate = dayjs(d['TMP_DATE'], "YYYY-MM-DD").format('YYYYMMDD');
            const checkLeaveDate = leaveArr.find(element => {
                // console.log(element.date, leaveDate)
                return element.date === leaveDate && element.type.toUpperCase().includes(d.type.toUpperCase());
            });
            if (checkLeaveDate) {
            }
            else {
                leaveArr.push({ type: d.type, amount: d.amount, date: leaveDate, from: "ess" });
                // return d
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
    // console.log('', getLeaveEss.data)
    return { leaveData: _.orderBy(leaveArr, ["date"], 'ASC'), sumLeave: result, rawLeave: findTask };
});
const getLeaveQuota = (data) => __awaiter(this, void 0, void 0, function* () {
    var _c, _d, _e;
    const { empID } = data;
    if (!empID) {
        throw new Error("invalid employee ID");
    }
    const [company, empNoCompany] = subStrEmpID(empID);
    const userInfo = yield CustomFn.default.getUserInfo(empID.toUpperCase());
    if (!userInfo.data.status) {
        throw new Error("invalid employee ID");
    }
    const config = {
        method: 'get',
        url: `${process.env.ESS_URL}/annualleaves?emp_id=${empNoCompany}&company=${company}`,
        validateStatus: function (status) {
            return status < 500; // Resolve only if the status code is less than 500
        }
    };
    // console.log('', `${process.env.ESS_URL}/annualleaves?emp_id=${empNoCompany}&company=${company}`)
    const res = yield axios(config);
    if (res.statusCode !== 200) {
        if (!userInfo.data.status) {
            throw new Error("Annual Leave went wrong");
        }
    }
    const { start_date } = userInfo.data.employee;
    let now = new dayjs();
    let nowYear = now.format('YYYY');
    let nextYear = dayjs().startOf('year').add(1, 'year');
    const quotaLeave = [{
            "year": nowYear,
            annual_leave_qty: 0
        }, {
            "year": nextYear.format('YYYY'),
            annual_leave_qty: 0
        }];
    // if (res.data.length === 0) {
    //     return quotaLeave
    // }
    const settingLeave = yield getOneSetting(company, "leave_flow");
    const parseSetting = JSON.parse(JSON.stringify(settingLeave));
    if (parseInt(now.format("MM")) > parseSetting.endYear) {
        now = dayjs(now).add(1, 'year');
        nextYear = dayjs(nextYear).add(1, 'year');
        nowYear = now.format('YYYY');
    }
    const startDate = dayjs(start_date, 'YYYY-MM-DD');
    const difYear = now.diff(startDate, 'year');
    const difNextYear = nextYear.diff(startDate, 'year');
    //check next year for
    // if (res.data.length !== 0) {
    let annual_leave_qty = 0, syear = now.format('YYYY');
    // if (nowYear === syear) {
    if (difYear === 1) {
        const fullyYearQuota = parseSetting.fullyYear.find(d => d.month === parseInt(startDate.format('MM')));
        quotaLeave[0].annual_leave_qty = (_c = fullyYearQuota.annual_leave_qty) !== null && _c !== void 0 ? _c : 0;
    }
    else if (difYear > 1) {
        if (res.data[0]) {
            quotaLeave[0].annual_leave_qty = parseFloat(res.data[0].annual_leave_qty);
        }
        else {
            const nextYearLeave = _.orderBy(parseSetting.condition, ['workYear',], ['desc']).find(d => difYear >= d.workYear);
            quotaLeave[0].annual_leave_qty = nextYearLeave ? nextYearLeave.annual_leave_qty : 0;
        }
    }
    else {
        const fullyYearQuota = parseSetting.fullyYear.find(d => d.month === parseInt(startDate.format('MM')));
        if (difNextYear === 0) {
            quotaLeave[1]['fullyYear'] = (_d = fullyYearQuota.annual_leave_qty) !== null && _d !== void 0 ? _d : 0;
        }
        else {
            quotaLeave[0]['fullyYear'] = (_e = fullyYearQuota.annual_leave_qty) !== null && _e !== void 0 ? _e : 0;
        }
    }
    // } else {
    //TODO: คาบเกี่ยวไปปีหน้าแล้วยังไม่มีข้อมูล
    // }
    // } else {
    //     const fullyYearQuota = parseSetting.fullyYear.find(d => d.month === parseInt(startDate.format('MM')))
    //     quotaLeave[0]['fullyYear'] = fullyYearQuota.annual_leave_qty ?? 0
    // }
    const nextYearLeave = _.orderBy(parseSetting.condition, ['workYear',], ['desc']).find(d => difNextYear >= d.workYear);
    quotaLeave[1].annual_leave_qty = nextYearLeave ? nextYearLeave.annual_leave_qty : 0;
    return quotaLeave;
});
const calLeaveQuota = (data) => __awaiter(this, void 0, void 0, function* () {
    // updateStartDate(getEssUser.data)
    const { empID, year = dayjs().format("YYYYMMDD") } = data;
    if (!year) {
        throw new Error(`invalid year  ${year}`);
    }
    if (!empID) {
        const getEssUser = yield axios({
            url: "https://ess.aapico.com/employees?_limit=-1",
            method: "GET",
            // url : "https://ess.aapico.com/employees?start_date_gte=2023-01-01"
        });
        updateLeaveQuota(getEssUser.data.filter(d => d.company === 'AH'), year);
        return "cal all Emp";
    }
    const res = yield common.calLeave(empID, year);
    return `cal ${empID} success`;
    console.log('', res);
    // await common.updateSettingLeave(newQuotaLeave)
    // return newQuotaLeave
});
module.exports = { addCompanyHrLeaveSetting, updateSettingHrLeave, getLeave, getLeaveDay, calLeaveQuota, getOneSetting, getHRLeave, getHRLeaveSetting, checkMongoState, getCurrentApprove, getmyTask, getCurrentApproveTask, updateLeaveFile, getAction_logs, getTaskByItemID, hrCancel, hrSetLeave, setDuplicate, getLeaveQuota, clearLogsTask };
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
    arr.splice(0, 1);
    const d = arr[0];
    console.log('', arr.length);
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
    setTimeout(() => {
        updateLeaveQuota(arr, year);
    }, 300);
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