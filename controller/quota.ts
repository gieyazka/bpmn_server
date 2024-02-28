//@ts-nocheck

import CommonFn from "../custom_function/common"
import CustomFn from "../custom_function/index"
import _ from 'lodash'
import axios from 'axios';
import dayjs from 'dayjs'
import mongoose from 'mongoose';
import { subStrEmpID } from '.././utils/common';

const quotaSchema = new mongoose.Schema({
    empID: String,
    startDate: String,
    emp_type: String,
    settingLeave: {},
    usePassProbation: Boolean,
    key: {},
    userInfo: {},
    // s2024: {}


}, { strict: false })


export const getLeaveQuota = async (empID, date) => {
    // console.log('26',empID)
    const leaveQuotaSchema = mongoose.models.leavequotas || mongoose.model('leavequotas', quotaSchema);
    const getQuota = _.cloneDeep(await leaveQuotaSchema.findOne({ empID: empID }))
    return getQuota
}
export const updateLeaveQuota = async (props) => {
    const { empID } = props
    if (empID === undefined) {
        throw new Error("empID is undefined");
    }
    //@ts-ignore
    const Mongo = mongoose.models.leaveQuotas || mongoose.model('leavequotas', quotaSchema);
    const query = {
        empID: empID
    }
    const data = {
        ...props
    }
    const options = { upsert: true };
    // console.log('query',query)
    const updateData = await Mongo.updateOne(query, data, options)
    // console.log('updateData',updateData)
    // return updateData;
}



module.exports = { getLeaveQuota, updateLeaveQuota }