/* Copyright (C) AdeeApp.com - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Samine Hadadi <samine.hadadi@gmail.com>,  2020
 */ 



let sketch = require("sketch");
let UI = require("sketch/ui");


// Send Data from Sketch to webui
function onLoad(webView) {
    webView.evaluateJavaScript_completionHandler(
        `getDataFromSketch('${getAllLayersAndColors()}')`,
        null
    );
    return true;
}

// Get data from webui
function onChangeAndApply(items, webView) {
    let doc = sketch.getSelectedDocument();


    if (items.layerID != null) {
        let selection = doc.selectedLayers;
        let otherSelectedLayer;
        if (selection.length !== 0) {
            selection.forEach((layer) => {
                if (layer.selected && layer.id != items.layerID) {
                    otherSelectedLayer = layer.id;
                }
                layer.selected = false;
            });
            let otherLayer = doc.getLayerWithID(otherSelectedLayer);
            otherLayer.selected = true;
        }
        let layer = doc.getLayerWithID(items.layerID);

        layer.selected = true;
    }

    if (items.error != null) {
        UI.alert("Error", items.error);
    }
    if (items.info != null) {
        UI.alert("Info", items.info);
    }
    if (items.URL != null) {
        NSWorkspace.sharedWorkspace().openURL(NSURL.URLWithString(items.URL));
    }
    if (items.apply != null) {
        items.apply.map(item => {
            if (item.type === "ShapePath" || item.type === "Group" || item.type === "SymbolInstance") {
                doc.getLayerWithID(item.id).style.fills[0].color = item.color;
            } else if (item.type === "Text") {
                doc.getLayerWithID(item.id).style.textColor = item.color;
            }
            else if (item.type === "Artboard"){
                doc.getLayerWithID(item.id).background.color = item.color;
            }
        })
    }
    if (items.exportArtboard != null) {
        let layer = doc.getLayerWithID(items.exportArtboard)
        const options = { formats: "png", output: false };
        const buffer = sketch.export(layer, options);
        webView.evaluateJavaScript_completionHandler(
            `getArtboardImage('${setArtboardImage(buffer)}')`,
            null
        );
    }
    // if (items.makeImage != null) {
    //     const selectedPage = doc.selectedPage;
    //     let newImage = new sketch.Image({
    //         image: { base64: items.makeImage.split(',')[1] },
    //         parent: selectedPage
    //     })
    //     UI.alert("Info", "Item generated");
    // }
    if (items.cbGenerate != null) {
        const selectedPage = doc.selectedPage;
        let filter = items.cbGenerate.filter;
        let filterFunction = getFilterFunction(filter);
        let artboardLayer = doc.getLayerWithID(items.cbGenerate.id);
     

        let duplicate = artboardLayer.duplicate();
        if (duplicate.background.color != null) {
            let rgb = HEXtoRGB(duplicate.background.color);
            let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
            let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
            duplicate.background.color = hex;
        }
        positionArtboardInPage(duplicate, selectedPage);
        duplicate.layers.map((function apply(layer) {
            if (layer.type === "ShapePath" | layer.type === "Shape") {
                if (layer.style.fills[0] != null) {
                    let rgb = HEXtoRGB(layer.style.fills[0].color);
                    let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                    let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                    layer.style.fills[0].color = hex;
                }
                if (layer.style.borders[0] != null) {
                    rgb = HEXtoRGB(layer.style.borders[0].color);
                    result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                    hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                    layer.style.borders[0].color = hex;
                }

                //log(layer.style.fills[0].fillType === "Gradient" ? "#ffffff" : layer.style.fills[0].color)
            } else if (layer.type === "Text") {
                if (layer.style.textColor != null) {
                    let rgb = HEXtoRGB(layer.style.textColor);
                    let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                    let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                    layer.style.textColor = hex;
                }
                if (layer.style.borders[0] != null) {
                    rgb = HEXtoRGB(layer.style.borders[0].color);
                    result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                    hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                    layer.style.borders[0].color = hex;
                }
            } else if (layer.type === "Image") {
                const options = { formats: "svg", output: false };
                const buffer = sketch.export(layer, options);
                log(buffer.toString('base64'))
            }
            else if (layer.type === "SymbolInstance") {
                if (layer.style.fills[0] != null) {
                    let rgb = HEXtoRGB(layer.style.fills[0].color);
                    let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                    let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                    layer.style.fills[0].color = hex;
                }
                // var group = layer.master;
                var group = layer.detach();
                if (group.layers && group.layers.length !== 0) {
                    group.layers.forEach((innerLayer) => {
                        if (innerLayer.type === "SymbolInstance") {
                            apply(innerLayer);
                        }
                        else {
                            if (innerLayer.type === "Group") {
                                if (innerLayer.style.fills[0] != null) {
                                    let rgb = HEXtoRGB(innerLayer.style.fills[0].color);
                                    let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                    let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                    innerLayer.style.fills[0].color = hex;
                                }
                                innerLayer.layers.forEach(innerLayer2  =>{     
                                    if (innerLayer2.type === "Group") { 
                                        apply(innerLayer2);
                                    }
                                    else {
                                        if (innerLayer2.type === "ShapePath" | innerLayer2.type === "Shape") {
                                            if (innerLayer2.style.fills[0] != null) {
                                                let rgb = HEXtoRGB(innerLayer2.style.fills[0].color);
                                                let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                                let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                                innerLayer2.style.fills[0].color = hex;
                                            }

                                            if (innerLayer2.style.borders[0] != null) {
                                                rgb = HEXtoRGB(innerLayer2.style.borders[0].color);
                                                result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                                hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                                innerLayer2.style.borders[0].color = hex;
                                            }
                                        }
                                        else if (innerLayer2.type === "Text") {
                                            if (innerLayer2.style.textColor != null) {
                                                let rgb = HEXtoRGB(innerLayer2.style.textColor);
                                                let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                                let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                                innerLayer2.style.textColor = hex;
                                            }
                                            if (innerLayer2.style.borders[0] != null) {
                                                rgb = HEXtoRGB(innerLayer2.style.borders[0].color);
                                                result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                                hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                                innerLayer2.style.borders[0].color = hex;
                                            }
                                        }
                                        //else if (layer.type === "Image")
                                    }
                                }
                            );
                            }
                            else {
                                if (innerLayer.type === "ShapePath" | innerLayer.type === "Shape") {
                                    if (innerLayer.style.fills[0] != null) {
                                        let rgb = HEXtoRGB(innerLayer.style.fills[0].color);
                                        let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                        let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                        innerLayer.style.fills[0].color = hex;
                                    }

                                    if (innerLayer.style.borders[0] != null) {
                                        rgb = HEXtoRGB(innerLayer.style.borders[0].color);
                                        result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                        hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                        innerLayer.style.borders[0].color = hex;
                                    }
                                }
                                else if (innerLayer.type === "Text") {
                                    if (innerLayer.style.textColor != null) {
                                        let rgb = HEXtoRGB(innerLayer.style.textColor);
                                        let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                        let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                        innerLayer.style.textColor = hex;
                                    }
                                    if (innerLayer.style.borders[0] != null) {
                                        rgb = HEXtoRGB(innerLayer.style.borders[0].color);
                                        result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                        hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                        innerLayer.style.borders[0].color = hex;
                                    }
                                }
                                //else if (layer.type === "Image")
                            }
                        }
                    });
                }
            }

            else if (layer.type === "Group") {
                if (layer.style.fills[0] != null) {
                    let rgb = HEXtoRGB(layer.style.fills[0].color);
                    let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                    let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                    layer.style.fills[0].color = hex;
                }
                if (layer.layers && layer.layers.length !== 0) {

                    layer.layers.forEach((innerLayer) => {
                        if (innerLayer.type === "Group") {
                            apply(innerLayer);
                        }
                        else {
                            if (innerLayer.type === "ShapePath" | innerLayer.type === "Shape") {
                                if (innerLayer.style.fills[0] != null) {
                                    let rgb = HEXtoRGB(innerLayer.style.fills[0].color);
                                    let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                    let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                    innerLayer.style.fills[0].color = hex;
                                }

                                if (innerLayer.style.borders[0] != null) {
                                    rgb = HEXtoRGB(innerLayer.style.borders[0].color);
                                    result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                    hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                    innerLayer.style.borders[0].color = hex;
                                }
                            }
                            else if (innerLayer.type === "Text") {
                                if (innerLayer.style.textColor != null) {
                                    let rgb = HEXtoRGB(innerLayer.style.textColor);
                                    let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                    let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                    innerLayer.style.textColor = hex;
                                }
                                if (innerLayer.style.borders[0] != null) {
                                    rgb = HEXtoRGB(innerLayer.style.borders[0].color);
                                    result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                    hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                    innerLayer.style.borders[0].color = hex;
                                }
                            }
                            // else if (layer.type === "Image")
                            else if (innerLayer.type === "SymbolInstance") {
                                if (innerLayer.style.fills[0] != null) {
                                    let rgb = HEXtoRGB(innerLayer.style.fills[0].color);
                                    let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                    let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                    innerLayer.style.fills[0].color = hex;
                                }
                                // var group = layer.master;
                                var group = innerLayer.detach();
                                if (group.layers && group.layers.length !== 0) {
                                    group.layers.forEach((innerLayer) => {
                                        if (innerLayer.type === "SymbolInstance") {
                                            apply(innerLayer);
                                        }
                                        else {
                                            if (innerLayer.type === "Group") {
                                                innerLayer.layers.forEach((innerLayer2) => {
                                                    if (innerLayer2.type === "Group") { 
                                                        apply(innerLayer2);
                                                    }
                                                    if (innerLayer2.type === "ShapePath"| innerLayer2.type === "Shape") {
                                                        if (innerLayer2.style.fills[0] != null) {
                                                            let rgb = HEXtoRGB(innerLayer2.style.fills[0].color);
                                                            let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                                            let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                                            innerLayer2.style.fills[0].color = hex;
                                                        }

                                                        if (innerLayer2.style.borders[0] != null) {
                                                            rgb = HEXtoRGB(innerLayer2.style.borders[0].color);
                                                            result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                                            hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                                            innerLayer2.style.borders[0].color = hex;
                                                        }
                                                    }
                                                    else if (innerLayer2.type === "Text") {
                                                        if (innerLayer2.style.textColor != null) {
                                                            let rgb = HEXtoRGB(innerLayer2.style.textColor);
                                                            let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                                            let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                                            innerLayer2.style.textColor = hex;
                                                        }
                                                        if (innerLayer2.style.borders[0] != null) {
                                                            rgb = HEXtoRGB(innerLayer2.style.borders[0].color);
                                                            result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                                            hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                                            innerLayer2.style.borders[0].color = hex;
                                                        }
                                                    }
                                                    //else if (layer.type === "Image")
                                                });
                                            }
                                            else {
                                                if (innerLayer.type === "ShapePath" || innerLayer.type === "Shape") {
                                                    if (innerLayer.style.fills[0] != null) {
                                                        let rgb = HEXtoRGB(innerLayer.style.fills[0].color);
                                                        let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                                        let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                                        innerLayer.style.fills[0].color = hex;
                                                    }

                                                    if (innerLayer.style.borders[0] != null) {
                                                        rgb = HEXtoRGB(innerLayer.style.borders[0].color);
                                                        result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                                        hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                                        innerLayer.style.borders[0].color = hex;
                                                    }
                                                }
                                                else if (innerLayer.type === "Text") {
                                                    if (innerLayer.style.textColor != null) {
                                                        let rgb = HEXtoRGB(innerLayer.style.textColor);
                                                        let result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                                        let hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                                        innerLayer.style.textColor = hex;
                                                    }
                                                    if (innerLayer.style.borders[0] != null) {
                                                        rgb = HEXtoRGB(innerLayer.style.borders[0].color);
                                                        result = filterFunction([rgb[0], rgb[1], rgb[2]]);
                                                        hex = rgbToHex(parseInt(result[0]), parseInt(result[1]), parseInt(result[2]));
                                                        innerLayer.style.borders[0].color = hex;
                                                    }
                                                }
                                                //else if (layer.type === "Image")
                                            }
                                        }
                                    });
                                }
                            }
                        }
                    });
                }

            }
        }))()

    }
    if (items.reportGenerate != null) {
        const selectedPage = doc.selectedPage;
        generateReport(items.reportGenerate.generatedItems, selectedPage, items.reportGenerate.header);
    }
}


function HEXtoRGB(hex) {
    return hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => '#' + r + r + g + g + b + b)
        .substring(1).match(/.{2}/g)
        .map(x => parseInt(x, 16))
}

function generateReport(items, page, header) {
    items.map((item) => {
        log(item)
        //FIXME: base64 png image make a bug
        let newArtboard = new sketch.Artboard({
            name: item.name,
            parent: page,
            frame: new sketch.Rectangle(0, 0, 595, 842)
        })
        let newImage = new sketch.Image({
            image: { base64: item.src.split(',')[1] },
            parent: newArtboard,
            frame: new sketch.Rectangle(20, header !== null ? 35 : 20, 555, 700),
        })

        let adee = new sketch.Text({
            text: "Powered by adeeapp.com",
            parent: newArtboard,
            frame: new sketch.Rectangle(250, 800, 280, 42),
        })
        if (header !== null) {
            if (header.author !== "") {
                let headerText = new sketch.Text({
                    text: "By: " + header.author,
                    parent: newArtboard,
                    frame: new sketch.Rectangle(20, 20, 277, 15),
                })
            }
            if (header.date !== "") {
                let headerText = new sketch.Text({
                    text: "Date: " + header.date,
                    parent: newArtboard,
                    frame: new sketch.Rectangle(280, 20, 280, 15),
                })
            }
        }
        if (item.comment !== "" || item.comment !== "\n") {
            let comment = new sketch.Text({
                text: item.comment,
                parent: newArtboard,
                frame: new sketch.Rectangle(20, header != null ? 735 : 720, 555, 30),
                fixedWidth: true,
                style: { fontSize: 10 }
            })
        }
        positionArtboardInPage(newArtboard, page);
    })
    UI.alert("Info", "Report Generated");
}

function rightmostLayerInPage(page) {
    return page.layers.reduce((rightMostLayer, layer) => {
        let rightMostLayerX = rightMostLayer.frame.x + rightMostLayer.frame.width;
        let layerX = layer.frame.x + layer.frame.width;
        return layerX >= rightMostLayerX ? layer : rightMostLayer;
    });
}

function topmostLayerInPage(page) {
    return page.layers.reduce((topmostLayer, layer) => {
        return layer.frame.y <= topmostLayer.frame.y ? layer : topmostLayer;
    });
}

function positionArtboardInPage(artboard, page) {
    let rightmostLayerInPageFrame = rightmostLayerInPage(page).frame;
    let newFrame = artboard.localRectToParentRect(artboard.frame);
    newFrame.x = rightmostLayerInPageFrame.x + rightmostLayerInPageFrame.width + 50;
    newFrame.y = topmostLayerInPage(page).frame.y;
    artboard.frame = newFrame;
}

function setArtboardImage(data) {
    return data.toString('base64')
}

// Get all layers and global colors info
function getAllLayersAndColors() {
    const document = sketch.getSelectedDocument();
    var selectedPage = null; 
    var page = require('sketch/dom').Page

    selectedPage = document.selectedPage;
    const colors = sketch.globalAssets.colors;


    let layers = [];
    selectedPage.layers.forEach((layer) => {
        checkLayerAndFill(layers, layer);
    });
    let data = { layers, colors }

    return JSON.stringify(data);
}

function checkLayerAndFill(prevData, layer) {
    let layers = prevData;
    if (layer.type === "ShapePath") {
        layers.push({
            id: layer.id,
            name: layer.name,
            color: (layer.style.fills[0] == null || layer.style.fills[0].fillType === "Gradient") ? "#ffffff" : layer.style.fills[0].color,
            type: 'ShapePath',
            textSize: "graphics",
            selected: layer.selected,
            frame: (layer.frame == null ? null:  layer.frame.width + "," + layer.frame.height)
        });
    } else if (layer.type === "SymbolMaster") {
        if (layer.layers && layer.layers.length !== 0) {
            layer.layers.forEach((innerLayer) => {
                checkLayerAndFill(layers, innerLayer);
            });
        }
        layers.push({
            id: layer.id,
            name: layer.name,
            color: (layer.style.fills[0] == null ? "#ffffff" : layer.style.fills[0].color),
            type: "Artboard",
            textSize: "graphics",
            selected: layer.selected,
            frame: (layer.frame == null ? null:  layer.frame.width + "," + layer.frame.height)
        })
    }
    else if (layer.type === "Text") {
        layers.push({
            id: layer.id,
            name: layer.name,
            color: layer.style.textColor,
            type: 'Text',
            textSize: findTxtSize(layer),
            selected: layer.selected,
            frame: (layer.frame == null ? null:  layer.frame.width + "," + layer.frame.height)
        });
    } else if (layer.type === "Artboard") {
        if (layer.layers && layer.layers.length !== 0) {
            layer.layers.forEach((innerLayer) => {
                checkLayerAndFill(layers, innerLayer);
            });
        }
        layers.push({
            id: layer.id,
            name: layer.name,
            color: (layer.background.color == null ? "#ffffff" :  layer.background.color),
            type: "Artboard",
            textSize: "graphics",
            selected: layer.selected, 
            frame: (layer.frame == null ? null:  layer.frame.width + "," + layer.frame.height)
        })
    } else if (layer.type === "SymbolInstance") {
        layers.push({
            id: layer.id,
            name: layer.name,
            color: (layer.style.fills[0] == null ? "#ffffff" :  layer.style.fills[0].color ),
            type: "SymbolInstance",
            textSize: "graphics",
            selected: layer.selected,
            frame: (layer.frame == null ? null:  layer.frame.width + "," + layer.frame.height)
        })
    } else if (layer.type === "Group") {
        if (layer.layers && layer.layers.length !== 0) {
            layer.layers.forEach((innerLayer) => {
                checkLayerAndFill(layers, innerLayer);
            });
        }
        layers.push({
            id: layer.id,
            name: layer.name,
            color: (layer.style.fills[0] == null ? "#ffffff" :  layer.style.fills[0].color),
            type: "Group",
            textSize: "graphics",
            selected: layer.selected,
            frame: (layer.frame == null ? null:  layer.frame.width + "," + layer.frame.height)
        })
    }
   else  if (layer.type === "Shape"){
    if (layer.layers && layer.layers.length !== 0) {
        layer.layers.forEach((innerLayer) => {
            checkLayerAndFill(layers, innerLayer);
        });
    }
        layers.push({
            id: layer.id,
            name: layer.name,
            color: (layer.style.fills[0] == null ? "#ffffff" :  layer.style.fills[0].color),
            type: "ShapePath",
            textSize: "graphics",
            selected: layer.selected,
            frame: (layer.frame == null ? null:  layer.frame.width + "," + layer.frame.height)
        })
    }
    else if (layer.type === "HotSpot") {
        layers.push({
            id: layer.id,
            name: layer.name,
            color: "#ffffff",
            type: "HotSpot",
            textSize: "graphics",
            selected: layer.selected,
            frame: (layer.frame == null ? null:  layer.frame.width + "," + layer.frame.height)
        })
    }
    return layers;
}

// Find text size
function findTxtSize(layer) {

    var txtSize = layer.style.fontSize;
    var txtWeight = layer.style.fontWeight;

    // If font weight is above Sketch level 5, then bold=true, else bold=false.
    var bold;
    if (txtWeight > 5) {
        bold = true;
    } else {
        bold = false;
    }

    // If font size is above 18.66px AND bold or above 24px and NOT bold, it is Large Text, else normal text.
    if ((txtSize >= 18.66 && bold == true) || txtSize >= 24) {
        return "large";
    } else if (txtSize < 18) {
        return "normal";
    }
}

function getFilterFunction(type) {

    if (type in colorMatrixFilterFunctions) {
        return colorMatrixFilterFunctions[type];
    } else {
        throw 'Library does not support Filter Type: ' + type;
    }
}

var ColorMatrixMatrixes = {
    Normal: {
        R: [100, 0, 0],
        G: [0, 100, 0],
        B: [0, 0, 100]
    },
    Protanopia: {
        R: [56.667, 43.333, 0],
        G: [55.833, 44.167, 0],
        B: [0, 24.167, 75.833]
    },
    Protanomaly: {
        R: [81.667, 18.333, 0],
        G: [33.333, 66.667, 0],
        B: [0, 12.5, 87.5]
    },
    Deuteranopia: {
        R: [62.5, 37.5, 0],
        G: [70, 30, 0],
        B: [0, 30, 70]
    },
    Deuteranomaly: {
        R: [80, 20, 0],
        G: [25.833, 74.167, 0],
        B: [0, 14.167, 85.833]
    },
    Tritanopia: {
        R: [95, 5, 0],
        G: [0, 43.333, 56.667],
        B: [0, 47.5, 52.5]
    },
    Tritanomaly: {
        R: [96.667, 3.333, 0],
        G: [0, 73.333, 26.667],
        B: [0, 18.333, 81.667]
    },
    Achromatopsia: {
        R: [29.9, 58.7, 11.4],
        G: [29.9, 58.7, 11.4],
        B: [29.9, 58.7, 11.4]
    },
    Achromatomaly: {
        R: [61.8, 32, 6.2],
        G: [16.3, 77.5, 6.2],
        B: [16.3, 32.0, 51.6]
    }
};

function matrixFunction(matrix) {
    return function (rgb) {
        var r = rgb[0];
        var g = rgb[1];
        var b = rgb[2];
        return [
            r * matrix.R[0] / 100.0 + g * matrix.R[1] / 100.0 + b * matrix.R[2] / 100.0,
            r * matrix.G[0] / 100.0 + g * matrix.G[1] / 100.0 + b * matrix.G[2] / 100.0,
            r * matrix.B[0] / 100.0 + g * matrix.B[1] / 100.0 + b * matrix.B[2] / 100.0
        ];
    };
}

var colorMatrixFilterFunctions = {};
for (var t in ColorMatrixMatrixes) {
    if (ColorMatrixMatrixes.hasOwnProperty(t)) {
        colorMatrixFilterFunctions[t] = matrixFunction(ColorMatrixMatrixes[t]);
    }
}

function componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

module.exports = {
    onLoad,
    onChangeAndApply,
};