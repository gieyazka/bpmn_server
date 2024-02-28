"use strict";
//@ts-nocheck
// let mongoose = require('mongoose');
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const quotaController = __importStar(require("../controller/quota"));
const index_1 = __importDefault(require("./index"));
const api_1 = __importDefault(require("./api"));
const index_2 = __importDefault(require("../custom_function/index"));
const dayjs_1 = __importDefault(require("dayjs"));
const fs_1 = __importDefault(require("fs"));
const isBetween_1 = __importDefault(require("dayjs/plugin/isBetween"));
dayjs_1.default.extend(isBetween_1.default);
var axios = require('axios');
// let { subStrEmpID } = require('.././utils/common');
let _ = require('lodash');
const countAnnualLeave = (empID, startYear, endYear, yearCal) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const date = `${yearCal - 1}0505`;
    // const addYear = parseInt(dayjs(date).format("MM")) >= parseInt(startYear) ? 1 : 0
    // const year = dayjs(date).add(addYear, 'year').startOf('month').format("YYYYMMDD");
    const getLeave = yield api_1.default.getLeaveDay({ empID, startYear, endYear, date: date });
    const countOldLeave = getLeave.sumLeave.find(d => d.type === 'annual');
    return (_a = countOldLeave === null || countOldLeave === void 0 ? void 0 : countOldLeave.amount) !== null && _a !== void 0 ? _a : 0;
});
const calLeave = (empID, year) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    if (year === "2023") {
        year = "2024";
    }
    try {
        const userInfo = yield index_2.default.getUserInfo(empID.toUpperCase());
        if (!userInfo.data.status) {
            throw new Error(`invalid employee ID ${empID}`);
        }
        let { emp_id, company, start_date, emp_type, branch } = userInfo.data.employee;
        if (branch === "AF" || branch === "APC") {
            if (emp_type === "Contract") {
                emp_type = "Sub-Contract";
            }
        }
        // console.log('', `${process.env.ESS_URL}/annualleaves?emp_id=${empNoCompany}&company=${company}`)
        let remainAnnualLeave = {
            quota: 0, use: 0, remain: 0
        };
        const settingLeave = yield api_1.default.getOneSetting(branch, "leave_flow");
        if (!settingLeave) {
            throw new Error("no setting leave company");
        }
        const parseSetting = JSON.parse(JSON.stringify(settingLeave));
        let { startYear, endYear, expireMonth, maxRemain } = parseSetting;
        const startDate = (0, dayjs_1.default)(start_date, 'YYYY-MM-DD');
        const difNextYear = (0, dayjs_1.default)(year, "YYYY").diff(startDate, 'year');
        let usePassProbation;
        let fullyYearQuota = {};
        let nextYearLeave = (_b = _.orderBy(parseSetting.condition, ['workYear'], ['desc'])) === null || _b === void 0 ? void 0 : _b.find(d => difNextYear >= d.workYear);
        if (emp_type.toUpperCase().includes("SUB") && parseSetting.sub_setting) {
            const { department, company, branch } = userInfo.data.employee;
            const subCompany = _.last(department.split("-"));
            const subTypeSetting = parseSetting.sub_setting.find(d => { var _a; return ((_a = d.emp_type) === null || _a === void 0 ? void 0 : _a.toUpperCase()) === emp_type.toUpperCase(); });
            if (subTypeSetting) {
                const subSetting = subTypeSetting.isNeedCompany ? subTypeSetting.setting.find(d => d.company.toUpperCase() === (subCompany === null || subCompany === void 0 ? void 0 : subCompany.toUpperCase())) : subTypeSetting.setting[0];
                // console.log('subSetting', subSetting)
                startYear = subSetting.startYear;
                endYear = subSetting.endYear;
                expireMonth = subSetting.expireMonth;
                maxRemain = subSetting.maxRemain;
                usePassProbation = subSetting.probation_day !== undefined;
                nextYearLeave = (_c = _.orderBy(subSetting.condition, ['workYear'], ['desc'])) === null || _c === void 0 ? void 0 : _c.find(d => {
                    return difNextYear >= d.workYear;
                });
                fullyYearQuota = calQuotaDate(subSetting, "fullyYear", startDate);
            }
            else {
                console.error(`not  found sub  ${branch} :${emp_type} ${subCompany} setting`);
            }
        }
        else {
            usePassProbation = parseSetting.probation_day !== undefined;
            if (emp_type.toUpperCase().includes("SUB") && parseSetting.sub_condition) {
                nextYearLeave = (_d = _.orderBy(parseSetting.sub_condition, ['workYear'], ['desc'])) === null || _d === void 0 ? void 0 : _d.find(d => {
                    // console.log(' difNextYear >= d.workYear', difNextYear, d.workYear)
                    return difNextYear >= d.workYear;
                });
            }
            if (emp_type.toUpperCase().includes("SUB") && parseSetting.sub_fullyYear) {
                usePassProbation = parseSetting.sub_passProbation;
                if (parseSetting.sub_fullyYear.isDate) {
                    fullyYearQuota = calQuotaDate(parseSetting, "sub_fullyYear", startDate);
                }
                else {
                    fullyYearQuota = (_e = parseSetting.sub_fullyYear.condition) === null || _e === void 0 ? void 0 : _e.find(d => d.month === parseInt(startDate.format('MM')));
                }
            }
            else {
                usePassProbation = parseSetting.passProbation;
                if (parseSetting.fullyYear.isDate) {
                    fullyYearQuota = calQuotaDate(parseSetting, "fullyYear", startDate);
                }
                else {
                    fullyYearQuota = (_f = parseSetting.fullyYear.condition) === null || _f === void 0 ? void 0 : _f.find(d => d.month === parseInt(startDate.format('MM')));
                }
            }
            // console.log('fullyYearQuota', fullyYearQuota)
            // return ""
        }
        const annualLeave = yield countAnnualLeave(empID, startYear, endYear, year);
        if (year.toString() === "2024") {
            // if (empID?.toUpperCase()?.includes("AA") || empID?.toUpperCase()?.includes("AA")) {
            if (branch === "AA" || branch === "ASP") {
                if (difNextYear !== 0) {
                    const AA_Site = fs_1.default.readFileSync('./resources/AA_ASP_2024_remain.json', 'utf8');
                    const allAAQuota = JSON.parse(AA_Site);
                    const filterQuota = allAAQuota.find(d => d.company === branch && d.empId == emp_id);
                    remainAnnualLeave = {
                        quota: 0, use: 0, remain: filterQuota.quota
                    };
                }
            }
            else if (branch === "AF" || branch === "APC") {
                if (difNextYear !== 0) {
                    const AF_Site = fs_1.default.readFileSync('./resources/AF_APC_2024_remain.json', 'utf8');
                    const allAAQuota = JSON.parse(AF_Site);
                    const filterQuota = allAAQuota.find(d => d.company === branch && d.empId == emp_id);
                    remainAnnualLeave = {
                        quota: 0, use: 0, remain: filterQuota.quota
                    };
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
                const res = yield axios(config);
                if (res.status !== 200) {
                    throw new Error("Annual Leave went wrong");
                }
                if (!res.data[0]) {
                    // remainAnnualLeave = { quota: 0, use: annualLeave, remain: 0 - annualLeave }
                }
                else {
                    let remain = parseFloat(res.data[0].annual_leave_qty) - annualLeave;
                    if (remain < 0) {
                        remain = 0;
                    }
                    const _remain = parseSetting.maxRemain === null ? remain : remain > parseSetting.maxRemain ? parseSetting.maxRemain : remain;
                    remainAnnualLeave = { quota: parseFloat(res.data[0].annual_leave_qty), use: annualLeave, remain: parseFloat(_remain) };
                }
            }
            const getQuota = yield quotaController.getLeaveQuota(empID, (0, dayjs_1.default)().toDate());
            if (getQuota) {
                remainAnnualLeave = (_h = (_g = getQuota === null || getQuota === void 0 ? void 0 : getQuota.s2024) === null || _g === void 0 ? void 0 : _g.inEss) !== null && _h !== void 0 ? _h : remainAnnualLeave;
                if (((_j = getQuota === null || getQuota === void 0 ? void 0 : getQuota.s2024) === null || _j === void 0 ? void 0 : _j.inEss) && remainAnnualLeave.quota === 0) {
                    remainAnnualLeave = (_l = (_k = getQuota === null || getQuota === void 0 ? void 0 : getQuota.s2024) === null || _k === void 0 ? void 0 : _k.inEss) !== null && _l !== void 0 ? _l : remainAnnualLeave;
                }
            }
        }
        else {
            //TODO: GET leave from work flow
        }
        const formatExpireMonth = expireMonth ? String(expireMonth).padStart(2, '0') : null;
        const s_year = `s${year}`;
        delete parseSetting._id;
        delete parseSetting.flow;
        const newQuotaLeave = {
            userInfo: userInfo.data.employee,
            settingLeave: { startYear, endYear, formatExpireMonth, maxRemain },
            emp_type: emp_type,
            empID: empID,
            usePassProbation: usePassProbation,
            startDate: start_date,
        };
        // throw "TEST"
        newQuotaLeave[s_year] = {
            yearWork: difNextYear,
            old: remainAnnualLeave,
            new: {
                quota: nextYearLeave ? nextYearLeave === null || nextYearLeave === void 0 ? void 0 : nextYearLeave.annual_leave_qty : 0, use: 0, remain: nextYearLeave ? nextYearLeave === null || nextYearLeave === void 0 ? void 0 : nextYearLeave.annual_leave_qty : 0,
            },
            fullyYear: difNextYear === 0 ? (_m = fullyYearQuota === null || fullyYearQuota === void 0 ? void 0 : fullyYearQuota.annual_leave_qty) !== null && _m !== void 0 ? _m : 0 : 0,
            expireMonth: formatExpireMonth,
            expireDate: formatExpireMonth ? (0, dayjs_1.default)(`${year}${formatExpireMonth}01`, "YYYYMMDD").endOf('month').endOf('date').toDate() : null
        };
        if (parseSetting.specialUser) {
            const getSpecialQuota = parseSetting.specialUser.find(d => {
                return d.empID === empID;
            });
            if (getSpecialQuota) {
                newQuotaLeave[s_year]["fullyYear"] = difNextYear === 0 ? (_o = getSpecialQuota.quota) !== null && _o !== void 0 ? _o : 0 : 0,
                    newQuotaLeave[s_year]['new']["remain"] = difNextYear > 0 ? getSpecialQuota.quota : 0;
                newQuotaLeave[s_year]['new']["quota"] = difNextYear > 0 ? getSpecialQuota.quota : 0;
                newQuotaLeave.isSpecialUser = true;
                newQuotaLeave[s_year]["expireMonth"] = getSpecialQuota.expiresMonth ? getSpecialQuota.expiresMonth : newQuotaLeave[s_year]["expireMonth"];
                if (getSpecialQuota.expireDate) {
                    newQuotaLeave[s_year]["expireDate"] = (0, dayjs_1.default)(`${year}${getSpecialQuota.expireDate}`, "YYYYMMDD").endOf('date').toDate();
                }
            }
        }
        if (s_year === "s2024" && newQuotaLeave[s_year]["inEss"] === undefined) {
            newQuotaLeave[s_year]["inEss"] = remainAnnualLeave;
        }
        // console.log('newQuotaLeave', newQuotaLeave)
        // return "test"
        yield quotaController.updateLeaveQuota(newQuotaLeave);
        // console.log('done', empID)
        return { status: true };
    }
    catch (error) {
        console.error(error.message);
        return { status: false };
    }
});
const calQuotaDate = (parseSetting, type, startDate) => {
    const res = _.orderBy(parseSetting[type].condition, ["annual_leave_qty"], ["desc"]).find(d => {
        let currentYear = (0, dayjs_1.default)();
        const lastYear = (0, dayjs_1.default)().subtract(0, 'year').format('YYYY');
        const startMonth = (0, dayjs_1.default)(`${currentYear.format("YYYY")}${d.startDate}`, `YYYYMMDD`).format("MM");
        const endMonth = (0, dayjs_1.default)(`${currentYear.format("YYYY")}${d.endDate}`, `YYYYMMDD`).format("MM");
        // TODO:  < startYear  to subYear 
        let currentStartYear = (0, dayjs_1.default)();
        let currentEndYear = (0, dayjs_1.default)();
        if (startMonth > parseSetting.endYear) {
            currentStartYear = currentStartYear.add(-1, "year");
        }
        if (endMonth > parseSetting.endYear) {
            currentEndYear = currentEndYear.add(-1, "year");
        }
        if (startDate.format("MM") > parseSetting.endYear) {
            currentYear = currentYear.add(-1, "year");
        }
        currentYear = currentYear.format("YYYY");
        currentStartYear = currentStartYear.format("YYYY");
        currentEndYear = currentEndYear.format("YYYY");
        const parseStartWork = parseInt(`${currentYear}${startDate.format('MMDD')}`);
        const parseSettingStartDate = parseInt(`${currentStartYear}${d.startDate}`);
        const parseSettingEndDate = parseInt(`${currentEndYear}${d.endDate}`);
        // console.log('startDate', startDate.format("YYYYMMDD"))
        // console.log(parseStartWork, ">=", parseSettingStartDate, "&&", parseStartWork, "<=", parseSettingEndDate, d.annual_leave_qty)
        // return false
        // console.log(parseStartWork >= parseSettingStartDate, parseStartWork <= parseSettingEndDate)
        return parseStartWork >= parseSettingStartDate && parseStartWork <= parseSettingEndDate;
    });
    return res;
};
const checkYear = (data) => __awaiter(void 0, void 0, void 0, function* () {
    let { empID, branch, date = undefined } = data;
    let now = date ? (0, dayjs_1.default)(date) : (0, dayjs_1.default)();
    if (branch === undefined) {
        const userInfo = yield index_2.default.getUserInfo(empID.toUpperCase());
        if (userInfo.data.status === false) {
            throw new Error("Invalid Emp ID");
        }
        const { employee } = userInfo.data;
        branch = employee.branch;
    }
    const settingLeave = yield index_1.default.getOneSetting(branch, "leave_flow");
    const parseSetting = JSON.parse(JSON.stringify(settingLeave));
    if (parseInt(now.format("MM")) > parseInt(parseSetting.endYear)) {
        now = (0, dayjs_1.default)(now).add(1, 'year');
    }
    return now.format("YYYY");
});
const common = {
    calLeave, checkYear
};
module.exports = common;
//# sourceMappingURL=common.js.map