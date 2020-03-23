#!/usr/bin/env node

'use strict';

const { name, version } = require('./package.json');
const process = require('process');
const fs = require('fs');
const path = require('path');
const { ncp } = require('ncp');
const rimraf = require("rimraf");
const mkdirp = require('mkdirp');

const { spawn, execFile } = require('child_process');
const { path7za } = require('7zip-bin');
const { appBuilderPath } = require('app-builder-bin');

const cli = (function() {
    const buildDir = path.resolve(__dirname, 'build');
    const packageDir = path.resolve(buildDir, `${name}-${version}`);
    const appsDir = path.resolve(packageDir, 'apps');
    const stockPortfolio = { 
        srcDir: path.resolve(__dirname, 'packages/stock-portfolio/dist'),
        destDir: appsDir
    };
    const stockCharts = {
        srcDir: path.resolve(__dirname, 'packages/stock-charts/build'),
        destDir: path.resolve(appsDir, 'stock-charts')
    };
    const stockTrading = {
        srcDir: path.resolve(__dirname, 'packages/stock-trading/dist'),
        destDir: path.resolve(appsDir, 'stock-trading')
    };
    const stockUI = {
        srcDir: path.resolve(__dirname, 'packages/stock-ui/dist'),
        destDir: path.resolve(appsDir, 'stock-ui')
    };
    const openfinRvm = {
        srcPath: path.resolve(__dirname, 'resources/win/OpenFinRVM.exe'),
        destPath: path.resolve(packageDir, 'OpenFinRVM.exe'),
    };
    const openfinLauncher = {
        srcPath: path.resolve(__dirname, 'resources/win/run.cmd'),
        destPath: path.resolve(packageDir, 'run.cmd')
    };
    const node = {
        srcPath: path.resolve(__dirname, 'resources/win/node_6.5.0.exe'),
        destPath: path.resolve(packageDir, 'node_6.5.0.exe'),
    };
    const nodeScript = {
        srcPath: path.resolve(__dirname, 'src/index.js'),
        destPath: path.resolve(packageDir, 'index.js'),
    };

    function executeCommand(command) {
        switch (command) {
            case '--build-package':
                buildPackage();
                break;

            case '--build-portable':
                buildPortable();
                break;
            
            case '--update-version':
                updateVersion();
                break;
            
            default:
                console.log(`Unknown command "${command}" specified`);
                process.exit(1);
                break;
        }
    }

    function updateVersion() {
        console.log('Updating version...');

        const filePath = path.resolve(__dirname, 'packages/stock-core/version.js');
        const fileContent = [
            `// IMPORTANT: THIS FILE IS AUTO GENERATED!`,
            `export const Version = '${version}';`
        ].join('\n');

        fs.writeFile(filePath, fileContent, 'utf8', (err) => {
            if (err) {
                console.error('Error occured while updating version');
                console.error(err);
                process.exit(1);
            }

            console.log("Version updated successfully");
        }); 
    }

    function buildPortable() {
        console.log('Building portable...');

        const exports = {
            buildDir: buildDir,
            packageDir: packageDir,
            removeFile: removeFile,
            readFile: readFile
        };

        NsisApi.buildPortable(exports).then(() => {
            console.log("Portable built successfully");
        }).catch((err) => {
            console.error('Error occured while building portable');
            console.error(err);
            process.exit(1);
        });
    }

    function buildPackage() {
        console.log('Building package...');

        Promise.resolve()
            .then(() => removeDir(appsDir))
            .then(() => makeDir(appsDir))
            .then(() => { 
                return Promise.all([
                    copyDir(stockPortfolio.srcDir, stockPortfolio.destDir),
                    copyDir(stockCharts.srcDir, stockCharts.destDir),
                    copyDir(stockTrading.srcDir, stockTrading.destDir),
                    copyDir(stockUI.srcDir, stockUI.destDir),
                    copyFile(openfinRvm.srcPath, openfinRvm.destPath),
                    copyFile(openfinLauncher.srcPath, openfinLauncher.destPath),
                    copyFile(node.srcPath, node.destPath),
                    copyFile(nodeScript.srcPath, nodeScript.destPath)
                ]);
            })
            .then(() => { 
                console.log('Package built successfully');
                process.exit(0);
            })
            .catch(err => {
                console.error('Error occured while building package');
                console.error(err);
                process.exit(1);
            });
    }

    function removeFile(path) {
        if (!fs.existsSync(path)) {
            return Promise.resolve();
        }

        let promise = new Promise((resolve, reject) => {
            fs.unlink(path, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        return promise;
    }

    function readFile(path) {
        let promise = new Promise((resolve, reject) => {
            fs.readFile(path, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(data);
                }
            });
        });
        return promise;
    }

    function copyFile(sourcePath, destPath) {
        let promise = new Promise((resolve, reject) => {
            fs.copyFile(sourcePath, destPath, (err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        return promise;
    }

    function removeDir(path) {
        let promise = new Promise((resolve, reject) => {
            rimraf(path, function (err) { 
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        return promise;
    }
    
    function copyDir(sourcePath, destPath) {
        let promise = new Promise((resolve, reject) => {
            ncp.limit = 16;
            ncp(sourcePath, destPath, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        return promise;
    }

    function makeDir(path) {
        let promise = new Promise((resolve, reject) => {
            mkdirp(path, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
        return promise;
    }

    return {
        run: function () {
            const args = process.argv.slice(2);
            if (args.length !== 1) {
                console.log(`Incorrect command "${args}" specified`);
                process.exit(1);
            }

            executeCommand(args[0]);
        }
    };
})();

const NsisApi = (function() {
    const nsisScript = {
        path: path.resolve(__dirname, 'resources/nsis/portable.nsi'),
    };

    const binariesCache = new Map();

    function archive7z(outFile, dirToArchive) {
        const args = [
            'a',
            '-bd',
            '-mx=9',
            '-mtc=off',
            '-mtm=off',
            '-mta=off',
            outFile,
            '.'
        ];

        const options = {
            cwd: dirToArchive
        };

        return exec(path7za, args, options);
    }

    function exec(file, args, options){
        return new Promise((resolve, reject) => {
            execFile(file, args, {
                ...options,
                maxBuffer: 1000 * 1024 * 1024
            }, (error, stdout, stderr) => {
                if (error == null) {
                    resolve(stdout.toString());
                }
                else {
                    let message = `Exit code: ${error.code}. ${error.message}`;
                    if (stdout.length !== 0) {
                        message += `\n${stdout.toString()}`;
                    }
                    if (stderr.length !== 0) {
                        message += `\n${stderr.toString()}`;
                    }
        
                    reject(new Error(message));
                }
          });
        });
    }

    function makeNsis(defines, commands, script) {
        const binaries = {};
        return getBinFromUrl("nsis", "3.0.4", "MNETIF8tex6+oiA0mgBi3/XKNH+jog4IBUp/F+Or7zUEhIP+c7cRjb9qGuBIofAXQ51z3RpyCfII4aPadsZB5Q==")
            .then(nsisPath => { 
                binaries.nsisPath = nsisPath;
                console.log(`NsisPath: ${nsisPath}`);
                return getBinFromUrl("nsis-resources", "3.4.1", "Dqd6g+2buwwvoG1Vyf6BHR1b+25QMmPcwZx40atOT57gH27rkjOei1L0JTldxZu4NFoEmW4kJgZ3DlSWVON3+Q==");
            })
            .then(nsisResourcePath => {
                binaries.nsisResourcePath = nsisResourcePath;
                console.log(`NsisResourcePath: ${nsisResourcePath}`);
            })
            .then(() => {
                const command = path.join(
                    binaries.nsisPath, 
                    process.platform === "darwin" ? "mac" : (process.platform === "win32" ? "Bin" : "linux"), 
                    process.platform === "win32" ? "makensis.exe" : "makensis");
                const args = buildNsisArgs(defines, commands, binaries.nsisResourcePath);
                return spawnAndWrite(command, args, script, {
                    env: {
                        ...process.env,
                        NSISDIR: binaries.nsisPath
                    }
                });
            });
    }

    function buildNsisArgs(defines, commands, nsisResourcePath) {
        const args = ["-WX"];

        const pluginsArch = 'x86-ansi';
        defines.PLUGINS_ARCH = pluginsArch;
        defines.PLUGINS_PATH = path.resolve(nsisResourcePath, 'plugins', pluginsArch);

        for (const name of Object.keys(defines)) {
            const value = defines[name];
            args.push(`-D${name}=${value}`);
        }

        for (const name of Object.keys(commands)) {
            const value = commands[name];
            args.push(`-X${name} ${value}`);
        }

        args.push("-");

        return args;
    }

    function spawnAndWrite(command, args, data, options) {
        try {
            const childProcess = spawn(command, args, {
                env: options.env,
                stdio: ["pipe", "ignore", "inherit"]
            });
            const timeout = setTimeout(() => childProcess.kill(), 4 * 60 * 1000);
            return new Promise((resolve, reject) => {
                handleProcess("close", childProcess, command, () => {
                        try {
                            clearTimeout(timeout);
                        }
                        finally {
                            resolve();
                        }
                    }, error => {
                        try {
                            clearTimeout(timeout);
                        }
                        finally {
                            reject(error.stack || error.toString());
                        }
                    });
      
                const stdin = childProcess.stdin;
                if (stdin) {
                    stdin.end(data);
                }
            });
        }
        catch (e) {
            throw new Error(`Cannot spawn ${command}: ${e.stack || e}`);
        }        
    }

    function getBinFromUrl(name, version, checksum) {
        const dirName = `${name}-${version}`;
        const baseUrl = "https://github.com/electron-userland/electron-builder-binaries/releases/download/";
        let url = `${baseUrl}${dirName}/${dirName}.7z`;
        
        return getBin(dirName, url, checksum);
    }
    
    function getBin(name, url, checksum) {
        let promise = binariesCache.get(name);
        // if rejected, we will try to download again
        if (promise != null) {
            return promise;
        }
    
        promise = doGetBin(name, url, checksum);
        binariesCache.set(name, promise);
        return promise;
    }

    function doGetBin(name, url, checksum) {
        const args = ["download-artifact", "--name", name];
        if (url != null) {
          args.push("--url", url);
        }
        if (checksum != null) {
          args.push("--sha512", checksum);
        }
        return executeAppBuilder(args);
    }

    function executeAppBuilder(args) {
        return new Promise((resolve, reject) => {
            const command = appBuilderPath;        
            const env = {
                ...process.env,
                SZA_PATH: path7za
            };
            try {
                const childProcess = spawn(command, args, {
                    env,
                    stdio: ["ignore", "pipe", process.stdout]
                });
                handleProcess("close", childProcess, command, resolve, error => {
                    reject(error);
                });
            }
            catch (e) {
                throw new Error(`Cannot spawn ${command}: ${e.stack || e}`);
            }
        });
    }

    function handleProcess(event, childProcess, command, resolve, reject) {
        childProcess.on("error", reject);
        
        let out = "";
        if (childProcess.stdout != null) {
            childProcess.stdout.on("data", (data) => {
                out += data;
            });
        }
        
        let errorOut = "";
        if (childProcess.stderr != null) {
            childProcess.stderr.on("data", (data) => {
                errorOut += data;
            });
        }
        
        childProcess.once(event, (code) => {
            if (code === 0) {
                if (resolve != null) {
                    resolve(out);
                }
            }
            else {
                let message = `${command} exited with code ${code}`;
                message += `${formatOut(out, "Output")}`;
                message += `${formatOut(errorOut, "Error output")}`; 

                reject(new Error(message));
            }
        });
    }    
      
    function formatOut(text, title) {
        return text.length === 0 ? "" : `\n${title}:\n${text}`;
    }

    return {
        buildPortable: function(io) {
            const archiveFile = path.resolve(io.buildDir, `${name}-${version}-x64.nsis.7z`);

            const defines = {
                APP_64: archiveFile,
                APP_NAME: name,
                APP_VERSION: version,
                APP_EXE: 'run.cmd --wait-for-exit'
            };

            const commands = {
                OutFile: path.resolve(io.buildDir, `${name}-${version}.exe`),
                Icon: path.resolve(__dirname, 'resources/icon.ico')
            };

            return io.removeFile(archiveFile).then(() => {
                return archive7z(archiveFile, io.packageDir);
            }).then(() => {
                return io.readFile(nsisScript.path);
            }).then(script => {
                return makeNsis(defines, commands, script);
            }).then(() => {            
                return io.removeFile(archiveFile);
            });
        }
    };
})();

cli.run();