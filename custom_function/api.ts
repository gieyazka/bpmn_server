const mongoose = require('mongoose');
const dayjs = require('dayjs')
var axios = require('axios');
const { subStrEmpID } = require('.././utils/common');
const CustomFn = require('./index')
const _ = require('lodash')
const UsersSchema = new mongoose.Schema({
    items: {

    },
    data: {

    },
    task_id: String,
    issueDate: Date
});

const HrLeaveSchema = new mongoose.Schema({
    _id: Object,
    company: String,
    responsible: []

})

const checkMongoState = () => {
    return (mongoose.connection.readyState);
    // 0: disconnected
    // 1: connected
    // 2: connecting
    // 3: disconnecting
}




const getHRLeave = async (company, emp_type) => {
    const hrLeave = mongoose.models.hr_leaves || mongoose.model('hr_leaves', HrLeaveSchema);
    let query = {
        company: company,
        "responsible.type": emp_type
    }
    let res = await hrLeave.findOne(query)
    return res;
}
const getOneSetting = async (company, flow) => {
    const settingData = mongoose.models.company_settings || mongoose.model('company_settings', {});
    let query = {
        company: { $in: [company] },
        flow: flow
    }
    let res = await settingData.findOne(query)
    return res;
}



const getCurrentApprove = async () => {
    const schema = new mongoose.Schema({ data: {} });
    const Tank = mongoose.model('wf_instances', schema);
    let test = await Tank.find()
    return test;
}

// const addUserlog = async ({user,})


const setDuplicate = async (taskID) => {
    if (taskID === undefined) {
        throw new Error("taskID is undefined");
    }

    let Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let query = {
        task_id: taskID,
    }
    let data = {

        "data.isDuplicate": true
    }
    const updateData = await Mongo.updateOne(query, data)
    return updateData;
}


const getmyTask = async ({ empid, status, startDate, endDate, flowNames }) => {
    // console.log(23, empid, status, startDate, endDate, flowNames);
    if (!empid) {
        throw new Error("empid is undefine");

    }

    // if (!startDate) {
    //     throw new Error("startDate is undefined");
    // }

    try {

        const Tasks = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
        let query = {
            "data.requester.empid": empid?.toUpperCase(),
            "issueDate": {
                $gte: startDate,
                $lt: endDate
            }
        }
        if (endDate === null) {
            // @ts-ignore
            query = {
                "data.requester.empid": empid?.toUpperCase(),
                // @ts-ignore
                "issueDate": {
                    $gte: startDate,
                }
            }
        }
        if (!startDate && !endDate) {
            // @ts-ignore
            query = {
                "data.requester.empid": empid?.toUpperCase(),
                // @ts-ignore

            }
        }
        if (status !== undefined && status !== null) {
            if (status === "Success" || status === "Cancel") {

                query["data.status"] = { $in: ['Success', 'Cancel', "hrCancel"] }
            } else {
                query["data.status"] = status

            }
        }

        if (Array.isArray(flowNames) && flowNames.length != 0) {
            query["data.flowName"] = { $all: flowNames }
        }
        const mongoData = await Tasks.find(query)
        // const mongoData = await Tasks.find(query)

        return mongoData;
    } catch (error) {
        console.log('error', error)
        return error;

    }
}
const getTaskByItemID = async (itemID) => {
    // console.log(23, empid, status, startDate, endDate, flowNames);

    if (!itemID) {
        return "ItemID is undefined";
    }
    const Tasks = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    const query = { items: { $elemMatch: { id: itemID } } }




    const mongoData = await Tasks.find(query)
    if (mongoData.length > 0) {
        return mongoData[0]
    }
    return undefined;
}

const getCurrentApproveTask = async (props) => {
    const { empid, level, section, department, company, username, name } = props.user
    const { startDate, endDate } = props.filterStore

    if (!empid) {
        throw new Error("empid is undefine");

    }

    // if (!startDate) {
    //     throw new Error("startDate is undefined");
    // }
    // console.log('111 user',username)
    // console.log('112 name',name)

    let Mongo
    Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let query = {
        // "data.empid": empid?.toUpperCase(),
        "data.status": "Waiting", "issueDate": {
            $gte: startDate,
            $lt: endDate
        },
        $or: [{
            $and: [
                { "data.currentApprover.level": level },
                { "data.currentApprover.section": section },
                { "data.currentApprover.department": department },
                { "data.currentApprover.company": company },
            ]
        }, { "data.currentApprover.empid": empid }]
    }
    if (!endDate) {

        delete query.issueDate.$lt
    }
    if (!startDate && !endDate) {
        delete query.issueDate
    }
    let mongoData = await Mongo.find(query)
    return mongoData;
}


const getAction_logs = async (props) => {
    const { empid, level, section, department, company, username } = props.user
    const { startDate, endDate } = props.filterStore

    if (!empid) {
        throw new Error("empid is undefined");
    }

    // if (!startDate) {
    //     throw new Error("startDate is undefined");
    // }

    // if (!endDate) {
    //     return "endDate is undefined";
    // }
    let Mongo
    Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let query = {
        "issueDate": {
            $gte: startDate,
            $lt: endDate
        },
        "data.actionLog": { $elemMatch: { empid: username, "action": { "$ne": "Submit" } } }
    }
    if (endDate === null) {
        // @ts-ignore
        delete query.issueDate.$lt
    }
    if (!startDate && !endDate) {
        delete query.issueDate
    }
    let mongoData = await Mongo.find(query)
    return mongoData;
}

const hrCancel = async (props) => {
    const { taskID, remark } = props
    if (taskID === undefined) {
        throw new Error("taskID is undefined");
    }
    if (remark === undefined || remark === "") {
        throw new Error("remark is undefined");
    }
    let Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let query = {
        task_id: taskID,
    }
    let findTask = await findOneTask(taskID)
    let actionLog = findTask.data.actionLog ?? []
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
    })
    let data = {
        "data.actionLog": actionLog,
        "data.status": "hrCancel"
    }
    const updateData = await Mongo.updateOne(query, data)
    return updateData;
}
const hrSetLeave = async (props) => {
    const { taskID, active, value, dateStr, hrName } = props
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

    let findTask = await findOneTask(taskID)
    let actionLog = findTask.data.actionLog ?? []
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
    })

    let query = {
        task_id: taskID,
        "data.leaveData.dateStr": dateStr
    }

    const indexLeave = _.findIndex(findTask.data.leaveData, function (o) { return o.dateStr == dateStr });
    findTask.data.leaveData[indexLeave] = { ...findTask.data.leaveData[indexLeave], value: parseFloat(value), active: active };
    const newAmount = _.sumBy(findTask.data.leaveData, function (o) {
        if (o.active) {
            return o.value
        } return 0
    })

    const updateDocument = {
        "data.amount": newAmount,
        "data.actionLog": actionLog,
        "$set": {
            "data.leaveData.$.active": active,
            "data.leaveData.$.value": value,
            "data.leaveData.$.hrName": hrName,
        }
    };
    const updateData = await Mongo.updateOne(query, updateDocument)
    return updateData;
}

const findOneTask = async (taskID) => {
    if (!taskID) {
        throw new Error("taskID is undefined");
    }
    let Mongo
    Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let query = {
        task_id: taskID,
    }
    let findTask = await Mongo.findOne(query)
    if (findTask === null) {
        throw new Error("taskID is not valid");
    }
    return findTask;
}


const getLeaveDay = async (data) => {
    const { empID, year } = data
    if (!empID) {
        throw new Error("employee ID is undefine")
    }
    if (!year) {
        throw new Error("Year is undefine")
    }
    if (!dayjs(year, 'YYYY').isValid()) {
        throw new Error("Year is invalid")
    }
    const startYear = dayjs(year, 'YYYY').startOf('year').format('YYYYMMDD')
    const endYear = dayjs(year, 'YYYY').endOf('year').format('YYYYMMDD')

    let Mongo
    Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let query = {
        "data.requester.empid": empID,
        "data.status": { $nin: ["hrCancel", "Cancel"] },
        "data.leaveData.dateStr": {
            $gte: startYear,
            $lt: endYear
        }
    }

    // let findTask = await Mongo.find(query)
    let findTask = await Mongo.aggregate([
        { "$match": query }, { "$project": { source: 0, items: 0, logs: 0, tokens: 0, loops: 0, involvements: 0, authorizations: 0 } }
    ])
    const groupedByType = _.groupBy(findTask, 'data.type.value');
    const result = _.map(groupedByType, (group) => {
        return ({
            type: group[0].data.type.value,
            sumAmount: _.sumBy(group, "data.amount")
        })
    });
    return result
}

const getLeaveQuota = async (data) => {
    const { empID } = data
    if (!empID) {
        throw new Error("invalid employee ID")
    }
    const [company, empNoCompany] = subStrEmpID(empID)
    const userInfo = await CustomFn.default.getUserInfo(empID.toUpperCase())
    if (!userInfo.data.status) {
        throw new Error("invalid employee ID")
    }
    const config = {
        method: 'get',
        url: `${process.env.ESS_URL}/annualleaves?emp_id=${empNoCompany}&company=${company}`,
        validateStatus: function (status) {
            return status < 500; // Resolve only if the status code is less than 500
        }
    };
    // console.log('', `${process.env.ESS_URL}/annualleaves?emp_id=${empNoCompany}&company=${company}`)
    const res = await axios(config).then((d) => console.log('d', d.status)).catch(err => console.log('err', err))

    if (res.statusCode !== 200) {
        if (!userInfo.data.status) {
            throw new Error("Annual Leave went wrong")
        }
    }
    const { start_date } = userInfo.data.employee
    let now = new dayjs()
    let nowYear = now.format('YYYY')
    let nextYear = dayjs().startOf('year').add(1, 'year')
    const quotaLeave = [{
        "year": nowYear,
        annual_leave_qty: 0
    }, {
        "year": nextYear.format('YYYY'),
        annual_leave_qty: 0
    }]

    // if (res.data.length === 0) {
    //     return quotaLeave
    // }
    const settingLeave = await getOneSetting(company, "leave_flow")
    const parseSetting = JSON.parse(JSON.stringify(settingLeave))
    if (parseInt(now.format("MM")) > parseSetting.endYear) {
        now = dayjs(now).add(1, 'year')
        nextYear = dayjs(nextYear).add(1, 'year')
        nowYear = now.format('YYYY')
    }
    const startDate = dayjs(start_date, 'YYYY-MM-DD')
    const difYear = now.diff(startDate, 'year')
    const difNextYear = nextYear.diff(startDate, 'year')
    //check next year for
    console.log('res', res.data)
    // if (res.data.length !== 0) {
    let annual_leave_qty = 0, syear = now.format('YYYY')
    console.log('syear', syear)
    console.log(' difYear', difYear)
    // if (nowYear === syear) {
    if (difYear === 1) {
        const fullyYearQuota = parseSetting.fullyYear.find(d => d.month === parseInt(startDate.format('MM')))
        quotaLeave[0].annual_leave_qty = fullyYearQuota.annual_leave_qty ?? 0
    } else if (difYear > 1) {
        if (res.data[0]) {
            quotaLeave[0].annual_leave_qty = res.data[0].annual_leave_qty
        } else {
            const nextYearLeave = _.orderBy(parseSetting.condition, ['workYear',], ['desc']).find(d => difYear >= d.workYear)
            quotaLeave[0].annual_leave_qty = nextYearLeave ? nextYearLeave.annual_leave_qty : 0
        }
    } else {
        const fullyYearQuota = parseSetting.fullyYear.find(d => d.month === parseInt(startDate.format('MM')))

        if (difNextYear === 0) {
            quotaLeave[1]['fullyYear'] = fullyYearQuota.annual_leave_qty ?? 0
        } else {
            quotaLeave[0]['fullyYear'] = fullyYearQuota.annual_leave_qty ?? 0
        }
    }
    // } else {
    //TODO: คาบเกี่ยวไปปีหน้าแล้วยังไม่มีข้อมูล
    // }
    // } else {
    //     const fullyYearQuota = parseSetting.fullyYear.find(d => d.month === parseInt(startDate.format('MM')))
    //     quotaLeave[0]['fullyYear'] = fullyYearQuota.annual_leave_qty ?? 0
    // }
    const nextYearLeave = _.orderBy(parseSetting.condition, ['workYear',], ['desc']).find(d => difNextYear >= d.workYear)
    quotaLeave[1].annual_leave_qty = nextYearLeave ? nextYearLeave.annual_leave_qty : 0
    return quotaLeave

}

module.exports = { getLeaveDay, getOneSetting, getHRLeave, checkMongoState, getCurrentApprove, getmyTask, getCurrentApproveTask, getAction_logs, getTaskByItemID, hrCancel, hrSetLeave, setDuplicate, getLeaveQuota };

