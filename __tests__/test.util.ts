const cleanCSS =  require("clean-css");
const glob = require("glob");
const path = require('path');
const fs = require('fs');
const postcss = require('postcss');
const sass = require('postcss-node-sass');

import {ProcessOptions} from "postcss";
import palette from './palettes/palette';
import tinyPalette from './palettes/tiny-palette';
import unmatchPallete from './palettes/unmatch-palette';

const {initThemify, themify} = require('../src/index');

export class TestUtils {

    private static _cleanCss;
    private static get cleanCss() {
        if (!this._cleanCss) {
            this._cleanCss = new cleanCSS({});
        }
        return this._cleanCss;
    }

    static plugin = {
        initThemify,
        sass,
        themify
    };

    static get defaultPalette() {
        return palette;
    }
    static get tinyPalette() {
        return tinyPalette;
    }
    static get unmatchPalette() {
        return unmatchPallete;
    }

    static run(suite: string, filesGlob: string, plugins: any[], withError = false) {
        const inputFiles = glob.sync(filesGlob);
        describe(suite, () => {
            inputFiles.forEach((inputFile) => {
                const testName = this.getTestName(inputFile);
                it(testName, () => {
                    return this.testFile(inputFile, plugins, withError);
                });
            });
        });
    }

    static testFile(inputFilename: string, plugins: any[], withError = false): any {

        const outputFile = `./${inputFilename.replace('input', 'output')}`;
        const expected = this.readFile(outputFile);

        const exp = expect(this.processFile(inputFilename, plugins));
        if (withError) {
            return exp.rejects.toMatch(expected);
        }
        return exp.resolves.toEqual(this.minify(expected));
    }

    static processFile(inputFilename: string, plugins: any[]) {
        const inputFile = `./${inputFilename}`;
        const outputFile = `./${inputFilename.replace('input', 'output')}`;
        const input = this.readFile(inputFile);

        const options: ProcessOptions = {};
        options.from = inputFile;
        options.to = outputFile;

        return postcss(plugins)
            .process(input, options)
            .then(result => {
                return this.minify(result.css);
            }, error => {
                throw error.message;
            });
    }

    static minify(css) {
        return this.cleanCss.minify(css).styles;
    }

    static readFile(fileName) {
        return fs.readFileSync(fileName, 'utf8').toString();
    }

    static getTestName(filePath) {
        const fileName = path.basename(filePath);
        const inputPos = fileName.indexOf(".input");
        return fileName.substring(0, inputPos);
    }
}
