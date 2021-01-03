/* Copyright (C) AdeeApp.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Samine Hadadi <samine.hadadi@gmail.com>,  2020
 */ 


const MochaJSDelegate = require("./MochaJSDelegate");

let _window;
let _webView;


function createWebView(pageURL, onChangeAndApply, onLoadFinish) {
    const webView = WKWebView.alloc().init();

    //	Create delegate

    const delegate = new MochaJSDelegate({
        "webView:didFinishNavigation:": (_, navigation) => {
            onLoadFinish(webView);
        },
        "userContentController:didReceiveScriptMessage:": (_, wkMessage) => {

            try {
                const message = JSON.parse(wkMessage.body());
                if (message.close) {
                    _window.close();
                } 
                else {
                    onChangeAndApply(message, _webView);
                }
            } catch (error) {
                console.error(error);
            }

        }
    }).getClassInstance();

    //	Set load complete handler

    webView.navigationDelegate = delegate;
    //	Set handler for messages from script

    const userContentController = webView.configuration().userContentController();

    userContentController.addScriptMessageHandler_name(delegate, "sketchPlugin");

    //	Load page into web view

    webView.loadFileURL_allowingReadAccessToURL(pageURL, pageURL.URLByDeletingLastPathComponent());

    return webView;
};

function createWindow() {
    const window = NSPanel.alloc().initWithContentRect_styleMask_backing_defer(
        NSMakeRect(0, 0, 550, 360),
        NSWindowStyleMaskClosable | NSWindowStyleMaskTitled | NSWindowStyleMaskResizable,
        NSBackingStoreBuffered,
        false
    );

    window.becomesKeyOnlyIfNeeded = true;
    window.floatingPanel = true;

    //window.frameAutosaveName = "dee-panel-frame";

    window.minSize = window.frame().size;
    window.maxSize = window.frame().size;

    window.releasedWhenClosed = false;

    window.standardWindowButton(NSWindowZoomButton).hidden = true;
    window.standardWindowButton(NSWindowMiniaturizeButton).hidden = true;
    window.standardWindowButton(NSWindowCloseButton).hidden = true;

    window.titlebarAppearsTransparent = true;

    window.backgroundColor = NSColor.colorWithRed_green_blue_alpha(0.95, 0.95, 0.95, 1.0);

    return window;
};

function showWindow(window) {
    window.makeKeyAndOrderFront(nil);
};


function loadAndShow(baseURL, onChangeAndApply, onLoad) {
    if (_window && _webView) {
        if (onLoad(_webView)) {
            showWindow(_window);
        }

        return;
    }

    const pageURL = baseURL
        .URLByDeletingLastPathComponent()
        .URLByAppendingPathComponent("../Resources/web-ui/index.html");

    const window = createWindow();
    _webView = createWebView(pageURL, onChangeAndApply, webView => {
        if (onLoad(webView)) {
            showWindow(window);
        }
    });

    window.contentView = _webView;

    _window = window;
};

function cleanup() {
    if (_window) {
        _window.orderOut(nil);
        _window = null;
    }
};

//	Export

module.exports = {
    loadAndShow,
    cleanup
};