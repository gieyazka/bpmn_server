var axios = require('axios')

const checkBoolLevel = async ({ condition, empid, level, company, department }: {
    condition: string, empid: string, level: string, company: string, department: string, section: string
}) => {
    const checkMyLevel = await axios.post(`${process.env.Strapi_URL}/api/hierachies/checkConditionLevel`, {
        condition, empid, control_level: level, company, department
    })
    return checkMyLevel
}
const getEmpPosition = async ({ company, department, section, sub_section, level }: {
    level: string, company: string, department: string, section: string, sub_section: string
}) => {

    const getEmpByLevel = await axios.post(`${process.env.Strapi_URL}/api/orgs/searchOrg`, {
        company,
        department,
        section,
        sub_section,
        control_level: level
    }).catch(err => console.log(err)
    )
    return getEmpByLevel
}
const getHead = async ({ empid, company, department }: {
    empid: string, company: string, department: string,
}) => {
    const getEmpByLevel = await axios.post(`${process.env.Strapi_URL}/api/orgs/getHead`, {
        empid, company, department
    }).catch(err => console.log(err)
    )

    return getEmpByLevel
}
const findHead = async ({ company, department, section, level }: {
    level: string, company: string, department: string, section: string
}) => {
    console.log('find Head', company, department, section, level)
    const getEmpByLevel = await axios.post(`${process.env.Strapi_URL}/api/orgs/findHead`, {
        company, department, section, control_level: level
    }).catch(err => err);


    return getEmpByLevel
}




module.exports = { checkBoolLevel, getEmpPosition, getHead, findHead }