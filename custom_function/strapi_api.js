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
const sendStrapi_email = ({ empid, reason, flowName, linkArrove, linkReject, bcc, }) => __awaiter(this, void 0, void 0, function* () {
    const data = {
        empid,
        reason,
        flowName,
        linkArrove,
        linkReject,
        bcc,
    };
    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.Strapi_URL}/api/flows/sendEmailApprove`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: data,
        validateStatus: function (status) {
            return status < 500; // Resolve only if the status code is less than 500
        }
    };
    const res = yield axios(config);
    return res;
});
const getMyHierachies = (empId) => __awaiter(this, void 0, void 0, function* () {
    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${process.env.Strapi_URL}/api/hierachies?populate=*&filters[employee][empid][$eq]=${empId}`,
        headers: {
            'Content-Type': 'application/json'
        }, validateStatus: function (status) {
            return status < 500; // Resolve only if the status code is less than 500
        }
    };
    const res = yield axios(config);
    if (res.status === 200) {
        const data = {
            section: res.data.data[0].attributes.section.data.attributes,
            level: res.data.data[0].attributes.level.data.attributes,
            employee: res.data.data[0].attributes.employee.data.attributes
        };
        return data;
    }
    return res;
});
const getEmployee = (empId) => __awaiter(this, void 0, void 0, function* () {
    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${process.env.Strapi_URL}/api/employees?filters[empid][$eq]=${empId}`,
        headers: {
            'Content-Type': 'application/json'
        }, validateStatus: function (status) {
            return status < 500; // Resolve only if the status code is less than 500
        }
    };
    const res = yield axios(config);
    return res;
});
const getUserInfo = (empId) => __awaiter(this, void 0, void 0, function* () {
    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${process.env.Strapi_URL}/api/users/userInfo/${empId}`,
        headers: {
            'Content-Type': 'application/json'
        }, validateStatus: function (status) {
            return status < 500; // Resolve only if the status code is less than 500
        }
    };
    const res = yield axios(config);
    return res;
});
const getLDAPData = (ldap_username) => __awaiter(this, void 0, void 0, function* () {
    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.Strapi_URL}/api/users/getLdapByUsername`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: {
            ldap_username: ldap_username,
        },
        validateStatus: function (status) {
            return status < 500; // Resolve only if the status code is less than 500
        }
    };
    const res = yield axios(config);
    return res;
});
const getLDAPDataByEmpID = (empid) => __awaiter(this, void 0, void 0, function* () {
    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.Strapi_URL}/api/users/getLdapByempID`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: {
            empid
        },
        validateStatus: function (status) {
            return status < 500; // Resolve only if the status code is less than 500
        }
    };
    const res = yield axios(config);
    return res;
});
module.exports = { sendStrapi_email, getMyHierachies, getEmployee, getUserInfo, getLDAPData, getLDAPDataByEmpID };
//# sourceMappingURL=strapi_api.js.map