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
const UsersSchema = new mongoose.Schema({
    data: {},
    startedAt: ""
});
const checkMongoState = () => {
    return (mongoose.connection.readyState);
    // 0: disconnected
    // 1: connected
    // 2: connecting
    // 3: disconnecting
};
const getCurrentApprove = () => __awaiter(this, void 0, void 0, function* () {
    const schema = new mongoose.Schema({ data: {} });
    const Tank = mongoose.model('wf_instances', schema);
    let test = yield Tank.find();
    return test;
});
const getmyTask = ({ empid, status, startDate, endDate }) => __awaiter(this, void 0, void 0, function* () {
    console.log(23, empid, status, startDate, endDate);
    let Tasks;
    Tasks = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let mongoData = yield Tasks.find({
        "data.requester.empid": empid === null || empid === void 0 ? void 0 : empid.toUpperCase(),
        "data.status": status,
        "startedAt": {
            $gte: startDate,
            $lt: endDate
        }
    });
    console.log(mongoData.length);
    return mongoData;
});
const getCurrentApproveTask = ({ empid, level, section, department, company }) => __awaiter(this, void 0, void 0, function* () {
    console.log(empid, level, section, department, company);
    let Mongo;
    Mongo = mongoose.models.wf_instances || mongoose.model('wf_instances', UsersSchema);
    let mongoData = yield Mongo.find({
        "data.empid": empid === null || empid === void 0 ? void 0 : empid.toUpperCase(), "data.status": "Waiting",
        $or: [{
                $and: [
                    { "data.currentApprover.level": level },
                    { "data.currentApprover.section": section },
                    { "data.currentApprover.department": department },
                    { "data.currentApprover.company": company },
                ]
            }, { "data.currentApprover.empid": empid }]
    });
    return mongoData;
});
module.exports = { checkMongoState, getCurrentApprove, getmyTask, getCurrentApproveTask };
//# sourceMappingURL=api.js.map