var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var axios = require('axios');
const checkBoolLevel = ({ condition, empid, level, }) => __awaiter(this, void 0, void 0, function* () {
    const checMyLevel = yield axios.post(`${process.env.Strapi_URL}/api/hierachies/checkConditionLevel`, {
        condition, empid, level
    });
    return checMyLevel;
});
const getEmpPosition = ({ company, department, section, level }) => __awaiter(this, void 0, void 0, function* () {
    const getEmpByLevel = yield axios.post(`${process.env.Strapi_URL}/api/orgs/searchOrg`, {
        company,
        department,
        section,
        level
    }).catch(err => console.log(err));
    return getEmpByLevel;
});
const getHead = ({ empid }) => __awaiter(this, void 0, void 0, function* () {
    const getEmpByLevel = yield axios.post(`${process.env.Strapi_URL}/api/orgs/getHead`, {
        empid
    }).catch(err => console.log(err));
    return getEmpByLevel;
});
const findHead = ({ company, department, section, level }) => __awaiter(this, void 0, void 0, function* () {
    const getEmpByLevel = yield axios.post(`${process.env.Strapi_URL}/api/orgs/findHead`, {
        company, department, section, level
    }).catch(err => console.log(err));
    return getEmpByLevel;
});
module.exports = { checkBoolLevel, getEmpPosition, getHead, findHead };
//# sourceMappingURL=check_level.js.map