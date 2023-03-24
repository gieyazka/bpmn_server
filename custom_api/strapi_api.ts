var axios = require('axios');


const sendStrapi_email = async ({
    empid,
    reason,
    flowName,
    linkArrove,
    linkReject,
    bcc,
}) => {

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

    const res = await axios(config)
        .then(function (response) {
            console.log(JSON.stringify(response.data));
        })
        .catch(function (error) {
            console.log(error);
        });
    return res
}







module.exports = { sendStrapi_email };