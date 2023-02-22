const axios = require('axios')

const checkBoolLevel = async ({ condition, empid, level, }: {
    condition: string, empid: string, level: string, company: string, department: string, section: string
}) => {
    const checMyLevel = await axios.post(`${process.env.Strapi_URL}/api/hierachies/checkMyLevel`, {
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

export { checkBoolLevel, getEmpPosition }