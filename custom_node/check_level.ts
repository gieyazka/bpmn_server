var axios = require('axios')

const checkBoolLevel = async ({ condition, empid, level, }: {
    condition: string, empid: string, level: string, company: string, department: string, section: string
}) => {

    const checMyLevel = await axios.post(`${process.env.Strapi_URL}/api/hierachies/checkConditionLevel`, {
        condition, empid, level
    })
    return checMyLevel
}
const getEmpPosition = async ({ company, department, section, level }: {
    level: string, company: string, department: string, section: string
}) => {
  
    const getEmpByLevel = await axios.post(`${process.env.Strapi_URL}/api/orgs/searchOrg`, {
        company,
        department,
        section,
        level
    }).catch(err => console.log(err)
    )

    return getEmpByLevel
}
const getHead = async ({ empid }: {
    empid: string
}) => {
    const getEmpByLevel = await axios.post(`${process.env.Strapi_URL}/api/orgs/getHead`, {
        empid
    }).catch(err => console.log(err)
    )

    return getEmpByLevel
}




module.exports = { checkBoolLevel, getEmpPosition, getHead, }