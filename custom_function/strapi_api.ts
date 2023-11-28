var axios = require('axios');


const sendStrapi_email = async (props) => {

    // const data = {
    //     empid,
    //     reason,
    //     flowName,
    //     linkArrove,
    //     linkReject,
    //     bcc,
    // };
    
    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.Strapi_URL}/api/flows/sendEmailApprove`,
        headers: {
            'Content-Type': 'application/json'
        },
        data: props,
        validateStatus: function (status) {
            return status < 500; // Resolve only if the status code is less than 500
        }
    };

    const res = await axios(config)
    return res
}


const getMyHierachies = async (empId) => {
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
    const res = await axios(config)
    if (res.status === 200) {

        const data = {
            section: res.data.data[0].attributes.section.data.attributes,
            level: res.data.data[0].attributes.level.data.attributes,
            employee: res.data.data[0].attributes.employee.data.attributes

        }
        return data
    }
    return res
}

const getEmployee = async (empId) => {
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
    const res = await axios(config)

    return res
}
const getUserInfo = async (empId) => {
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
    const res = await axios(config)

    return res
}

const getLDAPData = async (ldap_username) => {

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


    const res = await axios(config)
    return res;
};
const getLDAPDataByEmpID = async (empid) => {

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


    const res = await axios(config)
    return res;
};
const getEmpByEmpID = async (empid) => {

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: `${process.env.Strapi_URL}/api/users/getUserByEmpId`,
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


    const res = await axios(config)
    return res;
};


module.exports = { sendStrapi_email, getMyHierachies, getEmployee, getUserInfo, getLDAPData, getLDAPDataByEmpID ,getEmpByEmpID};