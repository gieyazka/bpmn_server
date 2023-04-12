const mongoose = require('mongoose');
const dayjs = require('dayjs')

const UsersSchema = new mongoose.Schema({
    data: {

    },
    startedAt: ""
});
const checkMongoState = () => {
    return (mongoose.connection.readyState);
    // 0: disconnected
    // 1: connected
    // 2: connecting
    // 3: disconnecting
}


const getCurrentApprove = async () => {
    const schema = new mongoose.Schema({ data: {} });
    const Tank = mongoose.model('wf_instances', schema);
    let test = await Tank.find()
    return test;
}




const getmyTask = async ({ empid, status, startDate, endDate, flowNames }) => {
    console.log(23, empid, status, startDate, endDate, flowNames);
    if (!empid) {
        return "empid is undefined";
    }

    if (!startDate) {
        return "startDate is undefined";
    }

    if (!endDate) {
        return "endDate is undefined";
    }
    const Tasks = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    const query = {
        "data.requester.empid": empid?.toUpperCase(),
        "startedAt": {
            $gte: startDate,
            $lt: endDate
        }
    }

    if (status !== undefined && status !== null) {
        query["data.status"] = status
    }

    if (Array.isArray(flowNames) && flowNames.length != 0) {
        query["data.flowName"] = { $all: flowNames }
    }
    console.log(query);

    const mongoData = await Tasks.find(query)
    console.log(mongoData.length);

    return mongoData;
}

const getCurrentApproveTask = async ({ empid, level, section, department, company }) => {
    console.log(empid, level, section, department, company);

    let Mongo
    Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let mongoData = await Mongo.find({
        "data.empid": empid?.toUpperCase(), "data.status": "Waiting",
        $or: [{
            $and: [
                { "data.currentApprover.level": level },
                { "data.currentApprover.section": section },
                { "data.currentApprover.department": department },
                { "data.currentApprover.company": company },
            ]
        }, { "data.currentApprover.empid": empid }]
    })
    return mongoData;
}







module.exports = { checkMongoState, getCurrentApprove, getmyTask, getCurrentApproveTask };

