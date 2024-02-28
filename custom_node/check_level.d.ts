declare var axios: any;
declare const checkBoolLevel: ({ condition, empid, level, company, department }: {
    condition: string;
    empid: string;
    level: string;
    company: string;
    department: string;
    section: string;
}) => Promise<any>;
declare const getEmpPosition: ({ company, department, section, sub_section, level }: {
    level: string;
    company: string;
    department: string;
    section: string;
    sub_section: string;
}) => Promise<any>;
declare const getHead: ({ empid, company, department }: {
    empid: string;
    company: string;
    department: string;
}) => Promise<any>;
declare const findHead: ({ company, department, section, level }: {
    level: string;
    company: string;
    department: string;
    section: string;
}) => Promise<any>;
