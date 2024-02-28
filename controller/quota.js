"use strict";
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeaveQuota = exports.getLeaveQuota = void 0;
const lodash_1 = __importDefault(require("lodash"));
const mongoose_1 = __importDefault(require("mongoose"));
const quotaSchema = new mongoose_1.default.Schema({
    empID: String,
    startDate: String,
    emp_type: String,
    settingLeave: {},
    usePassProbation: Boolean,
    key: {},
    userInfo: {},
    // s2024: {}
}, { strict: false });
const getLeaveQuota = (empID, date) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log('26',empID)
    const leaveQuotaSchema = mongoose_1.default.models.leavequotas || mongoose_1.default.model('leavequotas', quotaSchema);
    const getQuota = lodash_1.default.cloneDeep(yield leaveQuotaSchema.findOne({ empID: empID }));
    return getQuota;
});
exports.getLeaveQuota = getLeaveQuota;
const updateLeaveQuota = (props) => __awaiter(void 0, void 0, void 0, function* () {
    const { empID } = props;
    if (empID === undefined) {
        throw new Error("empID is undefined");
    }
    //@ts-ignore
    const Mongo = mongoose_1.default.models.leaveQuotas || mongoose_1.default.model('leavequotas', quotaSchema);
    const query = {
        empID: empID
    };
    const data = Object.assign({}, props);
    const options = { upsert: true };
    // console.log('query',query)
    const updateData = yield Mongo.updateOne(query, data, options);
    // console.log('updateData',updateData)
    // return updateData;
});
exports.updateLeaveQuota = updateLeaveQuota;
module.exports = { getLeaveQuota: exports.getLeaveQuota, updateLeaveQuota: exports.updateLeaveQuota };
//# sourceMappingURL=quota.js.map