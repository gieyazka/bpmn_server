//@ts-nocheck
// let mongoose = require('mongoose');

import * as quotaController from '../controller/quota'

import EleaveFn from './index'
import apiFn from "./api"
import customFn from '../custom_function/index'
import dayjs from 'dayjs'
import fs from "fs"
import isBetween from 'dayjs/plugin/isBetween'
import mongoose from "mongoose";

dayjs.extend(isBetween)
var axios = require('axios');
// let { subStrEmpID } = require('.././utils/common');

let _ = require('lodash')




const countAnnualLeave = async (empID, startYear, endYear, yearCal) => {
    const date = `${yearCal - 1}0505`
    // const addYear = parseInt(dayjs(date).format("MM")) >= parseInt(startYear) ? 1 : 0
    // const year = dayjs(date).add(addYear, 'year').startOf('month').format("YYYYMMDD");

    const getLeave = await apiFn.getLeaveDay({ empID, startYear, endYear, date: date });
    const countOldLeave = getLeave.sumLeave.find(d => d.type === 'annual')
    return countOldLeave?.amount ?? 0
}

const calLeave = async (empID, year) => {
    if (year === "2023") {
        year = "2024"
    }
    try {

        const userInfo = await customFn.getUserInfo(empID.toUpperCase())
        if (!userInfo.data.status) {
            throw new Error(`invalid employee ID ${empID}`)
        }
        let { emp_id, company, start_date, emp_type, branch } = userInfo.data.employee
        if (branch === "AF" || branch === "APC") {
            if (emp_type === "Contract") {
                emp_type = "Sub-Contract"
            }
        }
        // console.log('', `${process.env.ESS_URL}/annualleaves?emp_id=${empNoCompany}&company=${company}`)
        let remainAnnualLeave = {
            quota: 0, use: 0, remain: 0
        }

        const settingLeave = await apiFn.getOneSetting(branch, "leave_flow")
        if (!settingLeave) {

            throw new Error("no setting leave company")
        }

        const parseSetting = JSON.parse(JSON.stringify(settingLeave))
        let { startYear, endYear, expireMonth, maxRemain } = parseSetting





        const startDate = dayjs(start_date, 'YYYY-MM-DD')

        const difNextYear = dayjs(year, "YYYY").diff(startDate, 'year')
        let usePassProbation
        let fullyYearQuota = {}
        let nextYearLeave = _.orderBy(parseSetting.condition, ['workYear'], ['desc'])?.find(d => difNextYear >= d.workYear)


        if (emp_type.toUpperCase().includes("SUB") && parseSetting.sub_setting) {
            const { department, company, branch } = userInfo.data.employee
            const subCompany = _.last(department.split("-"))

            const subTypeSetting = parseSetting.sub_setting.find(d => d.emp_type?.toUpperCase() === emp_type.toUpperCase())
            if (subTypeSetting) {

                const subSetting = subTypeSetting.isNeedCompany ? subTypeSetting.setting.find(d => d.company.toUpperCase() === subCompany?.toUpperCase()) : subTypeSetting.setting[0]
                // console.log('subSetting', subSetting)
                startYear = subSetting.startYear
                endYear = subSetting.endYear
                expireMonth = subSetting.expireMonth
                maxRemain = subSetting.maxRemain
                usePassProbation = subSetting.probation_day !== undefined
                nextYearLeave = _.orderBy(subSetting.condition, ['workYear'], ['desc'])?.find(d => {
                    return difNextYear >= d.workYear
                })
                fullyYearQuota = calQuotaDate(subSetting, "fullyYear", startDate)

            } else {
                console.error(`not  found sub  ${branch} :${emp_type} ${subCompany} setting`)
            }

        } else {


            usePassProbation = parseSetting.probation_day !== undefined
            if (emp_type.toUpperCase().includes("SUB") && parseSetting.sub_condition) {
                nextYearLeave = _.orderBy(parseSetting.sub_condition, ['workYear'], ['desc'])?.find(d => {
                    // console.log(' difNextYear >= d.workYear', difNextYear, d.workYear)
                    return difNextYear >= d.workYear
                })

            }
            if (emp_type.toUpperCase().includes("SUB") && parseSetting.sub_fullyYear) {
                usePassProbation = parseSetting.sub_passProbation

                if (parseSetting.sub_fullyYear.isDate) {
                    fullyYearQuota = calQuotaDate(parseSetting, "sub_fullyYear", startDate)

                } else {

                    fullyYearQuota = parseSetting.sub_fullyYear.condition?.find(d => d.month === parseInt(startDate.format('MM')))
                }
            } else {
                usePassProbation = parseSetting.passProbation
                if (parseSetting.fullyYear.isDate) {
                    fullyYearQuota = calQuotaDate(parseSetting, "fullyYear", startDate)
                } else {
                    fullyYearQuota = parseSetting.fullyYear.condition?.find(d => d.month === parseInt(startDate.format('MM')))
                }
            }
            // console.log('fullyYearQuota', fullyYearQuota)
            // return ""
        }



        const annualLeave = await countAnnualLeave(empID, startYear, endYear, year)

        if (year.toString() === "2024") {

            // if (empID?.toUpperCase()?.includes("AA") || empID?.toUpperCase()?.includes("AA")) {
            if (branch === "AA" || branch === "ASP") {
                if (difNextYear !== 0) {

                    const AA_Site = fs.readFileSync('./resources/AA_ASP_2024_remain.json', 'utf8')
                    const allAAQuota = JSON.parse(AA_Site)
                    const filterQuota = allAAQuota.find(d => d.company === branch && d.empId == emp_id)
                    remainAnnualLeave = {
                        quota: 0, use: 0, remain: filterQuota.quota
                    }
                }
            } else if (branch === "AF" || branch === "APC") {
                if (difNextYear !== 0) {

                    const AF_Site = fs.readFileSync('./resources/AF_APC_2024_remain.json', 'utf8')
                    const allAAQuota = JSON.parse(AF_Site)
                    const filterQuota = allAAQuota.find(d => d.company === branch && d.empId == emp_id)
                    remainAnnualLeave = {
                        quota: 0, use: 0, remain: filterQuota.quota
                    }
                }
            }
            else {
                const config = {
                    method: 'get',
                    url: `${process.env.ESS_URL}/annualleaves?_where[_or][0][company_eq]=${company}&_where[_or][1][company_eq]=${branch}&emp_id=${emp_id}&syear=${2023}`,
                    // url: `${process.env.ESS_URL}/annualleaves?emp_id=${emp_id}&company=${branch}&syear=${2023}`,
                    validateStatus: function (status) {
                        return status < 500; // Resolve only if the status code is less than 500
                    }
                };
                const res = await axios(config)
                if (res.status !== 200) {
                    throw new Error("Annual Leave went wrong")
                }
                if (!res.data[0]) {

                    // remainAnnualLeave = { quota: 0, use: annualLeave, remain: 0 - annualLeave }
                } else {
                    let remain = parseFloat(res.data[0].annual_leave_qty) - annualLeave
                    if (remain < 0) {
                        remain = 0
                    }
                    const _remain = parseSetting.maxRemain === null ? remain : remain > parseSetting.maxRemain ? parseSetting.maxRemain : remain
                    remainAnnualLeave = { quota: parseFloat(res.data[0].annual_leave_qty), use: annualLeave, remain: parseFloat(_remain) }
                }

            }
            const getQuota = await quotaController.getLeaveQuota(empID, dayjs().toDate())
            if (getQuota) {
                remainAnnualLeave = getQuota?.s2024?.inEss ?? remainAnnualLeave
                if (getQuota?.s2024?.inEss && remainAnnualLeave.quota === 0) {
                    remainAnnualLeave = getQuota?.s2024?.inEss ?? remainAnnualLeave

                }
            }
        } else {
            //TODO: GET leave from work flow
        }




        const formatExpireMonth = expireMonth ? String(expireMonth).padStart(2, '0') : null
        const s_year = `s${year}`
        delete parseSetting._id
        delete parseSetting.flow
        const newQuotaLeave = {
            userInfo: userInfo.data.employee,
            settingLeave: { startYear, endYear, formatExpireMonth, maxRemain },
            emp_type: emp_type,
            empID: empID,
            usePassProbation: usePassProbation,
            startDate: start_date,
        }
        // throw "TEST"
        newQuotaLeave[s_year] = {
            yearWork: difNextYear,
            old: remainAnnualLeave,
            new: {
                quota: nextYearLeave ? nextYearLeave?.annual_leave_qty : 0, use: 0, remain: nextYearLeave ? nextYearLeave?.annual_leave_qty : 0,
            },
            fullyYear: difNextYear === 0 ? fullyYearQuota?.annual_leave_qty ?? 0 : 0,
            expireMonth: formatExpireMonth,
            expireDate: formatExpireMonth ?  dayjs(`${year}${formatExpireMonth}01`, "YYYYMMDD").endOf('month').endOf('date').toDate() : null
        }
        if (parseSetting.specialUser) {
            const getSpecialQuota = parseSetting.specialUser.find(d => {
                return d.empID === empID
            })
            if (getSpecialQuota) {
                newQuotaLeave[s_year]["fullyYear"] = difNextYear === 0 ? getSpecialQuota.quota ?? 0 : 0,
                    newQuotaLeave[s_year]['new']["remain"] = difNextYear > 0 ? getSpecialQuota.quota : 0
                newQuotaLeave[s_year]['new']["quota"] = difNextYear > 0 ? getSpecialQuota.quota : 0

                newQuotaLeave.isSpecialUser = true
                newQuotaLeave[s_year]["expireMonth"] = getSpecialQuota.expiresMonth ? getSpecialQuota.expiresMonth : newQuotaLeave[s_year]["expireMonth"]
                if (getSpecialQuota.expireDate) {
                    newQuotaLeave[s_year]["expireDate"] = dayjs(`${year}${getSpecialQuota.expireDate}`, "YYYYMMDD").endOf('date').toDate()
                }
            }
        }

        if (s_year === "s2024" && newQuotaLeave[s_year]["inEss"] === undefined) {
            newQuotaLeave[s_year]["inEss"] = remainAnnualLeave

        }

        // console.log('newQuotaLeave', newQuotaLeave)
        // return "test"
        await quotaController.updateLeaveQuota(newQuotaLeave)
        // console.log('done', empID)
        return { status: true }
    } catch (error) {
        console.error(error.message);
        return { status: false }
    }
}



const calQuotaDate = (parseSetting, type, startDate) => {
    const res = _.orderBy(parseSetting[type].condition, ["annual_leave_qty"], ["desc"]).find(d => {
        let currentYear = dayjs()
        const lastYear = dayjs().subtract(0, 'year').format('YYYY')
        const startMonth = dayjs(`${currentYear.format("YYYY")}${d.startDate}`, `YYYYMMDD`).format("MM")
        const endMonth = dayjs(`${currentYear.format("YYYY")}${d.endDate}`, `YYYYMMDD`).format("MM")

        // TODO:  < startYear  to subYear 

        let currentStartYear = dayjs()
        let currentEndYear = dayjs()
        if (startMonth > parseSetting.endYear) {
            currentStartYear = currentStartYear.add(-1, "year")
        }
        if (endMonth > parseSetting.endYear) {
            currentEndYear = currentEndYear.add(-1, "year")
        }
        if (startDate.format("MM") > parseSetting.endYear) {
            currentYear = currentYear.add(-1, "year")
        }



        currentYear = currentYear.format("YYYY")
        currentStartYear = currentStartYear.format("YYYY")
        currentEndYear = currentEndYear.format("YYYY")
        const parseStartWork = parseInt(`${currentYear}${startDate.format('MMDD')}`)
        const parseSettingStartDate = parseInt(`${currentStartYear}${d.startDate}`)
        const parseSettingEndDate = parseInt(`${currentEndYear}${d.endDate}`)
        // console.log('startDate', startDate.format("YYYYMMDD"))
        // console.log(parseStartWork, ">=", parseSettingStartDate, "&&", parseStartWork, "<=", parseSettingEndDate, d.annual_leave_qty)
        // return false
        // console.log(parseStartWork >= parseSettingStartDate, parseStartWork <= parseSettingEndDate)
        return parseStartWork >= parseSettingStartDate && parseStartWork <= parseSettingEndDate
    })

    return res
}

const checkYear = async (data) => {
    let { empID, branch, date = undefined } = data
    let now = date ? dayjs(date) : dayjs()
    if (branch === undefined) {

        const userInfo = await customFn.getUserInfo(empID.toUpperCase())
        if (userInfo.data.status === false) {
            throw new Error("Invalid Emp ID")
        }
        const { employee } = userInfo.data
        branch = employee.branch
    }
    const settingLeave = await EleaveFn.getOneSetting(branch, "leave_flow")
    const parseSetting = JSON.parse(JSON.stringify(settingLeave))
    if (parseInt(now.format("MM")) > parseInt(parseSetting.endYear)) {
        now = dayjs(now).add(1, 'year')
    }

    return now.format("YYYY")
}

const common = {
    calLeave, checkYear

}



module.exports = common