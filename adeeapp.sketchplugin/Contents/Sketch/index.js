/* Copyright (C) AdeeApp.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Samine Hadadi <samine.hadadi@gmail.com>,  2020
 */ 

const UI = require("./ui");
const Async = require("sketch/async");
const dee = require("./dee");
let fiber;

function onRun(context) {
    if (!fiber) {
        fiber = Async.createFiber();
        fiber.onCleanup(() => {
            UI.cleanup();
        });
    }

    UI.loadAndShow(context.scriptURL, dee.onChangeAndApply, dee.onLoad);
};