#!/usr/bin/env node
/**
 * @fileoverview Tool for inspecting and modifying MARC files
 * @author <a href="mailto:Jeff@pcjs.org">Jeff Parsons</a>
 */

"use strict";

var fs = require("fs");
var marc4js = require("marc4js");       // from https://github.com/jiaola/marc4js
let request = require("request");

/**
 * requestURL(url, file, done)
 * 
 * @param {string} url
 * @param {string} [file]
 * @param {function()} [done]
 */
function requestURL(url, file, done)
{
    console.log("requestURL(" + url + ")");
    request(url, function(error, response, body) {
        if (error) {
            console.error(error);
            if (done) done();
            return;
        }
        if (file) fs.writeFileSync(file, body);
        if (done) done(body);
    });
}

/**
 * parseMARC(data, format, outputFile)
 * 
 * @param {string} data
 * @param {string} format
 * @param {string} [outputFile]
 */
function parseMARC(data, format, outputFile)
{
    console.log("parsing MARC as '" + format + "'");

    marc4js.parse(data, {fromFormat: format}, function(err, records) {

        if (err) throw err;
        console.log("read " + records.length + " record" + (records.length != 1? "s" : ""));

        if (args['json']) {
            records.forEach((rec) => console.log(JSON.stringify(rec, null, 2)));
        }
        if (args['text']) {
            marc4js.transform(records, {toFormat: "text"}, function(err, data) {
                if (err) throw err;
                console.log(data);
                tweakMARC(records, outputFile);
            });
            return;
        }
        tweakMARC(records, outputFile);
    });
}

/**
 * tweakMARC(records, outputFile)
 * 
 * @param {Array} records
 * @param {string} [outputFile]
 */
function tweakMARC(records, outputFile)
{
    let modified = false;

    records.forEach((rec) => {
        let tagCurrent;
        let dataField, iLastDataField = -1;

        let findDataField = function(tag, iLast = -1) {
            let dataFields = rec._dataFields;
            for (let i = iLast+1; i < dataFields.length; i++) {
                let dataField = dataFields[i];
                if (+dataField._tag == tag) {
                    tagCurrent = dataField._tag;
                    iLastDataField = i;
                    return dataField;
                }
            }
            iLastDataField = -1;
            return null;
        };

        let removeDataField = function(subField) {
            let dataFields = rec._dataFields;
            if (iLastDataField >= 0) {
                displaySubField(subField, "del");
                dataFields.splice(iLastDataField, 1);
                iLastDataField = -1;
                modified = true;
            }
        };

        let addSubField = function(dataField, code, text) {
            if (dataField && !findSubField(dataField, code)) {
                let subField = {_code: code, _data: text};
                dataField._subfields.push(subField);
                displaySubField(subField, "add");
                modified = true;
                return true;
            }
            return false;
        };

        let displaySubField = function(subField, op = "sav") {
            console.log('tag ' + tagCurrent + ' ' + op + ' subField "' + subField._code + '": "' + subField._data + '"');
        };

        let findSubField = function(dataField, code) {
            if (dataField) {
                let subFields = dataField._subfields;
                for (let i = 0; i < subFields.length; i++) {
                    let subField = subFields[i];
                    if (subField._code == code) {
                        return subField;
                    }
                }
            }
            return null;
        };

        let removeTrailingPunctuation = function(subField) {
            if (subField) {
                let match = subField._data.match(/^(.*?)\s*[/,.:;]$/);
                if (match) {
                    if (replaceSubField(subField, match[1])) {
                        return true;
                    }
                }
            }
            return false;
        };

        let removeTrailingPages = function(subField) {
            if (subField) {
                let match = subField._data.match(/^(.*?)\s*(pages|p\.)$/);
                if (match) {
                    if (replaceSubField(subField, match[1])) {
                        return match[2];
                    }
                }
            }
            return null;
        };
        
        let replaceSubField = function(subField, text) {
            if (subField._data != text) {
                displaySubField(subField, "old");
                subField._data = text;
                displaySubField(subField, "new");
                modified = true;
                return true;
            }
            displaySubField(subField);
            return false;
        };

        /*
         * Each dataField object has the following keys:
         *
         *      _tag
         *      _indicator1
         *      _indicator2
         *      _subfields
         * 
         * Let's start by removing unwanted trailing punctuation in subfields "a" (Title),
         * "b" (Remainder), and "c" (Statement of Responsibility) in tag "245".  Note: this is
         * a non-repeatable (NR) tag.
         * 
         * https://www.oclc.org/bibformats/en/2xx/245.html
         */
        dataField = findDataField(245);
        removeTrailingPunctuation(findSubField(dataField, "a"));
        removeTrailingPunctuation(findSubField(dataField, "b"));
        removeTrailingPunctuation(findSubField(dataField, "c"));

        /*
         * Next, try moving "p." or "pages" from subfield "a" (Extent) to subfield "f" (Type of Unit)
         * in tag "300". Note: this is an repeatable (R) tag.
         * 
         * https://www.oclc.org/bibformats/en/3xx/300.html
         */
        while (dataField = findDataField(300, iLastDataField)) {
            let subFieldF = findSubField(dataField, "f");
            if (!subFieldF) {
                let subFieldA = findSubField(dataField, "a");
                removeTrailingPunctuation(subFieldA);
                let text = removeTrailingPages(subFieldA);
                if (text) {
                    addSubField(dataField, "f", "pages");
                }
            }
        }

        /*
         * Next, if an ISBN was specified, look for a matching subfield "a" of all "020" tags
         * and remove any tags that don't match the ISBN.
         * 
         * https://www.oclc.org/bibformats/en/0xx/020.html
         */
        if (args['isbn']) {
            let cRemoved = 0, cRetained = 0;
            while (dataField = findDataField(20, iLastDataField)) {
                let subFieldA = findSubField(dataField, "a"); 
                if (subFieldA) {
                    if (subFieldA._data == args['isbn']) {
                        displaySubField(subFieldA);
                        cRetained++;
                    } else {
                        removeDataField(subFieldA);
                        cRemoved++;
                    }
                }
            }
            if (cRemoved && !cRetained) {
                console.log("warning: no ISBN records retained");
            }
        }
    });

    if (modified) {
        if (outputFile) {
            marc4js.transform(records, {}, function(err, data) {
                if (err) throw err;
                if (!fs.existsSync(outputFile)) {
                    fs.writeFileSync(outputFile, data);
                } else {
                    console.log(outputFile + " already exists");
                }
            });
        } else {
            console.log("specify an output file to save modifications");
        }
    }
}

/**
 * main(args)
 *
 * @param {Object} args
 */
function main(args)
{
    try {
        let inputFile = args['input'];
        let barcode = args['barcode'];
        let outputFile = args['output'] || (barcode? "output/" + barcode + ".mrc" : "");

        if (inputFile) {
            /*
             * If the 'input' argument appears to be an LOC 'marcxml' resource, download and parse it.
             *
             * Example: node marc.js https://lccn.loc.gov/2012939473/marcxml
             */
            if (inputFile.indexOf("http") == 0) {
                if (inputFile.indexOf("marcxml") > 0) {
                    requestURL(inputFile, null, function(data) {
                        console.log("downloaded " + data.length + " bytes");
                        parseMARC(data, "marcxml", outputFile);
                    });
                    return;
                }
                console.log("unrecognized URL");
                return;
            }
            /*
             * If the 'input' argument appears to be a local file, download it, and parse it according to
             * its file extension (eg, .txt, .mrc, or .xml).  You can create your own .txt file by copying
             * and pasting MARC text data.
             * 
             * Example: https://seattle.bibliocommons.com/item/catalogue_info/3138656030
             */
            fs.readFile(inputFile, function(error, data) {
                if (error) throw error;
                let format;
                if (inputFile.indexOf(".txt") > 0) {
                    format = "text";
                } else if (inputFile.indexOf(".mrc") > 0) {
                    format = "iso2709";
                } else if (inputFile.indexOf(".xml") > 0) {
                    format = "marcxml";
                }
                if (format) {
                    parseMARC(data, format, outputFile);
                    return;
                }
                console.log("unknown file format");
                console.log(data);
            });
            return;
        }
        /*
         * No input file was specified, so if an ISBN was specified, search for it.
         */
        if (args['isbn']) {
            let jar = request.jar();
            let requestWithCookies = request.defaults({jar});
            let urlQuery = "https://catalog.loc.gov/vwebv/searchAdvanced";
            console.log("requestURL(" + urlQuery + ")");
            requestWithCookies(urlQuery, function (error, response, body) {
                if (error) throw error;
                let urlSearch = "https://catalog.loc.gov/vwebv/search?searchArg1=$ISBN&argType1=all&searchCode1=KNUM&searchType=2&combine2=and&searchArg2=&argType2=all&searchCode2=GKEY&combine3=and&searchArg3=&argType3=all&searchCode3=GKEY&year=1519-2019&fromYear=&toYear=&location=all&place=all&type=all&language=all&recCount=25";
                urlSearch = urlSearch.replace(/\$ISBN/g, args['isbn']);
                console.log("requestURL(" + urlSearch + ")");
                requestWithCookies(urlSearch, function (error, response, body) {
                    if (error) throw error;
                    let match = body.match(/<title>([^<]*)<\/title>/);
                    if (match) console.log("title of search results: " + match[1]);
                    match = body.match(/<a.*?title="MARCXML version of this record".*?href="([^"]*)".*?>/);
                    if (match) {
                        let urlMARC = match[1];
                        console.log("found marcxml url: " + urlMARC);
                        requestWithCookies(urlMARC, function (error, response, body) {
                            if (error) throw error;
                            if (args['verbose']) console.log(body);
                            parseMARC(body, "marcxml", outputFile);
                        });
                    }
                });
            });
            return;
        }
        console.log("nothing to do");
    }
    catch (err) {
        console.log(err.message);
    }
}

let args = {};
for (let i = 2; i < process.argv.length; i++) {
    let arg = process.argv[i];
    if (arg.indexOf('--') == 0) {
        arg = arg.substr(2);
        let parts = arg.split('=');
        let value = true;
        if (parts.length > 1) {
            arg = parts[0];
            value = parts[1];
        }
        if (args[arg] != undefined) {
            console.log("too many '" + arg + "' arguments");
            args = null;
            break;
        }
        args[arg] = value;
        continue;
    }
    if (!args['input']) {
        args['input'] = arg;
        continue;
    }
    if (!args['output']) {
        args['output'] = arg;
        continue;
    }
    args = null;
    break;
}

if (!args) {
    console.log("usage: node marc.js [input file] [output file]");
    process.exit(1);
}

main(args);
