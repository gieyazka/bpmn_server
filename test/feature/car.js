const { BPMNServer , DefaultAppDelegate , Logger } = require("../../");
const { configuration } = require('../testConfiguration');

console.log('-------- car.js -----------');

const logger = new Logger({ toConsole: false });

const server = new BPMNServer(configuration, logger);
var caseId = Math.floor(Math.random() * 10000);

let name = 'Buy Used Car';
let process;
let response;
let instanceId;


Feature('Buy Used Car- clean and repair', () => {
        Scenario('Simple', () => {
            Given('Start Buy Used Car Process',async () => {
                response = await server.engine.start(name, {caseId: caseId});
                instanceId = response.id;
//                console.log('**instanceId', response.id, instanceId);
//                console.log(' after start ', response.instance.caseId);
            });
            Then('check for output', () => {
                expect(response).to.have.property('execution');
                expect(response.instance.data.caseId).equals(caseId);
                expect(getItem('task_Buy').status).equals('wait');
             });

            When('a process defintion is executed', async () => {

                const data = { needsCleaning: "Yes", needsRepairs: "Yes" };
                const query ={
                    id: instanceId ,
                    "items.elementId": 'task_Buy'
                };
//                console.log(query);
                response= await server.engine.invoke(query ,data );
            });

            When('engine get', async () => {
                const query = {id: instanceId };

                response = await server.engine.get(query);

                expect(response.instance.id).equals(instanceId);

            });


            Then('check for output to have engine', () => {
                expect(response).to.have.property('execution');
                expect(getItem('task_Buy').status).equals('end');
            });

            and('Clean it', async () => {

                    const query = {
                        "data.caseId": caseId ,
                    "items.elementId": 'task_clean'
                };
//                console.log(query);
                    await server.engine.invoke(query, {});
            });
      
            and('Repair it', async () => {
                    const query = { id: instanceId ,"items.elementId": 'task_repair'};
                    response = await server.engine.invoke(query, {});
            }); 
            and('Drive it 1', async () => {
                const query = {
                    id: instanceId ,
                    "items.elementId": 'task_Drive'};
                response=await server.engine.invoke(query, {});
            });

            and('Case Complete', async () => {

//                console.log(response.instance.status);
//                console.log(response.execution.status);
              expect(response.execution.status).equals('end');
                expect(getItem('task_Drive').status).equals('end');

            });

            let fileName = __dirname + '/../logs/car.log';

            and('write log file to ' + fileName, async () => {
                logger.save(fileName);
//                console.log('filename:', __filename);
            });

        });

    });

function getItem(id)
{
    return response.instance.items.filter(item => { return item.elementId == id; })[0];
}