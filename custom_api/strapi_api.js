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
        // bcc,
    };
    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.Strapi_URL}/api/flows/sendEmailApprove`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: data
    };
    const res = yield axios(config)
        .then(function (response) {
        console.log(JSON.stringify(response.data));
    })
        .catch(function (error) {
        console.log(error);
    });
    return res;
});
module.exports = { sendStrapi_email };
//# sourceMappingURL=strapi_api.js.map