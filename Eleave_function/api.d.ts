declare const mongoose: any;
declare const dayjs: any;
declare var axios: any;
declare const subStrEmpID: any;
declare const CustomFn: any;
declare const _: any;
declare const common: any;
declare const UsersSchema: any;
declare const HrLeaveSchema: any;
declare const selectKey: {
    tokens: number;
    loops: number;
    involvements: number;
    sources: number;
    logs: number;
    authorizations: number;
};
declare const checkMongoState: () => any;
declare const getHRLeaveSetting: () => Promise<any>;
declare const addCompanyHrLeaveSetting: (data: any) => Promise<any>;
declare const updateSettingHrLeave: (props: any) => Promise<any>;
declare const setNewItem: (task_id: any, items: any) => Promise<any>;
declare const getHRLeave: (company: any, emp_type: any) => Promise<any>;
declare const getOneSetting: (company: any, flow: any) => Promise<any>;
declare const getCurrentApprove: () => Promise<any>;
declare const setDuplicate: (taskID: any) => Promise<any>;
declare const updateLeaveFile: (props: any) => Promise<any>;
declare const getLeave: ({ date }: {
    date: any;
}) => Promise<any>;
declare const getmyTask: ({ email, empid, status, startDate, endDate, flowNames }: {
    email: any;
    empid: any;
    status: any;
    startDate: any;
    endDate: any;
    flowNames: any;
}) => Promise<any>;
declare const getTaskByItemID: (itemID: any) => Promise<any>;
declare const getCurrentApproveTask: (props: any) => Promise<any>;
declare const getAction_logs: (props: any) => Promise<any>;
declare const hrCancel: (props: any) => Promise<any>;
declare const hrSetLeave: (props: any) => Promise<any>;
declare const findOneTask: (taskID: any) => Promise<any>;
declare const clearLogsTask: (taskID: any) => Promise<void>;
declare const getLeaveDay: (data: any) => Promise<{
    leaveData: any;
    sumLeave: any;
    rawLeave: any;
}>;
declare const getLeaveQuota: (data: any) => Promise<{
    year: any;
    annual_leave_qty: number;
}[]>;
declare const calLeaveQuota: (data: any) => Promise<string>;
declare const updateLeaveQuota: (arr: any, year: any) => Promise<void>;
declare const updateStartDate: (arr: any) => Promise<void>;
