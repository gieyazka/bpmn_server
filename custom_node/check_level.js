"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmpPosition = exports.checkBoolLevel = void 0;
const axios = require('axios');
const checkBoolLevel = ({ condition, empid, level, }) => __awaiter(void 0, void 0, void 0, function* () {
    const checMyLevel = yield axios.post(`${process.env.Strapi_URL}/api/hierachies/checkMyLevel`, {
        condition, empid, level
    });
    return checMyLevel;
});
exports.checkBoolLevel = checkBoolLevel;
const getEmpPosition = ({ company, department, section, level }) => __awaiter(void 0, void 0, void 0, function* () {
    const getEmpByLevel = yield axios.post(`${process.env.Strapi_URL}/api/orgs/searchOrg`, {
        company,
        department,
        section,
        level
    }).catch(err => console.log(err));
    return getEmpByLevel;
});
exports.getEmpPosition = getEmpPosition;
//# sourceMappingURL=check_level.js.map