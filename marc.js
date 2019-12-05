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
 * getMARCXML(body, outputFile)
 * 
 * @param {string} body
 * @param {string} [outputFile]
 */
function getMARCXML(body, outputFile)
{
    let match = body.match(/<a.*?title="MARCXML version of this record".*?href="([^"]*)".*?>/);
    if (match) {
        let urlMARC = match[1];
        console.log("found marcxml url: " + urlMARC);
        request(urlMARC, function (error, response, body) {
            if (error) {
                console.log(error.message);
                return;
            }
            if (argv['verbose']) console.log(body);
            parseMARC(body, "marcxml", outputFile);
        });
    }
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

    marc4js.parse(data, {fromFormat: format}, function(error, records) {

        if (error) {
            console.log(error.message);
            return;
        }
        console.log("read " + records.length + " record" + (records.length != 1? "s" : ""));

        if (argv['json']) {
            records.forEach((rec) => console.log(JSON.stringify(rec, null, 2)));
        }
        if (!argv['quiet']) {
            marc4js.transform(records, {toFormat: "text"}, function(error, data) {
                if (error) {
                    console.log(error.message);
                    return;
                }
                console.log(data.trim());
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
    let tweaked = false;
    if (!argv['skip']) {
        console.log("tweaks:");
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
                    tweaked = true;
                }
            };

            let addSubField = function(dataField, code, text) {
                if (dataField && !findSubField(dataField, code)) {
                    let subField = new marc4js.marc.Subfield(code, text);
                    dataField._subfields.push(subField);
                    displaySubField(subField, "add");
                    tweaked = true;
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
                    tweaked = true;
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
            * "b" (Remainder), and "c" (Statement of Responsibility) in tag "245" (Title Statement).
            * Note: this is a non-repeatable (NR) tag.
            * 
            * https://www.oclc.org/bibformats/en/2xx/245.html
            */
            dataField = findDataField(245);
            removeTrailingPunctuation(findSubField(dataField, "a"));
            removeTrailingPunctuation(findSubField(dataField, "b"));
            removeTrailingPunctuation(findSubField(dataField, "c"));

            /*
            * Next, try moving "p." or "pages" from subfield "a" (Extent) to subfield "f" (Type of Unit)
            * in tag "300" (Physical Description). Note: this is a repeatable (R) tag.
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
            * (International Standard Book Number) and remove any tags that don't match the ISBN.
            * 
            * https://www.oclc.org/bibformats/en/0xx/020.html
            */
            if (argv['isbn']) {
                let cRemoved = 0, cRetained = 0;
                while (dataField = findDataField(20, iLastDataField)) {
                    let subFieldA = findSubField(dataField, "a"); 
                    if (subFieldA) {
                        if (subFieldA._data.indexOf(argv['isbn']) == 0) {
                            removeTrailingPunctuation(subFieldA);
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
            } else {
                /*
                 * Otherwise, just display any and all ISBN numbers that are being retained (well, OK, we'll clean up
                 * any trailing punctuation in them, too).
                 */
                while (dataField = findDataField(20, iLastDataField)) {
                    let subFieldA = findSubField(dataField, "a"); 
                    if (subFieldA) {
                        removeTrailingPunctuation(subFieldA);
                        displaySubField(subFieldA);
                    }
                }
            }
        });
    }

    if (outputFile) {
        marc4js.transform(records, {}, function(error, data) {
            if (error) {
                console.log(error.message);
                return;
            }
            if (argv['overwrite'] || !fs.existsSync(outputFile)) {
                fs.writeFileSync(outputFile, data);
                console.log(outputFile + " successfully written");
            } else {
                console.log(outputFile + " already exists, use overwrite option if desired");
            }
        });
    } else {
        if (tweaked) {
            console.log("specify an output file to save the above tweaks");
        }
    }
}

/**
 * main()
 */
function main()
{
    try {
        let inputFile = argv['input'];
        let barcode = argv['barcode'];
        let outputFile = argv['output'] || (barcode? "output/" + barcode + ".mrc" : "");

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
             * If the 'input' argument appears to be a local file, read and parse it according to its
             * file extension (eg, .txt, .mrc, or .xml).  You can create your own .txt file by copying
             * and pasting MARC text data.
             * 
             * Example: https://seattle.bibliocommons.com/item/catalogue_info/3138656030
             */
            fs.readFile(inputFile, function(error, data) {
                if (error) {
                    console.log(error.message);
                    return;
                }
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
         * No input file was specified, so if an LCCN or ISBN was specified, search for it.
         */
        let type;
        if (argv[type = 'lccn'] || argv[type = 'isbn']) {
            let arg = argv[type];
            console.log("search for " + type + ": " + arg);
            let jar = request.jar();
            let requestWithCookies = request.defaults({jar});
            let urlQuery = "https://catalog.loc.gov/vwebv/searchAdvanced";
            console.log("requestURL(" + urlQuery + ")");
            requestWithCookies(urlQuery, function (error, response, body) {
                if (error) {
                    console.log(error.message);
                    return;
                }
                let codes = {
                    "isbn": "KNUM",
                    "lccn": "K010"
                }
                if (type == "lccn") {
                    let parts = arg.split('-');
                    if (parts.length > 1) {
                        if (parts[0].length == 2 || parts[0].length == 4) {
                            while (parts[1].length < 6) {
                                parts[1] = '0' + parts[1];
                            }
                        }
                        arg = parts[0] + parts[1];
                    }
                }
                let urlSearch = "https://catalog.loc.gov/vwebv/search?searchArg1=$ARG&argType1=all&searchCode1=$CODE&searchType=2&combine2=and&searchArg2=&argType2=all&searchCode2=GKEY&combine3=and&searchArg3=&argType3=all&searchCode3=GKEY&year=1519-2019&fromYear=&toYear=&location=all&place=all&type=all&language=all&recCount=25";
                urlSearch = urlSearch.replace(/\$ARG/g, arg);
                urlSearch = urlSearch.replace(/\$CODE/g, codes[type]);
                if (argv['verbose']) console.log("requestURL(" + urlSearch + ")");
                requestWithCookies(urlSearch, function (error, response, body) {
                    if (error) {
                        console.log(error.message);
                        return;
                    }
                    let match = body.match(/<title>([^<]*)<\/title>/);
                    if (match) {
                        console.log("title of search results: " + match[1]);
                        if (match[1] == "LC Catalog - Titles List") {
                            let books = [];
                            let items = body.match(/<li class="search-results-list">[\s\S]*?<\/li>/g);
                            if (items) {
                                /*
                                 * Create an array of books containing titles, authors, and links.
                                 */
                                for (let i = 0; i < items.length; i++) {
                                    let title = "", author = "", link = "";
                                    let titleMatch = items[i].match(/<div class="[^"]*search-results-list-description-title[^"]*">([\s\S]*?)<\/div>/);
                                    if (!titleMatch) continue;
                                    let linkMatch = titleMatch[1].match(/<a\s*href="([^"]*)"[^>]*>([^<]*)<\/a>/);
                                    if (linkMatch) {
                                        link = linkMatch[1];
                                        if (link[0] != '/' && link.indexOf("http") != 0) link = "https://catalog.loc.gov/vwebv/" + link;
                                        link = link.replace(/&amp;/g, '&');
                                        title = linkMatch[2];
                                    }
                                    if (argv['author']) {
                                        let authorMatch = items[i].match(/<div class="[^"]*search-results-list-description-name[^"]*">([\s\S]*?)<\/div>/);
                                        if (authorMatch) {
                                            author = authorMatch[1];
                                            if (author.toLowerCase().indexOf(argv['author'].toLowerCase()) < 0) continue;
                                        }
                                    }
                                    books.push({title, author, link});
                                }
                            }
                            console.log(books);
                            if (books.length > 1) outputFile = undefined;
                            for (let i = 0; i < books.length; i++) {
                                request(books[i].link, function (error, response, body) {
                                    if (error) {
                                        console.log(error.message);
                                        return;
                                    }
                                    getMARCXML(body, outputFile);
                                });
                            }
                            return;
                        }
                        getMARCXML(body, outputFile);
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

let argv = {}, argc = 0;
let searches = ["lccn", "isbn", "author", "barcode"];
let booleans = ["text", "json", "skip", "overwrite", "quiet", "verbose"];
for (let i = 2; i < process.argv.length; i++) {
    let arg = process.argv[i];
    if (arg.indexOf("--") == 0) arg = arg.substr(2);
    arg = arg.replace('=', ':');
    if (searches.indexOf(arg) >= 0) {
        arg += ":" + process.argv[++i];
    }
    if (arg.indexOf(':') > 0 && arg.indexOf("/") < 0) {
        let parts = arg.split(':');
        arg = parts[0];
        let value = parts[1];
        if (argv[arg] != undefined) {
            console.log("too many " + arg + " arguments");
            argc = 0;
            break;
        }
        argv[arg] = value;
        argc++;
        continue;
    }
    if (booleans.indexOf(arg) >= 0) {
        argv[arg] = true;
        argc++;
        continue;
    }
    if (!argv['input'] && !argv['isbn'] && !argv['lccn']) {
        argv['input'] = arg;
        argc++;
        continue;
    }
    if (!argv['output']) {
        argv['output'] = arg;
        argc++;
        continue;
    }
    argc = 0;
    break;
}

if (!argc) {
    let help = [
        "Usage:",
        "\tmarc [input options] [output options] [program options]",
        "",
        "Input options:",
        "\tname or URL of a MARC file (.txt, .mrc, or .xml)",
        "\tisbn:[number] to search LOC for an ISBN",
        "\tlccn:[number] to search LOC for an LCCN",
        "",
        "Output options:",
        "\tname of output file (.mrc)",
        "\tbarcode:[number] to name output file with barcode",
        "",
        "Program options:",
        "\ttext: display the MARC record(s) in text form",
        "\tjson: display the MARC record(s) in JSON form",
        "\tskip: skip any modifications to MARC record(s)",
        "\toverwrite: overwrite an existing output file",
        "\tquiet: quieter operation (doesn't automatically dump text)",
        "\tverbose: noisier operation (displays diagnostic messages)"
       ];
    help.forEach((s) => {console.log(s)});
    process.exit(1);
}

main(argv);
