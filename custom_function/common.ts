
// let mongoose = require('mongoose');

import CustomFn from './index'
import mongoose from "mongoose";

const apiFn = require("./api")


let dayjs = require('dayjs')
var axios = require('axios');
// let { subStrEmpID } = require('.././utils/common');

let _ = require('lodash')

const leaveSchema = new mongoose.Schema({
    empID: String,
    startDate: String,

}, { strict: false })

const updateSettingLeave = async (props) => {
    const { empID, responsible, } = props
    if (empID === undefined) {
        throw new Error("empID is undefined");
    }
    //@ts-ignore
    const Mongo = mongoose.models.leaveQuotas || mongoose.model('leaveQuota', leaveSchema);
    const query = {
        empID: empID
    }
    const data = {
        ...props
    }
    const options = { upsert: true };
    const updateData = await Mongo.updateOne(query, data, options)
    // return updateData;
}


const countAnnualLeaveEss = async (company, emp_id) => {
    const essLeave = await axios.get(`${process.env.ESS_URL}/events/getleave/${company.toUpperCase()}${emp_id}`)
    let countOldLeave = 0
    essLeave.data.forEach(d => {
        if (d["TMP_QTY"] === ".0000") {
            d.amount = 1
        } else {
            d.amount = parseFloat(d['TMP_QTY'])
        }

        if (d['TMP_NOTE'].includes('พักร้อน')) {
            countOldLeave += d.amount
        }

    })
    return countOldLeave
}


const calLeave = async (empID, year) => {
    try {
        const userInfo = await CustomFn.getUserInfo(empID.toUpperCase())
        if (!userInfo.data.status) {
            throw new Error(`invalid employee ID ${empID}`)
        }
        const { emp_id, company, start_date } = userInfo.data.employee
        let now = new dayjs(year, "YYYY")
        let nowYear = year
        let nextYear = dayjs().startOf('year').add(1, 'year')
        // console.log('', `${process.env.ESS_URL}/annualleaves?emp_id=${empNoCompany}&company=${company}`)
        let remainAnnualLeave = {
            quota: 0, use: 0, remain: 0
        }
        const quotaLeave = {
            "year": nextYear.format('YYYY'),
            annual_leave_qty: remainAnnualLeave
        }
        if (nowYear.toString() === "2023") {
            const annualLeave = await countAnnualLeaveEss(company, emp_id)

            const config = {
                method: 'get',
                url: `${process.env.ESS_URL}/annualleaves?emp_id=${emp_id}&company=${company}&syear=${nowYear}`,
                validateStatus: function (status) {
                    return status < 500; // Resolve only if the status code is less than 500
                }
            };
            const res = await axios(config)

            if (res.status !== 200) {
                throw new Error("Annual Leave went wrong")
            }
            if (!res.data[0]) {
                remainAnnualLeave = { quota: 0, use: annualLeave, remain: 0 - annualLeave }
            } else {
                const remain = parseFloat(res.data[0].annual_leave_qty) - annualLeave

                remainAnnualLeave = { quota: parseFloat(res.data[0].annual_leave_qty), use: annualLeave, remain: remain > 5 ? 5 : remain }
            }

        }
        const settingLeave = await apiFn.getOneSetting(company, "leave_flow")
        if (!settingLeave) {
            throw new Error("no setting leave company")
        }
        const /* `parseSetting` is a variable that stores the parsed JSON object of the `settingLeave`
        variable. It is used to access and retrieve specific values from the `settingLeave`
        object. */
            parseSetting = JSON.parse(JSON.stringify(settingLeave))

        const startDate = dayjs(start_date, 'YYYY-MM-DD')
        const difYear = now.diff(startDate, 'year')
        const difNextYear = nextYear.diff(startDate, 'year')

        const fullyYearQuota = parseSetting.fullyYear.find(d => d.month === parseInt(startDate.format('MM')))

        const nextYearLeave = _.orderBy(parseSetting.condition, ['workYear',], ['desc']).find(d => difNextYear >= d.workYear)
        quotaLeave[nextYear.format("YYYY")] = nextYearLeave ? nextYearLeave.annual_leave_qty : 0
        quotaLeave["new"] =
            quotaLeave["remain"] = remainAnnualLeave
        const s_year = `s${nextYear.format("YYYY")}`
        const newQuotaLeave = {
            empID: empID,
            startDate: start_date,
        }
        newQuotaLeave[s_year] = {
            yearWork: difNextYear,
            old: remainAnnualLeave,
            new: {
                quota: nextYearLeave ? nextYearLeave.annual_leave_qty : 0, use: 0, remain: nextYearLeave ? nextYearLeave.annual_leave_qty : 0,
            },
            fullyYear: difNextYear === 0 ? fullyYearQuota.annual_leave_qty : 0,
            expireMonth: parseSetting.expireMonth ?? null
        }
        await updateSettingLeave(newQuotaLeave)
        console.log('done', empID)
        return { status: true }
    } catch (error) {
        console.log(error);
        return { status: false }
    }
}
const common = {
    updateSettingLeave, calLeave

}
module.exports = common