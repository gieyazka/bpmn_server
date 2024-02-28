import express = require('express');
const router = express.Router();
//import { ExecuteDecisionTable, ExecuteCondition, ExecuteExpression } from 'dmn-engine';
var mongoose = require('mongoose');
import FS = require('fs');

import { BPMNServer, Behaviour_names, CacheManager, Logger, dateDiff } from '..';
import _, { isArray, } from 'lodash';
import { configuration as config, configuration } from '../configuration';
import { xml2js, xml2json } from "xml-js"

import { Common } from './common';
import CustomNode from '../custom_node/index'
import ELeaveFn from '../Eleave_function/index'
import customFn from '../custom_function/index'

console.log("Leave api.ts");

const awaitAppDelegateFactory = (middleware) => {
    return async (req, res, next) => {
        try {
            await middleware(req, res, next)
        } catch (err) {
            next(err)
        }
    }
}

export class API extends Common {
    get bpmnServer() { return this.webApp.bpmnServer; }


    config() {

        var router = express.Router();
        // var bpmnServer = this.bpmnServer;


        router.post('/editApprover', awaitAppDelegateFactory(async (request, response) => {

            try {
                let data = request.body;
                const mongoData = await customFn.editApprover(data);
                response.json(mongoData);
            }
            catch (exc) {
                response.json({ error: exc.toString() });
            }
        }));


        return router;
    }
}

export default router;
